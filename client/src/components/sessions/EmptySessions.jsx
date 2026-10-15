import { ArrowRightIcon, VideoIcon } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const EmptySessions = ({ onStartMeeting }) => {
  return (
    <div className="w-full bg-white rounded-3xl p-10 sm:p-16 text-center border border-slate-200/90 shadow-sm flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
        <VideoIcon className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-xl font-bold text-slate-900">
          No meeting sessions recorded yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          When you host or join conferences on Conferа, your logs, attendees, and chat transcripts will automatically show up here.
        </p>
      </div>

      <Link 
        to="/dashboard" 
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>Launch a Meeting Now</span>
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default EmptySessions;
