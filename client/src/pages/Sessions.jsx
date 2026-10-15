import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCwIcon, SearchIcon, CalendarIcon, ArrowLeftIcon, VideoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { createApiClient } from '../services/api';
import EmptySessions from '../components/sessions/EmptySessions';
import SessionCard from '../components/sessions/SessionCard';
import SessionDetailsModal from '../components/sessions/SessionDetailsModal';
import toast from 'react-hot-toast';

const Sessions = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getUserSessions();
      setSessions(data.meetings || []);
    } catch (err) {
      console.warn("Could not load real sessions:", err.message);
      toast.error("Failed to load meeting sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [api]);

  const openSessionDetails = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId || s.meetingId === sessionId);
    if (session) {
      setSelectedSession(session);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = 
      (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.meetingId || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "active") return matchesSearch && s.status === "active";
    if (statusFilter === "ended") return matchesSearch && s.status === "ended";
    return matchesSearch;
  });

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl w-full">
      
      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Database Meeting Archive</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Conferences & Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Review your live active calls, completed meetings, attendee participation records, and persistent chat transcripts saved in Neon DB.
          </p>
        </div>

        {/* Search, Filter, and Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs w-48 sm:w-56"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-indigo-600 text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "active" ? "bg-emerald-600 text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("ended")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "ended" ? "bg-slate-700 text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={fetchSessions}
            disabled={loading}
            className="p-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Sessions"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sessions Grid / Empty State */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCwIcon className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-700">Loading your conference history from database...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptySessions onStartMeeting={() => navigate('/dashboard')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard 
              key={session.id || session.meetingId}
              session={session}
              onOpenDetails={openSessionDetails}
              onRejoin={(meetingId) => navigate(`/meeting/${meetingId}`)}
            />
          ))}
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)}
      />

    </div>
  );
};

export default Sessions;
