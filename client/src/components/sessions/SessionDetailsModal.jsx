import { XIcon } from 'lucide-react';
import React, { useState } from 'react'
import SessionParticipantsTab from './SessionParticipantsTab';
import SessionChatTab from './SessionChatTab';

const SessionDetailsModal = ({session, onClose}) => {

    const [activeTab, setActiveTab] = useState("chat");

    if(!session) return null;

    const isEnded = session.status === "ended";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                ID: {session.meetingId}
              </span>

              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isEnded ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}>
                {isEnded ? "Ended" : "Active"}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mt-1.5">
              {session.title || "Meeting Details"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Host: {session.host?.name || "Host"} • Created {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
            aria-label="Close Session Details"
          >
            <XIcon className="w-5 h-5"/>
          </button>
        </div>

        {/* Tab Title */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === "chat" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Chat Transcript ({session.messages?.length || 0})
          </button>

          <button 
            onClick={() => setActiveTab("participants")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === "participants" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Participants Log ({session.participants?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-75 bg-[#0b111e]">
          {activeTab === 'chat' ? (
            <SessionChatTab messages={session.messages} />
          ) : (
            <SessionParticipantsTab participants={session.participants} host={session.host} />
          )}
        </div>

      </div>
    </div>
  );
};

export default SessionDetailsModal;
