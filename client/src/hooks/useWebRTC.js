import { useCallback, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const useWebRTC = (roomId, user, onMeetingEnded) => {
  const cleanRoomId = (roomId || '').trim().toLowerCase();

  const [localStream, setLocalStream] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);

  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const iceCandidatesQueueRef = useRef(new Map()); // socketId -> RTCIceCandidateInit[]
  const socketRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  // Flush queued ICE candidates after setRemoteDescription
  const flushQueuedCandidates = useCallback(async (targetSocketId, pc) => {
    const queue = iceCandidatesQueueRef.current.get(targetSocketId);
    if (!queue || queue.length === 0) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Could not add queued candidate:', err.message);
      }
    }
    iceCandidatesQueueRef.current.delete(targetSocketId);
  }, []);

  // Initialize local camera and microphone stream
  const initLocalStream = useCallback(async () => {
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);

        // Add tracks to any existing peer connections
        peersRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          stream.getTracks().forEach((track) => {
            const hasTrack = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasTrack) {
              pc.addTrack(track, stream);
            }
          });
        });

        return stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, attempting audio-only:", err.message);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnlyStream;
        cameraStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setVideoEnabled(false);
        return audioOnlyStream;
      } catch (audioErr) {
        console.warn("Microphone also unavailable. Running in view-only mode:", audioErr.message);
        setAudioEnabled(false);
        setVideoEnabled(false);
      }
    }
    return null;
  }, []);

  // Helper to create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peersRef.current.has(targetSocketId)) {
      return peersRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetSocketId, pc);

    // Add local tracks (or screen track) to peer connection
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          senderSocketId: socketRef.current.id,
          candidate: event.candidate,
        });
      }
    };

    // When remote track is received
    pc.ontrack = (event) => {
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      } else if (!stream.getTracks().includes(event.track)) {
        stream.addTrack(event.track);
      }

      // Re-create MediaStream instance with all tracks to guarantee React re-render & srcObject refresh
      const newMediaStream = new MediaStream(stream.getTracks());

      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.socketId === targetSocketId);
        if (existing) {
          return prev.map((u) =>
            u.socketId === targetSocketId 
              ? { 
                  ...u, 
                  stream: newMediaStream,
                  videoEnabled: newMediaStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live'),
                  audioEnabled: newMediaStream.getAudioTracks().some(t => t.enabled && t.readyState === 'live')
                } 
              : u
          );
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            userName: 'Participant',
            stream: newMediaStream,
            audioEnabled: newMediaStream.getAudioTracks().some(t => t.enabled && t.readyState === 'live'),
            videoEnabled: newMediaStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live'),
            isHost: false,
            isScreenShare: false,
          },
        ];
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peersRef.current.delete(targetSocketId);
        iceCandidatesQueueRef.current.delete(targetSocketId);
        setRemoteUsers((prev) => prev.filter((u) => u.socketId !== targetSocketId));
      }
    };

    return pc;
  }, []);

  useEffect(() => {
    // Only connect once user is authenticated and cleanRoomId exists
    if (!cleanRoomId || !user?.id) return;

    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    const setupAndJoin = async () => {
      const stream = await initLocalStream();
      if (!isMounted) return;

      if (!socket.connected) {
        socket.connect();
      }

      const currentUser = userRef.current;
      const userData = {
        id: currentUser?.id,
        name: currentUser?.fullName || currentUser?.name || 'Member',
        imageUrl: currentUser?.imageUrl || '',
      };

      // Join the meeting room
      socket.emit('join-room', {
        roomId: cleanRoomId,
        user: userData,
        audioEnabled: stream ? stream.getAudioTracks().some((t) => t.enabled) : false,
        videoEnabled: stream ? stream.getVideoTracks().some((t) => t.enabled) : false,
      });

      // Existing room participants sent by server to newcomer
      socket.on('all-users', async (users) => {
        if (!users || !Array.isArray(users)) return;

        for (const existingUser of users) {
          if (!existingUser.socketId || existingUser.socketId === socket.id) continue;

          const pc = createPeerConnection(existingUser.socketId);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('offer', {
              targetSocketId: existingUser.socketId,
              callerSocketId: socket.id,
              sdp: offer,
            });

            setRemoteUsers((prev) => {
              if (prev.some((u) => u.socketId === existingUser.socketId)) return prev;
              return [
                ...prev,
                {
                  socketId: existingUser.socketId,
                  userId: existingUser.userId,
                  userName: existingUser.username || 'Participant',
                  audioEnabled: existingUser.audioEnabled ?? true,
                  videoEnabled: existingUser.videoEnabled ?? true,
                  isHost: existingUser.isHost ?? false,
                  stream: null,
                },
              ];
            });
          } catch (err) {
            console.error('Error creating offer for existing user:', err);
          }
        }
      });

      // Receiving WebRTC Offer from a newly joined peer
      socket.on('offer', async ({ callerSocketId, sdp, callerUser }) => {
        if (!callerSocketId) return;

        const pc = createPeerConnection(callerSocketId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushQueuedCandidates(callerSocketId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            targetSocketId: callerSocketId,
            responderSocketId: socket.id,
            sdp: answer,
          });

          setRemoteUsers((prev) => {
            const displayName = callerUser?.username || callerUser?.name || 'Participant';
            if (prev.some((u) => u.socketId === callerSocketId)) {
              return prev.map((u) =>
                u.socketId === callerSocketId
                  ? {
                      ...u,
                      userName: displayName,
                      audioEnabled: callerUser?.audioEnabled ?? u.audioEnabled,
                      videoEnabled: callerUser?.videoEnabled ?? u.videoEnabled,
                    }
                  : u
              );
            }
            return [
              ...prev,
              {
                socketId: callerSocketId,
                userId: callerUser?.userId || callerUser?.id,
                userName: displayName,
                audioEnabled: callerUser?.audioEnabled ?? true,
                videoEnabled: callerUser?.videoEnabled ?? true,
                isHost: callerUser?.isHost ?? false,
                stream: null,
              },
            ];
          });
        } catch (err) {
          console.error('Error processing received offer:', err);
        }
      });

      // Receiving WebRTC Answer from peer
      socket.on('answer', async ({ responderSocketId, sdp }) => {
        if (!responderSocketId) return;
        const pc = peersRef.current.get(responderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await flushQueuedCandidates(responderSocketId, pc);
          } catch (err) {
            console.error('Error applying remote answer description:', err);
          }
        }
      });

      // Receiving ICE candidate with buffering
      socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
        if (!senderSocketId || !candidate) return;
        const pc = peersRef.current.get(senderSocketId);

        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn('Error adding received ICE candidate:', err);
          }
        } else {
          if (!iceCandidatesQueueRef.current.has(senderSocketId)) {
            iceCandidatesQueueRef.current.set(senderSocketId, []);
          }
          iceCandidatesQueueRef.current.get(senderSocketId).push(candidate);
        }
      });

      // New user joined room
      socket.on('user-joined', (newUser) => {
        if (!newUser || !newUser.socketId || newUser.socketId === socket.id) return;

        const displayName = newUser.username || newUser.name || 'A participant';
        toast(`${displayName} joined the meeting`, {
          icon: '👋',
        });

        setRemoteUsers((prev) => {
          if (prev.some((u) => u.socketId === newUser.socketId)) return prev;
          return [
            ...prev,
            {
              socketId: newUser.socketId,
              userId: newUser.userId,
              userName: displayName,
              audioEnabled: newUser.audioEnabled ?? true,
              videoEnabled: newUser.videoEnabled ?? true,
              isHost: newUser.isHost ?? false,
              stream: null,
            },
          ];
        });
      });

      // Remote user audio toggle
      socket.on('user-toggle-audio', ({ socketId, audioEnabled: peerAudio }) => {
        setRemoteUsers((prev) =>
          prev.map((u) => (u.socketId === socketId ? { ...u, audioEnabled: peerAudio } : u))
        );
      });

      // Remote user video toggle
      socket.on('user-toggle-video', ({ socketId, videoEnabled: peerVideo }) => {
        setRemoteUsers((prev) =>
          prev.map((u) => (u.socketId === socketId ? { ...u, videoEnabled: peerVideo } : u))
        );
      });

      // Remote user screen share toggle
      socket.on('user-toggle-screen-share', ({ socketId, isScreenSharing: peerScreenShare }) => {
        setRemoteUsers((prev) =>
          prev.map((u) => (u.socketId === socketId ? { ...u, isScreenShare: peerScreenShare } : u))
        );
      });

      // Remote user left
      socket.on('user-left', ({ socketId, username }) => {
        if (username) {
          toast(`${username} left the meeting`, { icon: '🚪' });
        }
        const pc = peersRef.current.get(socketId);
        if (pc) {
          pc.close();
          peersRef.current.delete(socketId);
        }
        iceCandidatesQueueRef.current.delete(socketId);
        setRemoteUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      });

      // Meeting ended by host
      socket.on('meeting-ended', ({ message }) => {
        toast.error(message || 'The meeting has ended');
        if (onMeetingEnded) {
          onMeetingEnded(message || 'Meeting ended');
        }
      });
    };

    setupAndJoin();

    return () => {
      isMounted = false;
      // Close all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      iceCandidatesQueueRef.current.clear();

      // Stop camera/mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId: cleanRoomId });
        socketRef.current.off('all-users');
        socketRef.current.off('offer');
        socketRef.current.off('answer');
        socketRef.current.off('ice-candidate');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-toggle-audio');
        socketRef.current.off('user-toggle-video');
        socketRef.current.off('user-toggle-screen-share');
        socketRef.current.off('user-left');
        socketRef.current.off('meeting-ended');
      }
    };
  }, [cleanRoomId, user?.id, createPeerConnection, initLocalStream, flushQueuedCandidates, onMeetingEnded]);

  // Toggle local mic
  const toggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = newState;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('toggle-audio', {
        roomId: cleanRoomId,
        audioEnabled: newState,
      });
    }

    toast(newState ? 'Microphone on' : 'Microphone muted', {
      icon: newState ? '🎙️' : '🔇',
    });
  }, [audioEnabled, cleanRoomId]);

  // Toggle local camera
  const toggleVideo = useCallback(() => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);

    if (cameraStreamRef.current) {
      const videoTrack = cameraStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = newState;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('toggle-video', {
        roomId: cleanRoomId,
        videoEnabled: newState,
      });
    }

    toast(newState ? 'Camera on' : 'Camera off', {
      icon: newState ? '📹' : '📷',
    });
  }, [videoEnabled, cleanRoomId]);

  // Screen share (Zoom/Google Meet style)
  const stopScreenSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Restore camera video track on all peer connections
    if (cameraStreamRef.current) {
      const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }
      setLocalStream(cameraStreamRef.current);
      localStreamRef.current = cameraStreamRef.current;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('toggle-screen-share', {
        roomId: cleanRoomId,
        isScreenSharing: false,
      });
    }

    setIsScreenSharing(false);
    toast('Screen sharing stopped', { icon: '🖥️' });
  }, [cleanRoomId]);

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
          },
          audio: false,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track across all RTCPeerConnections
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, screenStream);
          }
        });

        // Set presenter's local stream to the screen share stream so presenter sees their screen
        const compositeScreenStream = new MediaStream([
          screenTrack,
          ...(cameraStreamRef.current ? cameraStreamRef.current.getAudioTracks() : [])
        ]);
        localStreamRef.current = compositeScreenStream;
        setLocalStream(compositeScreenStream);

        // Notify peers via socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('toggle-screen-share', {
            roomId: cleanRoomId,
            isScreenSharing: true,
          });
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        toast.success('Screen sharing active');
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          console.error('Error starting screen share:', err);
          toast.error('Could not start screen sharing');
        }
      }
    } else {
      stopScreenSharing();
    }
  }, [isScreenSharing, cleanRoomId, stopScreenSharing]);

  // End meeting for all participants
  const endMeeting = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end-meeting', { roomId: cleanRoomId });
    }
    if (onMeetingEnded) {
      onMeetingEnded('Meeting ended by host');
    }
  }, [cleanRoomId, onMeetingEnded]);

  // Leave meeting individually
  const leaveMeeting = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave-room', { roomId: cleanRoomId });
    }
    if (onMeetingEnded) {
      onMeetingEnded('You left the meeting');
    }
  }, [cleanRoomId, onMeetingEnded]);

  return {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    activeSpeakerId,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endMeeting,
    leaveMeeting,
  };
};

export default useWebRTC;
