import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/react';
import useWebRTC from '../hooks/useWebRTC';
import { useChat } from '../hooks/useChat';
import { createApiClient } from '../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  VideoIcon, 
  VideoOffIcon, 
  MicIcon, 
  MicOffIcon, 
  MonitorUpIcon, 
  PhoneOffIcon, 
  MessageSquareIcon, 
  UsersIcon, 
  CopyIcon, 
  CheckIcon, 
  SparklesIcon, 
  HeadphonesIcon, 
  PinIcon, 
  SendIcon, 
  SmileIcon, 
  SlidersHorizontalIcon, 
  SearchIcon,
  PlusIcon,
  FlameIcon,
  HeartIcon,
  ThumbsUpIcon
} from 'lucide-react';

const RemoteVideoTile = ({ remoteUser }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && remoteUser.stream) {
      videoRef.current.srcObject = remoteUser.stream;
    }
  }, [remoteUser.stream]);

  const hasVideoStream = Boolean(remoteUser.videoEnabled && remoteUser.stream);

  return (
    <div className="flex-1 aspect-video md:aspect-auto rounded-2xl bg-[#0b0f1a] border border-slate-800 overflow-hidden relative shadow-md flex items-center justify-center group">
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center space-y-2 p-4">
          <div className="size-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
            {remoteUser.userName ? remoteUser.userName.charAt(0).toUpperCase() : "P"}
          </div>
          <span className="text-xs font-semibold text-slate-300">{remoteUser.userName || "Participant"}</span>
        </div>
      )}

      {/* Overlay indicators */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white flex items-center gap-1.5">
        <span>{remoteUser.userName || "Participant"}</span>
        {remoteUser.isHost && <span className="text-[10px] text-amber-400 font-bold">(Host)</span>}
      </div>

      <div className="absolute bottom-2 right-2 p-1 rounded bg-black/60 text-slate-300">
        {remoteUser.audioEnabled ? (
          <MicIcon className="w-3 h-3 text-emerald-400" />
        ) : (
          <MicOffIcon className="w-3 h-3 text-rose-500" />
        )}
      </div>
    </div>
  );
};

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Meeting states
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Bottom Intelligence Tab: 'assistant' | 'transcript' | 'topics'
  const [activeBottomTab, setActiveBottomTab] = useState('assistant');

  // Chat message input & reactions
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Simulated transcription stream
  const [waveformHeight, setWaveformHeight] = useState([30, 45, 60, 25, 70, 50, 40, 80, 65, 30, 55, 40]);

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  // Load meeting details
  useEffect(() => {
    let isCancelled = false;
    const fetchMeeting = async () => {
      try {
        setLoadingMeeting(true);
        const data = await api.getMeeting(meetingId);
        if (!isCancelled) {
          setMeetingDetails(data.meeting);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Could not load backend meeting details, using local mesh:", err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoadingMeeting(false);
        }
      }
    };

    if (meetingId) {
      fetchMeeting();
    }

    return () => { isCancelled = true; };
  }, [meetingId, api]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Waveform animation effect
  useEffect(() => {
    const waveTimer = setInterval(() => {
      setWaveformHeight(Array.from({ length: 14 }, () => Math.floor(Math.random() * 60) + 15));
    }, 250);
    return () => clearInterval(waveTimer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMeetingEnded = useCallback((reason) => {
    toast(reason || "Meeting ended", { icon: "👋" });
    navigate('/dashboard');
  }, [navigate]);

  // WebRTC hook
  const {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endMeeting: endWebRTCMeeting,
    leaveMeeting: leaveWebRTCMeeting
  } = useWebRTC(meetingId, user, handleMeetingEnded);

  // Chat hook
  const {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toggleChat
  } = useChat(meetingId, user);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isHost = Boolean(
    meetingDetails?.host?.id && user?.id && meetingDetails.host.id.toString() === user.id.toString()
  );

  const handleLeave = () => {
    leaveWebRTCMeeting();
    toast("You left the conference");
    navigate('/dashboard');
  };

  const handleEndMeeting = async () => {
    try {
      await api.endMeeting(meetingId);
    } catch (err) {
      console.warn("End meeting error:", err.message);
    }
    endWebRTCMeeting();
    toast("Meeting concluded for all participants");
    navigate('/dashboard');
  };

  const copyMeetingUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Conference invitation URL copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    sendMessage(`Reaction: ${emoji}`);
  };

  // Video stream refs
  const localVideoRef = useRef(null);
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const currentUserName = user?.fullName || user?.firstName || "You";

  return (
    <div className="h-screen w-screen bg-[#070a12] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* 1. TOP BAR (Reference 3 Meetlyze Style) */}
      <header className="w-full bg-[#0c101c] border-b border-slate-800/80 px-4 sm:px-6 h-16 flex items-center justify-between shrink-0 z-30">
        
        {/* Left Brand & Meeting Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Return to Dashboard"
          >
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0b5cff] to-[#3b82f6] flex items-center justify-center shadow-md">
              <VideoIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white hidden sm:inline">
              Confera<span className="text-[#3b82f6]">.</span>
            </span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Title and Mode Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Mode</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-xs">
              {meetingDetails?.title || (meetingId.startsWith('pmi') ? 'Personal Meeting Room' : 'Live Conference')}
            </h1>
          </div>
        </div>

        {/* Center Share Link Pill (Reference 3 Signature Component) */}
        <div className="hidden lg:flex items-center gap-2 bg-[#121829] border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-300">
          <span className="truncate max-w-[240px] text-slate-400">
            {window.location.origin}/meeting/{meetingId}
          </span>
          <button
            onClick={copyMeetingUrl}
            className="p-1 rounded-lg hover:bg-slate-700 text-[#3b82f6] hover:text-white transition-colors cursor-pointer"
            title="Copy conference link"
          >
            {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Status & User Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDuration(meetingDuration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center border border-white/20">
              {currentUserName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{currentUserName}</span>
          </div>
        </div>

      </header>

      {/* 2. MAIN MEETING STUDIO SPLIT: Left Video Stage + Intelligence Dock | Right Sidebar Dock */}
      <div className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4">
        
        {/* LEFT COLUMN: Video Grid + Bottom Intelligence Dock (8 cols equivalent) */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          
          {/* Video Stage (Reference 3 Main Stage + Right Stack) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
            
            {/* Primary Large Speaker Stage (8 cols) */}
            <div className="md:col-span-8 bg-[#0b0f1a] rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center group">
              
              {/* Primary Video Feed (Screen share or local user or first remote) */}
              {videoEnabled && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="size-20 rounded-full bg-gradient-to-tr from-[#0b5cff] to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                    {currentUserName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{currentUserName}</span>
                </div>
              )}

              {/* Top Video Indicators */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10">
                  <span>{currentUserName} (Host)</span>
                </div>

                <div className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Recording in Progress...</span>
                </div>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                <button className="p-2 rounded-full bg-black/60 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 transition-colors">
                  <PinIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Floating Center Control Bar inside Primary Video (Reference 3 Signature UX) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0a0f1e]/90 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl z-20">
                
                {/* Audio Toggle */}
                <button
                  onClick={toggleAudio}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    audioEnabled ? "bg-white/15 text-white hover:bg-white/25" : "bg-rose-600 text-white"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <MicIcon className="w-4 h-4" /> : <MicOffIcon className="w-4 h-4" />}
                </button>

                {/* Video Toggle */}
                <button
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    videoEnabled ? "bg-white/15 text-white hover:bg-white/25" : "bg-rose-600 text-white"
                  }`}
                  title={videoEnabled ? "Stop Camera" : "Start Camera"}
                >
                  {videoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOffIcon className="w-4 h-4" />}
                </button>

                {/* Screen Share */}
                <button
                  onClick={toggleScreenShare}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    isScreenSharing ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                  title="Share Screen"
                >
                  <MonitorUpIcon className="w-4 h-4" />
                </button>

                {/* End Meeting Button (Iconic Red Pill) */}
                <button
                  onClick={isHost ? handleEndMeeting : handleLeave}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <PhoneOffIcon className="w-3.5 h-3.5" />
                  <span>{isHost ? "End Meeting" : "Leave"}</span>
                </button>

                {/* Settings */}
                <button 
                  onClick={copyMeetingUrl}
                  className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-all cursor-pointer"
                  title="Copy Link"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* Secondary Participants Stack (4 cols on desktop) */}
            <div className="md:col-span-4 flex md:flex-col gap-3 overflow-y-auto min-h-0">
              
              {remoteUsers.length > 0 ? (
                remoteUsers.map((u) => (
                  <RemoteVideoTile key={u.socketId} remoteUser={u} />
                ))
              ) : (
                <div className="flex-1 aspect-video md:aspect-auto rounded-2xl bg-[#0b0f1a]/80 border border-slate-800/80 p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <UsersIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-bold text-white">Waiting for participants</h4>
                    <p className="text-xs text-slate-400">Share your conference link with teammates to connect with live audio & video.</p>
                  </div>
                  <button
                    onClick={copyMeetingUrl}
                    className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Bottom Intelligence Dock (Reference 3 Signature Voice Assistant & Transcript tabs) */}
          <div className="h-44 sm:h-52 bg-[#0b0f1a] rounded-3xl border border-slate-800 p-4 flex flex-col justify-between shrink-0 shadow-xl overflow-hidden">
            
            {/* Tabs Row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBottomTab('assistant')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeBottomTab === 'assistant' ? 'bg-[#0b5cff] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Voice Assistant
                </button>
                <button
                  onClick={() => setActiveBottomTab('transcript')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeBottomTab === 'transcript' ? 'bg-[#0b5cff] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transcript & Activity
                </button>
                <button
                  onClick={() => setActiveBottomTab('topics')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeBottomTab === 'topics' ? 'bg-[#0b5cff] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Meeting Info
                </button>
              </div>

              {/* Audio Waveform Animation Strip (Reference 3 Style) */}
              <div className="flex items-center gap-1 h-5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                <SparklesIcon className="w-3 h-3 text-blue-400 mr-1" />
                {waveformHeight.map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-blue-500 rounded-full transition-all duration-200"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Transcript / Activity / Info Live Content */}
            <div className="flex-1 overflow-y-auto space-y-2 pt-2 text-xs text-slate-300">
              {activeBottomTab === 'assistant' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Confera Real-Time Conference Intelligence</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Voice channel is active with noise suppression and acoustic echo cancellation. Full end-to-end peer encryption is enforced.
                  </p>
                </div>
              )}

              {activeBottomTab === 'transcript' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-white shrink-0">{currentUserName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Session Host</span>
                    <p className="text-slate-300 leading-relaxed">
                      Conference initiated in room: <strong className="text-blue-400 font-mono">{meetingId}</strong>.
                    </p>
                  </div>
                  {messages.slice(-3).map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-slate-300 shrink-0">{m.senderName || "Attendee"}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{m.time || "recent"}</span>
                      <p className="text-slate-400 leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeBottomTab === 'topics' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Room ID</span>
                    <span className="font-mono font-bold text-slate-200">{meetingId}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Host Name</span>
                    <span className="font-bold text-slate-200">{meetingDetails?.host?.name || currentUserName}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Session Status</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Docked Participants & Live Chat (4 cols on desktop) */}
        <aside className="w-80 lg:w-92 flex flex-col gap-3 shrink-0 hidden md:flex min-h-0">
          
          {/* Top: Participants Panel (Reference 3 Style) */}
          <div className="h-64 bg-[#0b0f1a] rounded-3xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Participants ({1 + remoteUsers.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Live</span>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs">
              
              {/* You */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-[#0b5cff] text-white font-bold text-xs flex items-center justify-center">
                    {currentUserName.charAt(0)}
                  </div>
                  <span className="font-bold text-white truncate max-w-[120px]">{currentUserName} (You)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  {audioEnabled ? <MicIcon className="w-3.5 h-3.5 text-emerald-400" /> : <MicOffIcon className="w-3.5 h-3.5 text-rose-500" />}
                  {videoEnabled ? <VideoIcon className="w-3.5 h-3.5 text-blue-400" /> : <VideoOffIcon className="w-3.5 h-3.5 text-slate-500" />}
                </div>
              </div>

              {/* Real Remote Attendees */}
              {remoteUsers.map((u) => (
                <div key={u.socketId} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/20">
                      {u.userName ? u.userName.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-200 truncate max-w-[110px]">{u.userName || "Participant"}</span>
                      {u.isHost && <span className="text-[10px] text-amber-400 font-bold">(Host)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.audioEnabled ? <MicIcon className="w-3.5 h-3.5 text-slate-400" /> : <MicOffIcon className="w-3.5 h-3.5 text-rose-500" />}
                    {u.videoEnabled ? <VideoIcon className="w-3.5 h-3.5 text-blue-400" /> : <VideoOffIcon className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </div>
              ))}
            </div>

            {/* + Add Participant Button */}
            <button
              onClick={copyMeetingUrl}
              className="w-full py-2 rounded-xl bg-[#0b5cff] hover:bg-[#004fe0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Participation / Copy Link</span>
            </button>
          </div>

          {/* Bottom: Live Chats Panel (Reference 3 Style) */}
          <div className="flex-1 bg-[#0b0f1a] rounded-3xl border border-slate-800 p-4 flex flex-col justify-between shadow-xl min-h-0 overflow-hidden">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Chats ({messages.length})
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-2 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                  <p>No messages yet. Send a message to start collaboration!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id || msg.sender === user?.id;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-bold text-slate-400">{isMe ? "You" : msg.senderName}</span>
                        <span className="text-[9px] text-slate-600 font-mono">{msg.time || "now"}</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        isMe ? 'bg-[#0b5cff] text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reaction Chips */}
            <div className="flex items-center gap-1.5 py-1.5 border-t border-slate-800/80 shrink-0">
              <button onClick={() => sendReaction("🔥")} className="p-1 rounded hover:bg-slate-800 text-xs cursor-pointer">🔥</button>
              <button onClick={() => sendReaction("❤️")} className="p-1 rounded hover:bg-slate-800 text-xs cursor-pointer">❤️</button>
              <button onClick={() => sendReaction("👍")} className="p-1 rounded hover:bg-slate-800 text-xs cursor-pointer">👍</button>
              <button onClick={() => sendReaction("🎉")} className="p-1 rounded hover:bg-slate-800 text-xs cursor-pointer">🎉</button>
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1 shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-[#0b5cff] outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#0b5cff] hover:bg-[#004fe0] text-white transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </aside>

      </div>

    </div>
  );
};

export default MeetingRoom;
