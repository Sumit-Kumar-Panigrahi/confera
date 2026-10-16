import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/react';
import useWebRTC from '../hooks/useWebRTC';
import { useChat } from '../hooks/useChat';
import { createApiClient } from '../services/api';
import toast from 'react-hot-toast';
import VideoGrid from '../components/meeting/VideoGrid';
import ControlBar from '../components/meeting/ControlBar';
import MeetingSidePanel from '../components/meeting/MeetingSidePanel';
import { 
  VideoIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  CopyIcon, 
  CheckIcon, 
  SparklesIcon, 
  ArrowLeftIcon,
  UsersIcon,
  CrownIcon
} from 'lucide-react';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const cleanRoomId = useMemo(() => (meetingId || '').trim().toLowerCase(), [meetingId]);
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Guest Name Support for unauthenticated participants
  const [guestName, setGuestName] = useState(() => localStorage.getItem('confera_guest_name') || '');
  const [guestJoined, setGuestJoined] = useState(() => Boolean(user || localStorage.getItem('confera_guest_name')));

  // Meeting states
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Unified Drawer state: null | 'chat' | 'participants' | 'info'
  const [activeDrawerTab, setActiveDrawerTab] = useState(null);

  // Pinned video state
  const [pinnedSocketId, setPinnedSocketId] = useState(null);

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  // Derived user object (supports Clerk user OR guest user)
  const effectiveUser = useMemo(() => {
    if (user) return user;
    const effectiveName = guestName.trim() || 'Guest User';
    return {
      id: `guest_${cleanRoomId}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: effectiveName,
      name: effectiveName,
      firstName: effectiveName,
      imageUrl: '',
    };
  }, [user, guestName, cleanRoomId]);

  // Load meeting details from database
  useEffect(() => {
    let isCancelled = false;
    const fetchMeeting = async () => {
      try {
        setLoadingMeeting(true);
        const data = await api.getMeeting(cleanRoomId);
        if (!isCancelled) {
          setMeetingDetails(data.meeting);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Could not load backend meeting details, running in mesh room:", err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoadingMeeting(false);
        }
      }
    };

    if (cleanRoomId) {
      fetchMeeting();
    }

    return () => { isCancelled = true; };
  }, [cleanRoomId, api]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      const remMins = mins % 60;
      return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMeetingEnded = useCallback((reason) => {
    toast(reason || "Meeting ended", { icon: "👋" });
    navigate(user ? '/dashboard' : '/');
  }, [navigate, user]);

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
  } = useWebRTC(cleanRoomId, effectiveUser, handleMeetingEnded);

  // Chat hook
  const {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toggleChat
  } = useChat(cleanRoomId, effectiveUser);

  const isHost = Boolean(
    meetingDetails?.host?.id && 
    effectiveUser?.id && 
    meetingDetails.host.id.toString() === effectiveUser.id.toString()
  );

  const handleLeave = () => {
    leaveWebRTCMeeting();
    toast("You left the conference");
    navigate(user ? '/dashboard' : '/');
  };

  const handleEndMeeting = async () => {
    try {
      await api.endMeeting(cleanRoomId);
    } catch (err) {
      console.warn("End meeting error:", err.message);
    }
    endWebRTCMeeting();
    toast("Meeting concluded for all participants");
    navigate(user ? '/dashboard' : '/');
  };

  const copyMeetingUrl = () => {
    const inviteUrl = `${window.location.origin}/meeting/${cleanRoomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success("Meeting link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleDrawer = (tab) => {
    setActiveDrawerTab((current) => (current === tab ? null : tab));
  };

  const handleGuestJoinSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }
    localStorage.setItem('confera_guest_name', guestName.trim());
    setGuestJoined(true);
  };

  // 1. PRE-JOIN PROMPT (For non-logged in users who haven't entered their name yet)
  if (isLoaded && !user && !guestJoined) {
    return (
      <div className="min-h-screen w-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-600 font-sans">
        <div className="w-full max-w-md bg-[#0c101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <VideoIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Join Meeting</h2>
            <p className="text-xs text-slate-400">
              {meetingDetails?.title || `Room Code: ${cleanRoomId}`}
            </p>
          </div>

          <form onSubmit={handleGuestJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
            >
              Join Conference
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800/80">
            <Link to="/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Have a Confera account? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN MEETING ROOM (User Friendly Google Meet / Zoom Style)
  return (
    <div className="h-screen w-screen bg-[#070a13] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* TOP HEADER BAR */}
      <header className="w-full bg-[#0a0e1a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: Brand & Meeting Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
            title="Leave and return to dashboard"
          >
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <VideoIcon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white hidden sm:inline">
              Confera<span className="text-indigo-500">.</span>
            </span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block shrink-0" />

          {/* Meeting Title & ID */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate max-w-[140px] sm:max-w-xs">
              {meetingDetails?.title || (cleanRoomId.startsWith('pmi') ? 'Personal Meeting Room' : 'Live Conference')}
            </h1>

            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300 shrink-0">
              {cleanRoomId}
            </span>
          </div>
        </div>

        {/* Center: Meeting Duration & Security Badge */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
            <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatDuration(meetingDuration)}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>E2EE Secure</span>
          </div>
        </div>

        {/* Right: Quick Share & User Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={copyMeetingUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Copy invitation link"
          >
            {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{copiedLink ? "Link Copied!" : "Invite Others"}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full">
            <div className="size-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              {(effectiveUser?.fullName || effectiveUser?.name || "Y").charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
              {effectiveUser?.fullName || effectiveUser?.name || "You"}
            </span>
          </div>
        </div>

      </header>

      {/* MAIN VIEWPORT: Video Stage + Optional Right Side Drawer */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Central Responsive Video Stage */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          <VideoGrid
            localStream={localStream}
            localUser={effectiveUser}
            remoteUsers={remoteUsers}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            isScreenSharing={isScreenSharing}
            isHost={isHost}
            meetingHostId={meetingDetails?.host?.id}
            pinnedSocketId={pinnedSocketId}
            onPinSocketId={(sockId) => setPinnedSocketId(sockId)}
            onCopyInvite={copyMeetingUrl}
            copiedInvite={copiedLink}
            meetingId={cleanRoomId}
          />
        </main>

        {/* Right Slide-over Side Drawer (Chat / People / Info) */}
        <MeetingSidePanel
          isOpen={Boolean(activeDrawerTab)}
          activeTab={activeDrawerTab || 'chat'}
          onClose={() => setActiveDrawerTab(null)}
          onChangeTab={(tab) => setActiveDrawerTab(tab)}
          // Chat props
          messages={messages}
          onSendMessage={sendMessage}
          currentUser={effectiveUser}
          // Participants props
          localUser={effectiveUser}
          localAudio={audioEnabled}
          localVideo={videoEnabled}
          remoteUsers={remoteUsers}
          meetingHostId={meetingDetails?.host?.id}
          isHost={isHost}
          // Info props
          meetingId={cleanRoomId}
          meetingTitle={meetingDetails?.title}
          onCopyInvite={copyMeetingUrl}
          copiedInvite={copiedLink}
        />

      </div>

      {/* DOCKED BOTTOM CONTROL BAR (Google Meet / Zoom style) */}
      <ControlBar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        activeDrawerTab={activeDrawerTab}
        unreadCount={unreadCount}
        participantCount={1 + remoteUsers.length}
        roomId={cleanRoomId}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleDrawerTab={toggleDrawer}
        isHost={isHost}
        onLeave={handleLeave}
        onEndMeeting={handleEndMeeting}
        onCopyInvite={copyMeetingUrl}
        copiedInvite={copiedLink}
      />

    </div>
  );
};

export default MeetingRoom;
