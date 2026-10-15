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
  const [localStream, setLocalStream] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);

  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const socketRef = useRef(null);

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
        setLocalStream(stream);
        return stream;
      }
    } catch (err) {
      console.warn("Camera/Mic access denied or unavailable, attempting audio-only:", err.message);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnlyStream;
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
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetSocketId, pc);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
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
      const [remoteStream] = event.streams;
      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.socketId === targetSocketId);
        if (existing) {
          return prev.map((u) =>
            u.socketId === targetSocketId ? { ...u, stream: remoteStream } : u
          );
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            userName: 'Participant',
            stream: remoteStream,
            audioEnabled: true,
            videoEnabled: true,
          },
        ];
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peersRef.current.delete(targetSocketId);
        setRemoteUsers((prev) => prev.filter((u) => u.socketId !== targetSocketId));
      }
    };

    return pc;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    const setupAndJoin = async () => {
      const stream = await initLocalStream();
      if (!isMounted) return;

      if (!socket.connected) {
        socket.connect();
      }

      const userData = {
        id: user?.id,
        name: user?.fullName || user?.name || 'Guest User',
        imageUrl: user?.imageUrl || '',
      };

      // Join the meeting room
      socket.emit('join-room', {
        roomId,
        user: userData,
        audioEnabled: stream ? stream.getAudioTracks().some((t) => t.enabled) : false,
        videoEnabled: stream ? stream.getVideoTracks().some((t) => t.enabled) : false,
      });

      // Existing room participants sent by server
      socket.on('all-users', async (users) => {
        for (const existingUser of users) {
          if (existingUser.socketId === socket.id) continue;

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
                  userName: existingUser.username,
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
        const pc = createPeerConnection(callerSocketId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            targetSocketId: callerSocketId,
            responderSocketId: socket.id,
            sdp: answer,
          });

          setRemoteUsers((prev) => {
            if (prev.some((u) => u.socketId === callerSocketId)) {
              return prev.map((u) =>
                u.socketId === callerSocketId
                  ? {
                      ...u,
                      userName: callerUser?.username || u.userName,
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
                userId: callerUser?.userId,
                userName: callerUser?.username || 'New Participant',
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
        const pc = peersRef.current.get(responderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          } catch (err) {
            console.error('Error applying remote answer description:', err);
          }
        }
      });

      // Receiving ICE candidate
      socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
        const pc = peersRef.current.get(senderSocketId);
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding received ICE candidate:', err);
          }
        }
      });

      // New user joined room
      socket.on('user-joined', (newUser) => {
        toast(`${newUser.username || 'A new participant'} joined the meeting`, {
          icon: '👋',
        });
        setRemoteUsers((prev) => {
          if (prev.some((u) => u.socketId === newUser.socketId)) return prev;
          return [
            ...prev,
            {
              socketId: newUser.socketId,
              userId: newUser.userId,
              userName: newUser.username || 'Participant',
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

    if (roomId) {
      setupAndJoin();
    }

    return () => {
      isMounted = false;
      // Close all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();

      // Stop camera/mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }

      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.off('all-users');
        socketRef.current.off('offer');
        socketRef.current.off('answer');
        socketRef.current.off('ice-candidate');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-toggle-audio');
        socketRef.current.off('user-toggle-video');
        socketRef.current.off('user-left');
        socketRef.current.off('meeting-ended');
      }
    };
  }, [roomId, user?.id, createPeerConnection, initLocalStream, onMeetingEnded]);

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
        roomId,
        audioEnabled: newState,
      });
    }

    toast(newState ? 'Microphone on' : 'Microphone muted', {
      icon: newState ? '🎙️' : '🔇',
    });
  }, [audioEnabled, roomId]);

  // Toggle local camera
  const toggleVideo = useCallback(() => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = newState;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('toggle-video', {
        roomId,
        videoEnabled: newState,
      });
    }

    toast(newState ? 'Camera on' : 'Camera off', {
      icon: newState ? '📹' : '📷',
    });
  }, [videoEnabled, roomId]);

  // Screen share (like Zoom/Google Meet)
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace track across all RTCPeerConnections
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          console.error('Error starting screen share:', err);
          toast.error('Could not start screen sharing');
        }
      }
    } else {
      stopScreenSharing();
    }
  }, [isScreenSharing]);

  const stopScreenSharing = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }
    }

    setIsScreenSharing(false);
    toast('Screen sharing stopped', { icon: '🖥️' });
  }, []);

  // End meeting for all participants
  const endMeeting = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end-meeting', { roomId });
    }
    if (onMeetingEnded) {
      onMeetingEnded('Meeting ended by host');
    }
  }, [roomId, onMeetingEnded]);

  // Leave meeting individually
  const leaveMeeting = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave-room', { roomId });
    }
    if (onMeetingEnded) {
      onMeetingEnded('You left the meeting');
    }
  }, [roomId, onMeetingEnded]);

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
