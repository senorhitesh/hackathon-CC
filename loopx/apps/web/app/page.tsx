'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Share2,
  MessageSquare,
  Zap,
  Clock,
} from './components/icons/Hugeicons';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col">
      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shadow-xs">
            <svg
              className="w-3.5 h-3.5 fill-black"
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900">
            loopx
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-80 bg-gradient-to-b from-neutral-200/50 via-neutral-100/20 to-transparent pointer-events-none -z-10 blur-3xl" />

        {/* Subtle pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/90 text-neutral-700 text-xs font-mono mb-6 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime Node-Based Collaboration Engine</span>
        </div>

        {/* Main Title with DM Serif Display */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-neutral-950 leading-[1.05] max-w-3xl mx-auto">
          Collaborate on creative ads with visual workflow nodes.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-neutral-600 max-w-xl mx-auto leading-relaxed font-sans">
          Connect your creative post variations directly to CometChat iteration nodes on an infinite dot-grid canvas. Share instant collaborative links with clients.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white border border-neutral-200/90 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sign in with Google / Email</span>
          </Link>
        </div>

        {/* Hero Visual Mockup on Dot Canvas */}
        <div className="mt-14 rounded-2xl border border-neutral-200/90 bg-neutral-50 p-4 shadow-[0_16px_50px_-8px_rgba(15,23,42,0.12)] overflow-hidden dot-canvas relative text-left">
          <div className="rounded-xl border border-neutral-200/80 bg-white/95 backdrop-blur-md p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-neutral-700 font-medium">
                  main-studio-workspace / live sync
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                Canvas zoom: 100% (Ctrl+ / -)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Post Node Preview */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600">
                    IG 1:1 SQUARE
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="w-3 h-3 text-blue-600" />
                    In Review
                  </span>
                </div>
                <div className="aspect-square rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center relative">
                  <img
                    src="/default-card.png"
                    alt="Creative Ad"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 w-5 h-5 rounded-full bg-black text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-md">
                    1
                  </div>
                </div>
                <p className="text-xs text-neutral-700 leading-snug font-medium">
                  Summer Campaign Hero Variation #1
                </p>
              </div>

              {/* CometChat Node Preview */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center">
                        <MessageSquare className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-900">
                        CometChat Iteration Node
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-medium">Connected</span>
                  </div>

                  <div className="space-y-2 mt-3 text-xs">
                    <div className="p-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-0.5">
                        <span className="font-semibold text-neutral-700">Creative Lead</span>
                        <span>Owner</span>
                      </div>
                      <p className="text-[11px]">Pin #1: Let&apos;s bump the contrast on the headline text.</p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-100/80 text-neutral-800">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-0.5">
                        <span className="font-semibold text-neutral-700">Client Reviewer</span>
                        <span>Client</span>
                      </div>
                      <p className="text-[11px]">Agreed! Once adjusted, we can mark this approved.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                  <Zap className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Real-time sync via CometChat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Strip ── */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-200/80">
        <div className="p-6 rounded-2xl border border-neutral-200/80 bg-white/90 hover:bg-white hover:border-neutral-300 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] transition-all space-y-3 group">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Sharable Collaboration</h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-sans">
            Generate instant shareable links for client review. Anyone with the URL joins the canvas with live presence.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200/80 bg-white/90 hover:bg-white hover:border-neutral-300 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] transition-all space-y-3 group">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Canvas-Only Zoom</h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-sans">
            Press Ctrl+ and Ctrl- or pinch-zoom to scale the canvas viewport from 25% to 300% without scaling browser text.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200/80 bg-white/90 hover:bg-white hover:border-neutral-300 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] transition-all space-y-3 group">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Google & Email Auth</h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-sans">
            Sign in with your Google account via OAuth or email and password. Sessions sync seamlessly across all workspaces.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-neutral-200/80 py-6 px-6 text-center text-xs font-mono text-neutral-500 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5 fill-black"
            viewBox="0 0 76 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          <span className="text-neutral-900 font-sans font-semibold">loopx</span>
          <span className="text-[10px] text-neutral-400 font-mono">v1.0</span>
        </div>
        <span className="text-neutral-400 text-[11px]">Real-Time Creative Review Engine</span>
      </footer>
    </div>
  );
}
