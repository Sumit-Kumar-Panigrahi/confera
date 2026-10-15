import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboardIcon, 
  VideoIcon, 
  SparklesIcon, 
  MenuIcon, 
  XIcon,
  LogInIcon,
  ArrowRightIcon
} from "lucide-react";
import { UserButton, useUser, SignInButton, SignUpButton } from '@clerk/react';

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboardIcon },
    { label: "Conferences", path: "/sessions", icon: VideoIcon },
    { label: "Plans & Pricing", path: "/pricing", icon: SparklesIcon },
  ];

  return (
    <header className="w-full bg-[#060911]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-[#0b5cff] to-[#3b82f6] p-0.5 shadow-lg shadow-[#0b5cff]/25 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#060911] rounded-[10px] flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              Conferа<span className="text-[#3b82f6] font-black">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-[#0b5cff]/15 text-[#3b82f6] border border-[#0b5cff]/30 shadow-[0_0_15px_rgba(11,92,255,0.12)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#3b82f6]" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right pr-1">
                <span className="text-xs font-semibold text-slate-200 leading-none">{userName}</span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>

              <div className="p-0.5 rounded-full ring-2 ring-[#0b5cff]/30 bg-slate-800">
                <UserButton afterSignOutUrl="/dashboard" />
              </div>

              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <SignInButton mode="modal">
                <button className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800/80 border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5">
                  <LogInIcon className="w-3.5 h-3.5" />
                  <span>Sign in</span>
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="text-xs font-semibold bg-gradient-to-r from-[#0b5cff] to-[#2563eb] hover:from-[#004fe0] hover:to-[#1d4ed8] text-white px-4 py-2 rounded-xl shadow-lg shadow-[#0b5cff]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5">
                  <span>Sign up free</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>

              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#060911]/95 backdrop-blur-2xl px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#0b5cff]/20 text-[#3b82f6] border border-[#0b5cff]/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#3b82f6]" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
