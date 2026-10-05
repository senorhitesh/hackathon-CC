'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
} from '../icons/Hugeicons';

export function LandingCTA() {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto text-center relative">
      {/* Ambient Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-purple-600/20 via-cyan-600/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative rounded-3xl bg-neutral-900/90 border border-neutral-800 p-8 sm:p-14 shadow-2xl overflow-hidden">
        {/* Moving Border Beam Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>CometChat Powered Infrastructure</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight max-w-2xl mx-auto leading-tight">
          Ready to review creative campaigns at the speed of thought?
        </h2>

        <p className="mt-4 text-neutral-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Open the infinite dot-grid canvas right now. Invite your team, drop pinpoint notes, and align in live voice huddles in seconds.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 group"
          >
            <span>Launch Canvas Free</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign in with Google / Email</span>
          </Link>
        </div>

        {/* Feature guarantee pills */}
        <div className="mt-10 pt-8 border-t border-neutral-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Zero install required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>CometChat v4 Chat &amp; Voice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Infinite canvas dot-grid</span>
          </div>
        </div>
      </div>
    </section>
  );
}
