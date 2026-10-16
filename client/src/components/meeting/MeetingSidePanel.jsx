import React, { useState, useEffect, useRef } from 'react';
import { 
  XIcon, 
  MessageSquareIcon, 
  UsersIcon, 
  InfoIcon, 
  SendIcon, 
  CopyIcon, 
  CheckIcon, 
  MicIcon, 
  MicOffIcon, 
  VideoIcon, 
  VideoOffIcon, 
  CrownIcon, 
  SearchIcon,
  ShieldCheckIcon,
  SmileIcon
} from 'lucide-react';

const MeetingSidePanel = ({
  isOpen,
  activeTab = 'chat', // 'chat' | 'participants' | 'info'
  onClose,
  onChangeTab,
  // Chat props
  messages = [],
  onSendMessage,
  currentUser,
  // Participants props
  localUser,
  localAudio,
  localVideo,
  remoteUsers = [],
  meetingHostId,
  isHost,
  // Info props
  meetingId,
  meetingTitle,
  onCopyInvite,
  copiedInvite
}) => {
  const [chatText, setChatText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!chatText.trim()) return;
    onSendMessage(chatText.trim());
    setChatText('');
  };

  const handleEmojiClick = (emoji) => {
    onSendMessage(emoji);
  };

  const localName = localUser?.fullName || localUser?.name || "You";
  const allParticipants = [
    {
      socketId: "local",
      userId: localUser?.id,
      userName: `${localName} (You)`,
      audioEnabled: localAudio,
      videoEnabled: localVideo,
      isLocal: true,
      isHost: Boolean(isHost || (meetingHostId && localUser?.id && meetingHostId.toString() === localUser.id.toString())),
    },
    ...remoteUsers.map((u) => ({
      ...u,
      isHost: Boolean(u.isHost || (meetingHostId && u.userId && meetingHostId.toString() === u.userId.toString())),
    })),
  ];

  const filteredParticipants = allParticipants.filter((p) =>
    (p.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fullInviteUrl = `${window.location.origin}/meeting/${(meetingId || '').toLowerCase()}`;

  return (
    <aside className="w-full sm:w-80 md:w-96 h-full bg-[#0c101d] border-l border-slate-800/90 flex flex-col z-40 shrink-0 shadow-2xl transition-all duration-300">
      
      {/* 1. Header with Tabs & Close button */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0d18]">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onChangeTab('participants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'participants' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            <span>People ({allParticipants.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'info' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <InfoIcon className="w-3.5 h-3.5" />
            <span>Info</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 2. TAB CONTENT: CHAT */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick reactions bar */}
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-around">
            {['👋', '👍', '❤️', '👏', '🎉', '🔥'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-base p-1 hover:scale-125 transition-transform cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 p-4">
                <div className="size-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <MessageSquareIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-300">No messages yet</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Messages are only visible to participants currently in this conference.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id || msg.sender === currentUser?.id;
                const timeStr = msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isMe ? 'You' : msg.senderName || 'Participant'}
                      </span>
                      {timeStr && (
                        <span className="text-[9px] text-slate-500">• {timeStr}</span>
                      )}
                    </div>

                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-xs' 
                        : 'bg-slate-800/90 text-slate-200 rounded-tl-xs border border-slate-700/60'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/90 bg-[#0a0d18] flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message (Press Enter)..."
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatText.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 3. TAB CONTENT: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search bar */}
          {allParticipants.length > 2 && (
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
              <div className="relative">
                <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter attendees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Attendees list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {filteredParticipants.map((p) => {
              const initial = (p.userName || "P").replace('(You)', '').trim().charAt(0).toUpperCase();

              return (
                <div
                  key={p.socketId}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                          {p.userName}
                        </span>
                        {p.isHost && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold shrink-0">
                            <CrownIcon className="w-2.5 h-2.5 text-amber-400" /> Host
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {p.isLocal ? "This device" : "Connected via WebRTC"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <span className={`p-1 rounded-lg border ${
                      p.audioEnabled ? "bg-slate-800/80 text-emerald-400 border-slate-700" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}>
                      {p.audioEnabled ? <MicIcon className="w-3 h-3" /> : <MicOffIcon className="w-3 h-3" />}
                    </span>

                    <span className={`p-1 rounded-lg border ${
                      p.videoEnabled ? "bg-slate-800/80 text-indigo-400 border-slate-700" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}>
                      {p.videoEnabled ? <VideoIcon className="w-3 h-3" /> : <VideoOffIcon className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick invite bottom strip */}
          <div className="p-3 border-t border-slate-800/90 bg-[#0a0d18]">
            <button
              onClick={onCopyInvite}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {copiedInvite ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedInvite ? "Invite Copied" : "Copy Meeting Invitation"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: INFO & INVITE LINK */}
      {activeTab === 'info' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Conference Details</span>
            <h3 className="text-base font-extrabold text-white">
              {meetingTitle || "Live Video Room"}
            </h3>
          </div>

          {/* Meeting Room ID */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Meeting Room Code</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-white tracking-wide">
                {meetingId}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(meetingId);
                  onCopyInvite();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Room ID"
              >
                <CopyIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Full Invitation URL */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Invitation Link</span>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-indigo-300 break-all select-all">
              {fullInviteUrl}
            </div>
            <button
              onClick={onCopyInvite}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              {copiedInvite ? <CheckIcon className="w-3.5 h-3.5 text-emerald-300" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedInvite ? "URL Copied to Clipboard!" : "Copy Full Invitation Link"}</span>
            </button>
          </div>

          {/* Security & Instructions Info */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Peer-to-Peer Encryption</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              Video & audio streams are transmitted directly between participants using WebRTC peer mesh with end-to-end encryption.
            </p>
          </div>
        </div>
      )}

    </aside>
  );
};

export default MeetingSidePanel;
