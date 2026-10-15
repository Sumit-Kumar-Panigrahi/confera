import React from 'react';
import { PricingTable } from "@clerk/react";
import { SparklesIcon, ShieldCheckIcon, ZapIcon, VideoIcon } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Clerk Subscription Management</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Transparent, Scalable Plans
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Select or upgrade your Confera membership plan. All transactions and tier privileges are securely orchestrated via your Clerk billing configuration.
        </p>
      </div>

      {/* Feature Highlighting Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <VideoIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ultra HD 4K Video</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Crystal clear adaptive bitrate streaming with dynamic acoustic echo cancellation and studio-quality mesh audio.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="size-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">End-to-End Encryption</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Zero-knowledge 256-bit AES encryption ensures only verified participants access your conference feeds.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <ZapIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Global Cloud Infrastructure</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sub-45ms low-latency edge routing across global points of presence with continuous failover protection.
          </p>
        </div>
      </div>

      {/* Clerk Pricing Table Container */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Official Clerk Membership Tiers</h3>
            <p className="text-xs text-slate-500">Configured live in your Clerk Dashboard</p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Live Clerk Pricing
          </span>
        </div>
        <PricingTable />
      </div>
    </div>
  );
};

export default Pricing;
