'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  Mic,
  Layers,
  CheckCircle2,
  Share2,
} from './components/icons/Hugeicons';
import { IsometricHeroStage } from './components/landing/IsometricHeroStage';
import { InteractivePinSandbox } from './components/landing/InteractivePinSandbox';
import { IsometricFeaturesGrid } from './components/landing/IsometricFeaturesGrid';
import { WorkflowSection } from './components/landing/WorkflowSection';
import { ComparisonSection } from './components/landing/ComparisonSection';
import { LandingCTA } from './components/landing/LandingCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-cyan-400 selection:text-black flex flex-col antialiased">
      {/* ── Sticky Frosted Glass Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img
                src="/loogx-logo&favicon.png"
                alt="loopx logo"
                className="w-7 h-7 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                loopx
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-400">
                v1.0
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400 font-medium">
            <a href="#hero-stage" className="hover:text-white transition-colors">
              3D Canvas
            </a>
            <a href="#sandbox" className="hover:text-white transition-colors">
              Interactive Pinning
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why loopx
            </a>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-md transition-all active:scale-95 group"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section with Isometric Centerpiece ── */}
      <section id="hero-stage" className="relative px-6 pt-16 pb-12 max-w-6xl mx-auto text-center">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] bg-gradient-to-b from-purple-600/15 via-cyan-600/10 to-transparent pointer-events-none -z-10 blur-3xl" />

        {/* Realtime Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono mb-6 backdrop-blur-md shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Real-Time Creative Review Engine • CometChat v4</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
          Collaborate on creative ads on an infinite isometric canvas.
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed font-sans">
          Review multi-format ad variations, drop sub-pixel pin annotations, and hop into zero-latency voice huddles—all connected directly to CometChat review threads on an infinite visual plane.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 text-black text-xs font-bold shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-95 group"
          >
            <span>Launch Canvas Free</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign in with Google / Email</span>
          </Link>
        </div>

        {/* Social Proof / Metrics Row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✦</span>
            <span>3x Faster Client Sign-Off</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✦</span>
            <span>Zero Vague Email Comments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✦</span>
            <span>Live CometChat Audio &amp; Chat Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">✦</span>
            <span>100% Lossless Spatial Zoom</span>
          </div>
        </div>

        {/* ── THE ISOMETRIC 3D ILLUSTRATION HERO CENTERPIECE ── */}
        <IsometricHeroStage />
      </section>

      {/* ── Interactive Pinning Playground ── */}
      <section id="sandbox">
        <InteractivePinSandbox />
      </section>

      {/* ── Core Capabilities Grid ── */}
      <section id="features">
        <IsometricFeaturesGrid />
      </section>

      {/* ── Step-by-Step Workflow ── */}
      <section id="workflow">
        <WorkflowSection />
      </section>

      {/* ── Comparison Section ── */}
      <section id="comparison">
        <ComparisonSection />
      </section>

      {/* ── High-Impact Bottom CTA ── */}
      <LandingCTA />

      {/* ── Polished Dark Studio Footer ── */}
      <footer className="mt-auto border-t border-neutral-800/80 py-10 px-6 bg-[#060608]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/loogx-logo&favicon.png"
              alt="loopx logo"
              className="w-6 h-6 rounded-md object-contain"
            />
            <span className="text-white font-sans font-semibold text-sm">loopx</span>
            <span className="text-[10px] text-neutral-400 font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
              v1.0 Production
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
            <Link href="/app" className="hover:text-white transition-colors">
              Workspace Canvas
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <a
              href="https://www.cometchat.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>Powered by CometChat</span>
            </a>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-[11px] text-neutral-500">
              Hotkeys: (P) Pin Mode • (C) Center Canvas
            </span>
          </div>

          <div className="text-neutral-500 text-xs font-mono">
            © 2026 loopx Studio Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
