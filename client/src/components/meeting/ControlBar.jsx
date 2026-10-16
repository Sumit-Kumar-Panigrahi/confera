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
  InfoIcon,
  CopyIcon, 
  CheckIcon,
  ShieldCheckIcon,
  GridIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const ControlBar = ({
  audioEnabled, 
  videoEnabled, 
  isScreenSharing, 
  activeDrawerTab, // 'chat' | 'participants' | 'info' | null
  unreadCount = 0,
  participantCount = 1,
  roomId, 
  onToggleAudio, 
  onToggleVideo, 
  onToggleScreenShare, 
  onToggleDrawerTab,
  isHost, 
  onLeave, 
  onEndMeeting,
  onCopyInvite,
  copiedInvite
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  return (
    <footer className="w-full bg-[#0a0e1a]/95 backdrop-blur-2xl border-t border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-40 shrink-0 select-none shadow-2xl">
      
      {/* Left Info & Quick Copy Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meeting Room</span>
          <span className="text-xs font-mono font-bold text-white truncate max-w-[140px]">{roomId}</span>
        </div>

        <button 
          onClick={onCopyInvite} 
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Copy meeting invitation link"
        >
          {copiedInvite ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden xs:inline">{copiedInvite ? "Copied" : "Copy Link"}</span>
        </button>
      </div>

      {/* Center Floating Controls Dock */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        
        {/* Audio Toggle (Mic) */}
        <button 
          onClick={onToggleAudio}
          className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            audioEnabled 
              ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700" 
              : "bg-rose-600 text-white border border-rose-500 shadow-rose-600/30"
          }`}
          title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          {audioEnabled ? <MicIcon className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" /> : <MicOffIcon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />}
        </button>

        {/* Video Toggle (Camera) */}
        <button 
          onClick={onToggleVideo}
          className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            videoEnabled 
              ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700" 
              : "bg-rose-600 text-white border border-rose-500 shadow-rose-600/30"
          }`}
          title={videoEnabled ? "Turn off Camera" : "Turn on Camera"}
        >
          {videoEnabled ? <VideoIcon className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-400" /> : <VideoOffIcon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />}
        </button>

        {/* Screen Share Toggle */}
        <button 
          onClick={onToggleScreenShare}
          className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer hidden xs:flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            isScreenSharing 
              ? "bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-600/30" 
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
        >
          <ScreenShareIcon className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-0.5 sm:mx-1 hidden xs:block" />

        {/* In-Meeting Chat Toggle */}
        <button 
          onClick={() => onToggleDrawerTab('chat')}
          className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            activeDrawerTab === 'chat'
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500" 
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title="Meeting Chat"
        >
          <MessageSquareIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          {unreadCount > 0 && activeDrawerTab !== 'chat' && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0e1a] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Attendees / Participants Toggle */}
        <button 
          onClick={() => onToggleDrawerTab('participants')}
          className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            activeDrawerTab === 'participants'
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500" 
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title="Participants List"
        >
          <UsersIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-slate-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-700 shadow-xs">
            {participantCount}
          </span>
        </button>

        {/* Meeting Details / Invite Info Toggle */}
        <button 
          onClick={() => onToggleDrawerTab('info')}
          className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 shadow-md ${
            activeDrawerTab === 'info'
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500" 
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
          title="Meeting Information & Invite"
        >
          <InfoIcon className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        {/* Leave / End Call Button */}
        <div className="relative ml-1 sm:ml-2">
          {isHost ? (
            <div>
              <button 
                onClick={() => setShowEndConfirm((prev) => !prev)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="End or Leave Call"
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
                    End Meeting for All
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
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Leave Meeting"
            >
              <PhoneOffIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>

      </div>

      {/* Right Security & Status Badge */}
      <div className="hidden lg:flex items-center gap-2 text-slate-400 text-xs">
        <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-slate-300">Encrypted</span>
      </div>

    </footer>
  );
};

export default ControlBar;
