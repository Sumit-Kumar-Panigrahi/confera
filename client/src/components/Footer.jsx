import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl mt-auto py-6 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium">All systems operational</span>
          </div>
          <span className="text-slate-700">•</span>
          <span>Enterprise Cloud Network • 99.99% Uptime</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link to="/sessions" className="hover:text-white transition-colors">Sessions</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Documentation</a>
          <span className="text-slate-500">© 2026 Conferа Inc.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
