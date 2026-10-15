import React, { useState } from 'react';
import { CrownIcon, MicIcon, MicOffIcon, SearchIcon, UsersIcon, VideoIcon, VideoOffIcon, XIcon } from 'lucide-react';

const ParticipantList = ({ 
  isOpen, 
  onClose, 
  localUser, 
  localAudio, 
  localVideo, 
  remoteUsers = [], 
  meetingHostId 
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const localName = localUser?.fullName || localUser?.name || "You";
  const allParticipants = [
    {
      socketId: "local",
      userId: localUser?.id,
      userName: `${localName} (You)`,
      audioEnabled: localAudio,
      videoEnabled: localVideo,
      isLocal: true,
      isHost: meetingHostId && localUser?.id && meetingHostId.toString() === localUser.id.toString(),
    },
    ...remoteUsers.map((u) => ({
      ...u,
      isHost: meetingHostId && u.userId && meetingHostId.toString() === u.userId.toString(),
    })),
  ];

  const filteredParticipants = allParticipants.filter((p) =>
    (p.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full sm:w-88 h-full bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 flex flex-col z-30 shadow-2xl transition-all duration-300">
      
      {/* Header */}
      <div className="p-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <UsersIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Participants ({allParticipants.length})
            </h3>
            <span className="text-[11px] text-slate-400">In this conference</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" 
          aria-label="Close participants"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      {allParticipants.length > 2 && (
        <div className="px-4 py-2 border-b border-slate-100 bg-white">
          <div className="relative flex items-center">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
        {filteredParticipants.map((p) => {
          const initial = (p.userName || "U").replace('(You)', '').trim().charAt(0).toUpperCase();

          return (
            <div 
              key={p.socketId}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {initial}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    {p.userName}
                    {p.isHost && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-200/60">
                        <CrownIcon className="w-3 h-3 text-amber-500" /> Host
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {p.isLocal ? "Current device" : "Connected"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className={`p-1.5 rounded-lg border ${
                  p.audioEnabled 
                    ? "bg-slate-100 text-slate-600 border-slate-200" 
                    : "bg-rose-50 text-rose-500 border-rose-200"
                }`}>
                  {p.audioEnabled ? <MicIcon className="w-3.5 h-3.5" /> : <MicOffIcon className="w-3.5 h-3.5" />}
                </span>

                <span className={`p-1.5 rounded-lg border ${
                  p.videoEnabled 
                    ? "bg-slate-100 text-slate-600 border-slate-200" 
                    : "bg-rose-50 text-rose-500 border-rose-200"
                }`}>
                  {p.videoEnabled ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOffIcon className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </aside>
  );
};

export default ParticipantList;
