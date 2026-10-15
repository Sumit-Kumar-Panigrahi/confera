import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboardIcon, 
  CalendarIcon, 
  VideoIcon, 
  BarChart3Icon, 
  LayersIcon, 
  SettingsIcon, 
  PlusIcon, 
  SearchIcon, 
  BellIcon, 
  CopyIcon,
  CheckIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useAuth, UserButton } from '@clerk/react';
import toast from 'react-hot-toast';
import { createApiClient } from '../services/api';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

const Protectedlayout = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'join' | 'schedule' | 'invite'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingCodeInput, setMeetingCodeInput] = useState("");
  const [scheduleData, setScheduleData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: "10:30",
  });
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [formError, setFormError] = useState("");
  const [stats, setStats] = useState(null);

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const userName = user?.firstName || user?.fullName?.split(' ')[0] || (isSignedIn ? "Member" : "Host");
  const userFullName = user?.fullName || user?.firstName || (isSignedIn ? "Host" : "Conference Host");

  // Fetch real plan & stats for sidebar
  const fetchStats = async () => {
    if (isSignedIn) {
      try {
        const res = await api.getMeetingStats();
        setStats(res);
      } catch (err) {
        console.warn("Could not load stats:", err.message);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isSignedIn, api]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Extract clean code
  const extractMeetingCode = (input) => {
    if (!input) return "";
    let clean = input.trim().toLowerCase();
    if (clean.includes("/meeting/")) {
      clean = clean.split("/meeting/")[1].split("?")[0].split("#")[0];
    }
    return clean;
  };

  // Instant Launch
  const handleStartInstantMeeting = async (title) => {
    try {
      setIsSubmitting(true);
      const res = await api.createMeeting(title || "Instant Conference");
      navigate(`/meeting/${res.meeting.meetingId}`);
    } catch (err) {
      toast.error(err.message || "Could not initialize conference");
    } finally {
      setIsSubmitting(false);
      setActiveModal(null);
    }
  };

  // Join Meeting
  const handleJoinSubmit = (e) => {
    e?.preventDefault();
    setFormError("");
    const code = extractMeetingCode(meetingCodeInput);
    if (!code) {
      setFormError("Please enter a valid room ID or link");
      return;
    }
    setActiveModal(null);
    navigate(`/meeting/${encodeURIComponent(code)}`);
  };

  // Schedule Meeting
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const title = scheduleData.title.trim() || "Scheduled Team Sync";
      const res = await api.createMeeting(title);
      const meetingId = res.meeting.meetingId;
      const meetingUrl = `${window.location.origin}/meeting/${meetingId}`;
      const inviteText = `${userFullName} invites you to a scheduled Confera conference.\n\nTopic: ${title}\nDate: ${scheduleData.date} at ${scheduleData.time}\n\nJoin Meeting:\n${meetingUrl}\n\nMeeting ID: ${meetingId}\nSecurity: Enterprise End-to-End Encryption`;

      setGeneratedInvite({
        title,
        meetingId,
        url: meetingUrl,
        fullText: inviteText,
      });

      setActiveModal('invite');
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Failed to schedule conference");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    toast.success("Meeting invitation copied!");
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // Dynamic Page Title
  const getPageTitle = () => {
    if (location.pathname === '/sessions') return "Conferences & Logs";
    if (location.pathname === '/pricing') return "Plans & Pricing";
    if (location.search.includes('tab=calendar')) return "Calendar";
    if (location.search.includes('tab=integrations')) return "Integrations";
    return `Welcome, ${userName}!`;
  };

  const isCurrentTab = (path, tabParam) => {
    if (tabParam) {
      return location.pathname === path && location.search.includes(`tab=${tabParam}`);
    }
    return location.pathname === path && (!location.search || location.search === '');
  };

  const navigateTab = (url) => {
    navigate(url);
    setMobileMenuOpen(false);
  };

  // Reusable Sidebar Nav Content
  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Top Brand Logo */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => navigateTab('/dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="size-9 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] p-0.5 shadow-md shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#11141d] rounded-[10px] flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              CONFERA<span className="text-indigo-500">.</span>
            </span>
          </div>

          {/* Close button on mobile drawer */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs font-semibold">
          <button
            onClick={() => navigateTab('/dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              isCurrentTab('/dashboard')
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboardIcon className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigateTab('/dashboard?tab=calendar')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              isCurrentTab('/dashboard', 'calendar')
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => navigateTab('/sessions')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              location.pathname === '/sessions'
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <VideoIcon className="w-4 h-4 text-slate-400" />
            <span>Conferences & Logs</span>
          </button>

          <button
            onClick={() => navigateTab('/pricing')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              location.pathname === '/pricing'
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BarChart3Icon className="w-4 h-4 text-slate-400" />
            <span>Plans & Pricing</span>
          </button>

          <button
            onClick={() => navigateTab('/dashboard?tab=integrations')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              isCurrentTab('/dashboard', 'integrations')
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayersIcon className="w-4 h-4 text-slate-400" />
            <span>Integrations</span>
          </button>

          <button
            onClick={() => {
              setActiveModal('schedule');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <span>Schedule Call</span>
          </button>
        </nav>
      </div>

      {/* Bottom Plan Card */}
      <div className="bg-[#181c28] border border-slate-800 p-4 rounded-2xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 size-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            {stats?.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
          </span>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {stats?.plan === 'premium' 
              ? 'Unlimited 4K calls, cloud transcripts, and 100 participants per room.'
              : `${stats?.monthlyCount || 0} of ${stats?.monthlyLimit || 30} free monthly meetings used.`}
          </p>
        </div>

        <button
          onClick={() => navigateTab('/pricing')}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-md cursor-pointer active:scale-95 text-center"
        >
          {stats?.plan === 'premium' ? 'View Plan Details' : 'Upgrade via Clerk'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#f3f4f8] text-slate-800 font-sans overflow-hidden relative">
      
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="w-64 bg-[#11141d] text-slate-300 hidden lg:flex flex-col justify-between shrink-0 p-6 z-20 shadow-2xl">
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-IN DRAWER */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-[#11141d] text-slate-300 p-6 z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent()}
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        
        {/* Top Header Bar */}
        <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 md:px-10 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          
          {/* Left: Mobile Hamburger + Dynamic Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-none">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Input (Hidden on mobile) */}
            <div className="relative hidden md:block">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search meetings, logs..."
                className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 lg:w-56"
              />
            </div>

            {/* Quick Action + Create Dropdown */}
            <button
              onClick={() => setActiveModal('create')}
              className="px-3 sm:px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {/* Notifications */}
            <button 
              onClick={() => toast("Notifications up to date")}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer hidden sm:block"
              title="Notifications"
            >
              <BellIcon className="w-4 h-4" />
            </button>

            {/* User Profile Avatar with redirect to /dashboard */}
            {isSignedIn && (
              <div className="p-0.5 rounded-full ring-2 ring-indigo-500/20">
                <UserButton afterSignOutUrl="/dashboard" />
              </div>
            )}
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 w-full">
          <Outlet context={{ 
            stats, 
            refreshStats: fetchStats, 
            openCreateModal: () => setActiveModal('create'),
            openJoinModal: () => setActiveModal('join'),
            openScheduleModal: () => setActiveModal('schedule')
          }} />
        </main>
      </div>

      {/* DIALOG 1: Create Meeting Modal */}
      <Dialog
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal(null)}
        title="Create New Meeting"
        description="Launch an instant session or schedule a conference with custom topic."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meeting Topic</label>
            <input
              type="text"
              placeholder="e.g. Sprint Architecture Sync"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="primary"
              isLoading={isSubmitting}
              onClick={() => handleStartInstantMeeting(meetingTitle)}
              className="w-full justify-center"
            >
              Launch Now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveModal('schedule');
                setScheduleData((prev) => ({ ...prev, title: meetingTitle }));
              }}
              className="w-full justify-center"
            >
              Schedule
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG 2: Join Meeting Modal */}
      <Dialog
        isOpen={activeModal === 'join'}
        onClose={() => { setActiveModal(null); setFormError(""); }}
        title="Join a Meeting"
        description="Enter the meeting ID or full invitation link provided by the host."
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meeting Code or Link</label>
            <input
              type="text"
              placeholder="e.g. abc-def-ghi"
              value={meetingCodeInput}
              onChange={(e) => { setMeetingCodeInput(e.target.value); setFormError(""); }}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
            {formError && <p className="text-xs text-rose-400 mt-1.5">{formError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" type="submit">Join Conference</Button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG 3: Schedule Meeting Modal */}
      <Dialog
        isOpen={activeModal === 'schedule'}
        onClose={() => setActiveModal(null)}
        title="Schedule Future Conference"
        description="Set the date, time, and topic to generate an official invitation."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Topic</label>
            <input
              type="text"
              required
              placeholder="e.g. Client Design Review"
              value={scheduleData.title}
              onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Time</label>
              <input
                type="time"
                required
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Generate Invitation</Button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG 4: Generated Invite Modal */}
      <Dialog
        isOpen={activeModal === 'invite'}
        onClose={() => setActiveModal(null)}
        title="Conference Scheduled!"
        description="Share this link or complete invitation text with your participants."
      >
        {generatedInvite && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Meeting URL</span>
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-indigo-400 truncate">{generatedInvite.url}</span>
                <button
                  onClick={() => copyInviteText(generatedInvite.url)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => copyInviteText(generatedInvite.fullText)}
                className="flex items-center gap-1.5"
              >
                {copiedInvite ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                <span>{copiedInvite ? "Copied" : "Copy Full Invitation"}</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  setActiveModal(null);
                  navigate(`/meeting/${generatedInvite.meetingId}`);
                }}
              >
                Join Now
              </Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
};

export default Protectedlayout;
