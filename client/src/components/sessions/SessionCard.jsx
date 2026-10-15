import React from 'react';
import { CalendarIcon, UsersIcon, MessageSquareIcon, ArrowRightIcon } from 'lucide-react';

const SessionCard = ({ session, onOpenDetails, onRejoin }) => {
  const isEnded = session.status === "ended";
  const participantsCount = session.participants?.length || 0;
  const messagesCount = session.messages?.length || 0;

  return (
    <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between space-y-5 border border-slate-200/90 group shadow-xs">

      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {session.meetingId}
          </span>

          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
            isEnded 
              ? "bg-slate-100 text-slate-600 border-slate-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            <span className={`size-1.5 rounded-full ${isEnded ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
            {isEnded ? "Completed" : "In Progress"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
          {session.title || "Instant Meeting"}
        </h3>

        {/* Date / Time */}
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          {session.createdAt ? new Date(session.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) : "Recent"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="truncate text-slate-600">
            <strong className="font-semibold text-slate-900">{participantsCount}</strong> {participantsCount === 1 ? "Person" : "People"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <MessageSquareIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="truncate text-slate-600">
            <strong className="font-semibold text-slate-900">{messagesCount}</strong> Chats
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button 
          onClick={() => onOpenDetails(session.id || session.meetingId)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-full text-xs transition-colors cursor-pointer text-center"
        >
          View Log
        </button>
        
        {!isEnded && (
          <button 
            onClick={() => onRejoin(session.meetingId)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-full text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 active:scale-95"
          >
            <span>Rejoin</span>
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        )}
      </div>

    </div>
  );
};

export default SessionCard;
