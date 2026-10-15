import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, PricingTable } from '@clerk/react';
import toast from 'react-hot-toast';
import { 
  VideoIcon, 
  MonitorUpIcon, 
  MessageSquareIcon, 
  ShieldCheckIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  MicIcon, 
  MicOffIcon, 
  UsersIcon, 
  PhoneOffIcon, 
  CheckCircle2Icon, 
  LockIcon, 
  ZapIcon,
  PlayIcon,
  ChevronRightIcon,
  CheckIcon,
  LayersIcon,
  CalendarIcon,
  ClockIcon,
  GlobeIcon
} from 'lucide-react';

const LandingPage = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');

  const handleStartMeeting = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      toast("Please sign in or register to enter your workspace", { icon: "🔒" });
      navigate('/login');
    }
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    const clean = meetingCode.trim().toLowerCase().replace(/.*\/meeting\//, '');
    navigate(`/meeting/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-900 flex flex-col font-sans selection:bg-[#7c3aed] selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Pastel Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[#ede9fe] via-[#f5f3ff] to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-[600px] h-[600px] bg-[#fdf2f8] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-2/3 -left-40 w-[600px] h-[600px] bg-[#eff6ff] rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 1. PUBLIC TOP NAVIGATION (Reference 1 Style) */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-purple-100/80 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] p-0.5 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-[#7c3aed]" />
              </div>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center">
              Conferа<span className="text-[#7c3aed] font-black text-3xl leading-none">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-9 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#7c3aed] transition-colors">Features</a>
            <a href="#solutions" className="hover:text-[#7c3aed] transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-[#7c3aed] transition-colors">Pricing Plan</a>
            <a href="#integrations" className="hover:text-[#7c3aed] transition-colors">Integrations</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(isSignedIn ? '/dashboard' : '/login')}
              className="px-6 py-2.5 rounded-full text-sm font-bold border border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {isSignedIn ? "Go to Dashboard" : "Sign In / Register"}
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION (Reference 1 Style) */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 z-10">
        
        {/* Security & Cloud Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-200/80 shadow-sm shadow-purple-500/5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">
            Enterprise End-to-End Encrypted WebRTC Video Cloud
          </span>
        </div>

        {/* Hero Headline */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Seamless <span className="text-[#7c3aed]">Video Conferencing</span> with Smart, Data-Driven Insights
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Summarize, transcribe, collaborate, and enhance every aspect of your meetings with Confera's intelligent, zero-install architecture.
          </p>
        </div>

        {/* Hero CTA & Quick Join Bar */}
        <div className="max-w-xl mx-auto space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(isSignedIn ? '/dashboard' : '/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSignedIn ? "Open Dashboard" : "Get Started Free"}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartMeeting}
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 transition-all shadow-xs cursor-pointer text-center"
            >
              {isSignedIn ? "Live Dashboard" : "Sign In to Access"}
            </button>
          </div>

          {/* Quick Enter Code Pill */}
          <form onSubmit={handleQuickJoin} className="bg-white/90 p-2 rounded-full border border-purple-200 shadow-md flex items-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Have a meeting code? Enter here..."
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              className="flex-1 bg-transparent text-slate-800 text-xs sm:text-sm pl-4 pr-2 outline-none font-mono placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Join
            </button>
          </form>
        </div>

        {/* Hand-Drawn Arrow Visual Accent pointing to the preview card */}
        <div className="flex justify-center -mb-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7c3aed] italic">
            <span>Explore live conference canvas</span>
            <svg className="w-8 h-8 text-[#7c3aed] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* 3. FLOATING REALISTIC VIDEO-MEETING PREVIEW */}
        <div className="max-w-5xl mx-auto pt-4 pb-12">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_25px_70px_rgba(124,58,237,0.12)] p-4 sm:p-6 overflow-hidden relative">
            
            {/* Top Conference App Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-bold">
                  <VideoIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-slate-900">Confera High-Definition Mesh Video</h2>
                  <p className="text-[11px] text-slate-400 font-mono">End-to-End Encrypted WebRTC Video Cloud</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ultra HD Active</span>
                </span>
                <button 
                  onClick={() => navigate(isSignedIn ? '/dashboard' : '/login')}
                  className="px-3.5 py-1 rounded-full bg-purple-100 text-[#7c3aed] text-xs font-bold hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  {isSignedIn ? "Open Dashboard" : "Enter Room"}
                </button>
              </div>
            </div>

            {/* Split Meeting Interface: Main Stage + Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4">
              
              {/* Left Video Stage (8 cols) */}
              <div className="lg:col-span-8 space-y-3">
                
                {/* Main Large Video Stage Canvas */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md flex items-center justify-center border border-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-purple-950/20 to-slate-950" />
                  
                  {/* Visualizer Pulse */}
                  <div className="z-10 flex flex-col items-center justify-center space-y-3 text-center p-6">
                    <div className="size-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                      <VideoIcon className="w-10 h-10 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">Live WebRTC Video Stage</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">Sub-45ms low-latency mesh routing with dynamic acoustic echo cancellation.</p>
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Adaptive Bitrate 1080p</span>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white">
                    <span>Host Audio Feed • Active</span>
                  </div>
                </div>

                {/* Control Bar inside Preview */}
                <div className="bg-slate-100 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl bg-white text-slate-800 shadow-xs hover:bg-slate-50 cursor-pointer"><MicIcon className="w-4 h-4" /></button>
                    <button className="p-2 rounded-xl bg-white text-slate-800 shadow-xs hover:bg-slate-50 cursor-pointer"><VideoIcon className="w-4 h-4" /></button>
                    <button className="p-2 rounded-xl bg-white text-[#7c3aed] shadow-xs hover:bg-slate-50 cursor-pointer"><MonitorUpIcon className="w-4 h-4" /></button>
                  </div>
                  <button 
                    onClick={() => navigate(isSignedIn ? '/dashboard' : '/login')}
                    className="px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Launch Workspace</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Right Side Panel: Live Capabilities (4 cols) */}
              <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-4 text-left flex flex-col justify-between space-y-4 border border-slate-100">
                
                {/* Capabilities Widget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Real-Time Features</span>
                    <span className="text-[#7c3aed] text-[11px] font-bold">Enabled</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">Mesh P2P Audio & Video</span>
                      <p className="text-[11px] text-slate-500">Zero central server bottlenecks with distributed participant mesh.</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">Real Database Sync</span>
                      <p className="text-[11px] text-slate-500">Persistent meeting history, participant logs, and chat saved to Neon PostgreSQL.</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">Clerk Authentication Gate</span>
                      <p className="text-[11px] text-slate-500">Full identity verification with dedicated user workspace authorization.</p>
                    </div>
                  </div>
                </div>

                {/* Instant Launch CTA */}
                <button
                  onClick={() => navigate(isSignedIn ? '/dashboard' : '/register')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
                >
                  {isSignedIn ? "Go to Dashboard" : "Sign Up to Start"}
                </button>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 4. FEATURE SHOWCASE (Reference 1 Pastel Cards) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold tracking-widest text-[#7c3aed] uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Meet Confera — Redefining the Way You Collaborate
          </h2>
          <p className="text-slate-600 text-base">
            Everything your team needs for flawless, high-resolution meetings, synchronized summaries, and effortless workflows.
          </p>
        </div>

        {/* 3 Pastel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Violet Pastel */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-[#f3e8ff] to-[#faf5ff] border border-purple-200/80 shadow-lg shadow-purple-500/5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-white text-[#7c3aed] flex items-center justify-center shadow-md shadow-purple-500/10">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                Revolutionize Your Meetings Through Automation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated transcription, smart speaker tagging, and instant meeting digests generated the second your call concludes.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-bold text-[#7c3aed] flex items-center gap-1">
                <span>Explore automation</span>
                <ChevronRightIcon className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Amber Pastel */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-[#fef3c7] to-[#fffbeb] border border-amber-200/80 shadow-lg shadow-amber-500/5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-md shadow-amber-500/10">
                <ZapIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                Your Meetings, Supercharged Beyond Note-Taking
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero-latency screen presentation, real-time interactive chat, and synchronized task tracking across distributed teams.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <span>Learn about productivity</span>
                <ChevronRightIcon className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: Sky Blue Pastel */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff] border border-sky-200/80 shadow-lg shadow-sky-500/5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-white text-sky-600 flex items-center justify-center shadow-md shadow-sky-500/10">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                Dive Deeper Into Our Enterprise Solutions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                256-bit AES peer-to-peer encryption, zero software install required, and 99.99% high-availability infrastructure.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-bold text-sky-700 flex items-center gap-1">
                <span>View enterprise security</span>
                <ChevronRightIcon className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. PRICING SECTION (Clerk Integrated) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] text-xs font-bold">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Clerk Scalable Billing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tailored Plans to Match <span className="text-[#7c3aed]">Your Goals</span>
          </h2>
          <p className="text-slate-600 text-base">
            From free personal video rooms to unlimited enterprise collaboration. Managed live through Clerk.
          </p>
        </div>

        {/* Real Clerk Pricing Table Container */}
        <div className="max-w-5xl mx-auto p-4 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-xl shadow-purple-500/5">
          <PricingTable />
        </div>
      </section>

      {/* 6. INTEGRATIONS ECOSYSTEM (Reference 1 Style) */}
      <section id="integrations" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Effortlessly Integrate with Your Existing Tools
          </h2>
          <p className="text-sm text-slate-600">
            Continue using your preferred workflows while Confera seamlessly synchronizes meeting content and calendar highlights.
          </p>
        </div>

        {/* Integration Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4">
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs font-semibold text-xs text-slate-700">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Google Calendar</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs font-semibold text-xs text-slate-700">
            <MessageSquareIcon className="w-4 h-4 text-amber-600" />
            <span>Slack Workspace</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs font-semibold text-xs text-slate-700">
            <LayersIcon className="w-4 h-4 text-slate-900" />
            <span>Notion Sync</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs font-semibold text-xs text-slate-700">
            <UsersIcon className="w-4 h-4 text-indigo-600" />
            <span>Microsoft Teams</span>
          </div>
        </div>
      </section>

      {/* 7. ELEGANT FOOTER */}
      <footer className="w-full bg-white border-t border-purple-100 mt-auto py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white font-bold text-xs">
              <VideoIcon className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm">Conferа Inc.</span>
            <span>•</span>
            <span>Enterprise High-Definition Video Cloud</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link to="/pricing" className="hover:text-[#7c3aed] transition-colors">Pricing</Link>
            <Link to="/dashboard" className="hover:text-[#7c3aed] transition-colors">Dashboard</Link>
            <Link to="/sessions" className="hover:text-[#7c3aed] transition-colors">Conferences</Link>
            <span className="text-slate-400">© 2026 Conferа. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
