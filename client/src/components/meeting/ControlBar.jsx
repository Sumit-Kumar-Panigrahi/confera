import React, { useState } from 'react';
import { 
  MicIcon, 
  MicOffIcon, 
  VideoIcon, 
  VideoOffIcon, 
  ScreenShareIcon, 
  PhoneOffIcon, 
  MessageSquareIcon, 
  UsersIcon, 
  CopyIcon, 
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const ControlBar = ({
  audioEnabled, 
  videoEnabled, 
  isScreenSharing, 
  isChatOpen, 
  isParticipantsOpen, 
  unreadCount = 0,
  participantCount = 1,
  roomId, 
  onToggleAudio, 
  onToggleVideo, 
  onToggleScreenShare, 
  onToggleChat, 
  onToggleParticipants, 
  isHost, 
  onLeave, 
  onEndMeeting 
}) => {
  const [copied, setCopied] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const copyMeetingId = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Conference link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full bg-[#0a0f1d]/95 backdrop-blur-2xl border-t border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between z-40 shadow-2xl transition-all">
      
      {/* Left Info & Invite link */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conference Room</span>
          <span className="text-xs font-mono font-bold text-white">{roomId}</span>
        </div>
        <button 
          onClick={copyMeetingId} 
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all active:scale-95"
          title="Copy invite link"
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? "Copied" : "Copy Link"}</span>
        </button>
      </div>

      {/* Center Controls Dock */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Audio Toggle */}
        <button 
          onClick={onToggleAudio}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            audioEnabled 
              ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" 
              : "bg-rose-600 text-white border border-rose-500 shadow-rose-600/30"
          }`}
          title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          {audioEnabled ? <MicIcon className="w-5 h-5 text-emerald-400" /> : <MicOffIcon className="w-5 h-5 text-white" />}
        </button>

        {/* Video Toggle */}
        <button 
          onClick={onToggleVideo}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            videoEnabled 
              ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" 
              : "bg-rose-600 text-white border border-rose-500 shadow-rose-600/30"
          }`}
          title={videoEnabled ? "Turn off Camera" : "Turn on Camera"}
        >
          {videoEnabled ? <VideoIcon className="w-5 h-5 text-blue-400" /> : <VideoOffIcon className="w-5 h-5 text-white" />}
        </button>

        {/* Screen Share Toggle */}
        <button 
          onClick={onToggleScreenShare}
          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            isScreenSharing 
              ? "bg-[#00a86b] text-white border border-[#00a86b] shadow-lg shadow-[#00a86b]/30" 
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <ScreenShareIcon className="w-5 h-5" />
        </button>

        {/* In-Meeting Chat */}
        <button 
          onClick={onToggleChat}
          className={`relative p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            isChatOpen 
              ? "bg-[#0b5cff] text-white shadow-lg shadow-[#0b5cff]/30 border border-[#0b5cff]" 
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title="In-meeting Chat"
        >
          <MessageSquareIcon className="w-5 h-5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0f1d] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Participants */}
        <button 
          onClick={onToggleParticipants}
          className={`relative p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            isParticipantsOpen 
              ? "bg-[#0b5cff] text-white shadow-lg shadow-[#0b5cff]/30 border border-[#0b5cff]" 
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title="Participants List"
        >
          <UsersIcon className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700 shadow-xs">
            {participantCount}
          </span>
        </button>

        {/* Leave / End Action */}
        <div className="relative ml-1 sm:ml-2">
          {isHost ? (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowEndConfirm((prev) => !prev)}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="End Meeting"
              >
                <PhoneOffIcon className="w-4 h-4" />
                <span className="hidden sm:inline">End Call</span>
              </button>

              {showEndConfirm && (
                <div className="absolute bottom-14 right-0 bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-700 p-2.5 w-60 flex flex-col gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Conference Options</span>
                  <button 
                    onClick={() => { setShowEndConfirm(false); onEndMeeting(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    End Conference for All
                  </button>
                  <button 
                    onClick={() => { setShowEndConfirm(false); onLeave(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Leave (Keep Room Open)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onLeave}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Leave Meeting"
            >
              <PhoneOffIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Security Tag */}
      <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs">
        <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-slate-300">256-Bit Encrypted</span>
      </div>

    </footer>
  );
};

export default ControlBar;
