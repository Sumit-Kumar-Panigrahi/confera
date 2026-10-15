import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarIcon, 
  VideoIcon, 
  PlusIcon, 
  ArrowUpRightIcon, 
  CheckIcon, 
  CopyIcon, 
  UsersIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  LayersIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  ArrowRightIcon
} from "lucide-react";
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import toast from "react-hot-toast";
import { useUser, useAuth } from '@clerk/react';
import { createApiClient } from '../services/api';

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext() || {};

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [activePeriod, setActivePeriod] = useState("1M");
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  // Data states
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [copiedPmi, setCopiedPmi] = useState(false);

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const userName = user?.firstName || user?.fullName?.split(' ')[0] || (isSignedIn ? "Member" : "Host");
  const userFullName = user?.fullName || user?.firstName || (isSignedIn ? "Host" : "Conference Host");

  // Derive static Personal Meeting ID (PMI)
  const pmiCode = useMemo(() => {
    if (!user?.id) return "pmi-854-confera";
    const hash = Math.abs(user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 900) + 100;
    return `pmi-${hash}-room`;
  }, [user?.id]);

  // Load meeting sessions when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoadingData(true);
      api.getUserSessions()
        .then((res) => {
          setSessions(res.meetings || []);
        })
        .catch((err) => {
          console.warn("Could not load sessions:", err.message);
        })
        .finally(() => setLoadingData(false));
    }
  }, [isLoaded, isSignedIn, api]);

  // Upcoming meetings list (Real DB sessions only)
  const upcomingMeetingsList = useMemo(() => {
    return sessions.slice(0, 5).map((s) => ({
      id: s.meetingId || s.id,
      title: s.title || "Team Conference",
      time: s.createdAt ? new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Active",
      host: s.host?.name || userName,
      avatarColor: s.status === 'active' ? "from-emerald-400 to-teal-600" : "from-blue-500 to-indigo-600",
      participantsCount: s.participants?.length || 1,
      status: s.status
    }));
  }, [sessions, userName]);

  // Derived Real Analytics
  const totalEventsCount = outletContext.stats?.totalCount ?? sessions.length;
  const completedEventsCount = sessions.filter(s => s.status === 'ended').length;
  const activeEventsCount = sessions.filter(s => s.status === 'active').length;
  const totalParticipantsCount = sessions.reduce((acc, s) => acc + (s.participants?.length || 1), 0);

  // Extract real meeting days of current month for Calendar
  const meetingDaysSet = useMemo(() => {
    const days = new Set();
    sessions.forEach(s => {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        days.add(d.getDate());
      }
    });
    return days;
  }, [sessions]);

  // Calculate dynamic 7-day activity based on real sessions
  const activityDays = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const label = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const daySessions = sessions.filter((s) => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return d.toDateString() === targetDate.toDateString();
      });
      list.push({ label, count: daySessions.length });
    }
    return list;
  }, [sessions]);

  // Copy PMI
  const copyPmiLink = () => {
    const url = `${window.location.origin}/meeting/${pmiCode}`;
    navigator.clipboard.writeText(url);
    setCopiedPmi(true);
    toast.success("Personal Meeting Room link copied!");
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  // Launch instant meeting
  const handleLaunchInstant = async () => {
    try {
      const res = await api.createMeeting("Instant Conference");
      navigate(`/meeting/${res.meeting.meetingId}`);
    } catch (err) {
      toast.error(err.message || "Failed to create conference");
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full">

      {/* If Integrations Tab is clicked */}
      {currentTab === 'integrations' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Sync & Connect</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Workspace Integrations</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Synchronize your calendar, send automatic meeting recaps, and automate conference workflows.
                </p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[
                { name: "Google Calendar", desc: "Automate scheduling, invite synchronization, and one-click join links.", icon: "G", color: "text-blue-600 bg-blue-50 border-blue-200", status: "Connected" },
                { name: "Slack Workspace", desc: "Broadcast instant room links and push transcript summaries to channels.", icon: "#", color: "text-amber-600 bg-amber-50 border-amber-200", status: "Active" },
                { name: "Notion Sync", desc: "Save AI session notes and action items directly into team databases.", icon: "N", color: "text-slate-900 bg-slate-100 border-slate-300", status: "Available" },
                { name: "Microsoft Teams", desc: "Cross-platform routing and synchronized audio bridge integration.", icon: "T", color: "text-indigo-600 bg-indigo-50 border-indigo-200", status: "Available" },
                { name: "GitHub Sync", desc: "Attach conference recaps and architecture discussions to PR reviews.", icon: "GH", color: "text-purple-600 bg-purple-50 border-purple-200", status: "Available" },
                { name: "Webhooks & API", desc: "Custom HTTP callbacks for meeting start, completion, and recording ready.", icon: "API", color: "text-emerald-600 bg-emerald-50 border-emerald-200", status: "Active" }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-3xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`size-10 rounded-2xl flex items-center justify-center font-black text-sm border ${item.color}`}>
                        {item.icon}
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.status === 'Connected' || item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => toast.success(`${item.name} settings updated`)}
                    className="w-full py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Row Grid: Upcoming Meetings (Left) | Completed Events Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 1. Upcoming Meetings Card (Reference 2 Left Top) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Upcoming meetings</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {upcomingMeetingsList.length}
              </span>
            </h2>
            <button 
              onClick={() => navigate('/sessions')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="View all meetings"
            >
              <ArrowUpRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Meetings List */}
          <div className="space-y-3">
            {loadingData ? (
              <div className="py-12 flex items-center justify-center text-slate-400 text-xs font-semibold">
                Loading real meetings from database...
              </div>
            ) : upcomingMeetingsList.length === 0 ? (
              <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                <VideoIcon className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No meeting sessions yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs">Launch an instant call or schedule a conference to start collaborating.</p>
              </div>
            ) : (
              upcomingMeetingsList.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Geometric Thumbnail Badge (Reference 2 Style) */}
                    <div className={`size-12 rounded-xl bg-gradient-to-tr ${meeting.avatarColor} text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm`}>
                      <VideoIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {meeting.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {meeting.time}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <UsersIcon className="w-3 h-3 text-slate-400" />
                        <span>{meeting.host} • {meeting.participantsCount} {meeting.participantsCount === 1 ? 'attendee' : 'attendees'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                    className="px-5 py-2 rounded-full border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-900 text-slate-800 hover:text-white font-bold text-xs transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    Join now
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Launch Buttons Bar */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleLaunchInstant}
              className="flex-1 py-2.5 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Start Instant Call</span>
            </button>
            <button
              onClick={() => outletContext.openJoinModal?.()}
              className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Enter Room Code</span>
            </button>
          </div>
        </div>

        {/* 2. Completed Events / Activity Curve Chart (Reference 2 Right Top) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Completed events</h2>
              <p className="text-xs text-slate-400">Conference attendance & team activity over time</p>
            </div>

            {/* Period Pills (1W, 1M, 6M, 1Y) */}
            <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold text-slate-500">
              {["1W", "1M", "6M", "1Y"].map((period) => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activePeriod === period
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container with Dynamic Activity Heights */}
          <div className="relative pt-4">
            
            {/* Metric Tooltip Overlay */}
            <div className="absolute top-2 left-1/3 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-xl text-xs font-bold shadow-xs z-10">
              <span>{completedEventsCount} Completed sessions</span>
              <span className="text-emerald-700 font-black ml-1.5">{activeEventsCount} Active now</span>
            </div>

            <div className="h-44 w-full flex items-end pt-4">
              <div className="w-full h-full flex items-end justify-between gap-2 px-1">
                {activityDays.map((item, idx) => {
                  const maxCount = Math.max(...activityDays.map(d => d.count), 1);
                  const heightPct = item.count > 0 ? Math.max((item.count / maxCount) * 80, 16) : 8;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className={`text-[10px] font-mono font-bold transition-opacity ${item.count > 0 ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}>
                        {item.count}
                      </span>
                      <div 
                        className={`w-full max-w-[36px] rounded-xl transition-all duration-300 ${
                          item.count > 0 
                            ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm shadow-indigo-500/20" 
                            : "bg-slate-100 hover:bg-slate-200"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[46px] pt-1 border-t border-slate-100 w-full text-center">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row Grid: Interactive Calendar | Analytics Cards & PMI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 3. Calendar Widget (Reference 2 Left Bottom) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Calendar</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <div className="flex items-center ml-2">
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><ChevronLeftIcon className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><ChevronRightIcon className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
            {[
              27, 28, 29, 30, 1, 2, 3,
              4, 5, 6, 7, 8, 9, 10,
              11, 12, 13, 14, 15, 16, 17,
              18, 19, 20, 21, 22, 23, 24,
              25, 26, 27, 28, 29, 30, 31
            ].map((day, idx) => {
              const isCurrentMonth = idx >= 4;
              const isMeetingDay = isCurrentMonth && meetingDaysSet.has(day);
              const isSelected = selectedDate === day && isCurrentMonth;

              return (
                <button
                  key={idx}
                  onClick={() => isCurrentMonth && setSelectedDate(day)}
                  className={`h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                    !isCurrentMonth ? "text-slate-300" :
                    isSelected ? "bg-slate-900 text-white font-bold" :
                    isMeetingDay ? "bg-amber-100 text-amber-900 font-bold" :
                    "hover:bg-slate-100"
                  }`}
                >
                  <span>{day}</span>
                  {isMeetingDay && !isSelected && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Integrations Row */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrations</span>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-xl bg-blue-100 text-blue-600 font-black flex items-center justify-center text-xs">
                  G
                </div>
                <div>
                  <span className="font-bold text-slate-800">Google Calendar</span>
                  <p className="text-[10px] text-slate-400">Sync meeting dates & updates</p>
                </div>
              </div>
              <button 
                onClick={() => toast.success("Google Calendar connected")}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-100 cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* 4. Analytics Overview & PMI Card (Reference 2 Right Bottom) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Analytics 4 Metric Tiles */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Analytics</h3>
              <span className="text-xs font-bold text-slate-500">Real-Time Data</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Total Meetings</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{totalEventsCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Live Database</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Completed</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{completedEventsCount}</span>
                <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">Archived Logs</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Total Attendees</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{totalParticipantsCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">All Conferences</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Active Now</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{activeEventsCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">In Progress</span>
              </div>
            </div>
          </div>

          {/* Personal Meeting Room (PMI) Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Permanent Video Room</span>
              <h4 className="text-sm font-extrabold text-slate-900">Personal Conference Address</h4>
              <p className="text-xs text-slate-500 font-mono">
                {window.location.origin}/meeting/{pmiCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyPmiLink}
                className="px-4 py-2 rounded-full border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedPmi ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedPmi ? "Copied" : "Copy Link"}</span>
              </button>

              <button
                onClick={() => navigate(`/meeting/${pmiCode}`)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>Launch</span>
              </button>
            </div>
          </div>

          {/* Premium Geometric Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="space-y-1.5 max-w-sm z-10">
              <h4 className="text-base font-extrabold tracking-tight">
                Upgrade and unlock professional access!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Customize your Confera room, connect all your enterprise apps, and scale your conference capacity.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="mt-3 px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                View Clerk Plans
              </button>
            </div>

            {/* Abstract Geometric Pattern Tile */}
            <div className="size-28 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center p-3 z-10 shrink-0">
              <div className="grid grid-cols-2 gap-2 w-full h-full">
                <div className="rounded-xl bg-indigo-500/40" />
                <div className="rounded-xl bg-purple-500/40" />
                <div className="rounded-xl bg-emerald-500/40" />
                <div className="rounded-xl bg-amber-500/40" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
