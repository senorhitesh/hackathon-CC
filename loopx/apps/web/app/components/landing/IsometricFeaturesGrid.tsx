'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Mic,
  Zap,
  Layers,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ZoomIn,
  Sparkles,
  Volume2,
} from '../icons/Hugeicons';

export function IsometricFeaturesGrid() {
  const [activeCompareSplit, setActiveCompareSplit] = useState<number>(50);

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto border-t border-neutral-800/80">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Studio Capabilities</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight leading-tight">
          Everything creative agencies need to review, iterate, and ship ad campaigns.
        </h2>
        <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
          Built on modern WebRTC voice streams, CometChat v4 messaging fabric, and an infinite dot-grid vector viewport.
        </p>
      </div>

      {/* Grid of 6 High-Power Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: CometChat Voice Huddle Bar */}
        <div className="lg:col-span-2 rounded-3xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all group overflow-hidden relative shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Mic className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
                Real-Time Audio Streams
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Live Voice Huddles on Canvas
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-lg mb-6">
              Skip booking another Zoom or Google Meet. Hop into a zero-friction voice channel directly on the artboard. Talk through adjustments while your team moves their cursors in real time.
            </p>
          </div>

          {/* Isometric Voice Showcase Preview */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-neutral-950 relative group">
            <img
              src="/isometric-voice.jpg"
              alt="Voice Huddle Isometric Engine"
              className="w-full h-56 object-cover object-center transform group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            {/* Overlay Audio HUD */}
            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Ad Review Huddle #12</p>
                  <p className="text-[10px] font-mono text-emerald-400">4 active speakers • Low Latency</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 rounded bg-emerald-400 animate-eq-1" />
                <span className="w-1 h-5 rounded bg-emerald-400 animate-eq-2" />
                <span className="w-1 h-2 rounded bg-emerald-400 animate-eq-3" />
                <span className="w-1 h-6 rounded bg-emerald-400 animate-eq-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Multi-Format Infinite Canvas */}
        <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all group overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-400 text-[10px] font-mono">
                Infinite Dot Grid
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              All Formats on One Plane
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Review 9:16 vertical reels, 1:1 feed tiles, 16:9 widescreen bumpers, and display banners side-by-side with 25%–300% canvas-only zoom.
            </p>
          </div>

          {/* Visual Mini Formats Preview */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span>CANVAS PRESETS</span>
              <span className="text-purple-400">Aspect 9:16 &amp; 1:1</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-end h-28 pt-2">
              <div className="h-full rounded-lg bg-gradient-to-t from-neutral-800 to-purple-900/40 border border-purple-500/30 flex flex-col justify-end p-1.5 text-center">
                <span className="text-[9px] font-mono text-purple-300">9:16</span>
              </div>
              <div className="aspect-square rounded-lg bg-gradient-to-t from-neutral-800 to-cyan-900/40 border border-cyan-500/30 flex flex-col justify-end p-1.5 text-center">
                <span className="text-[9px] font-mono text-cyan-300">1:1</span>
              </div>
              <div className="h-14 rounded-lg bg-gradient-to-t from-neutral-800 to-emerald-900/40 border border-emerald-500/30 flex flex-col justify-end p-1.5 text-center">
                <span className="text-[9px] font-mono text-emerald-300">16:9</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Interactive A/B Comparison Slider */}
        <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all group overflow-hidden relative shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono">
                A/B Split Test
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Interactive A/B Diffing
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Compare creative copy or color revisions with an interactive split-pane slider before final sign-off.
            </p>
          </div>

          {/* Interactive Split Slider */}
          <div className="space-y-3">
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 select-none">
              {/* Variant A (Underneath) */}
              <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center p-3 text-left">
                <div>
                  <span className="text-[10px] font-mono text-red-400 font-bold block mb-1">
                    VARIANT A (Draft)
                  </span>
                  <p className="text-xs font-serif text-neutral-400 leading-snug">
                    &quot;Explore our new sneakers now.&quot;
                  </p>
                </div>
              </div>

              {/* Variant B (Clipped by slider) */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-indigo-950 to-purple-950 flex items-center justify-center p-3 text-left border-r-2 border-cyan-400"
                style={{ width: `${activeCompareSplit}%` }}
              >
                <div className="whitespace-nowrap overflow-hidden">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">
                    VARIANT B (Optimized)
                  </span>
                  <p className="text-xs font-serif text-white font-medium leading-snug">
                    &quot;Redefine Your Everyday Speed.&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Slider input */}
            <input
              type="range"
              min="10"
              max="90"
              value={activeCompareSplit}
              onChange={(e) => setActiveCompareSplit(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>Drag to compare variants</span>
              <span>{activeCompareSplit}% split</span>
            </div>
          </div>
        </div>

        {/* Card 4: Multiplayer Presence & Cursors */}
        <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all group overflow-hidden relative shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-400 text-[10px] font-mono">
                Multiplayer Mesh
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Real-Time Client Presence
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              See clients and creators actively navigating the canvas. Live colored cursor trails, selection boxes, and instant typing indicators.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">ONLINE COLLABORATORS</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Elena (Lead)
              </div>
              <div className="px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Alex (Client)
              </div>
              <div className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Chen (Motion)
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: 1-Click Client Sign-Off & Audit Trail */}
        <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-8 flex flex-col justify-between hover:border-neutral-700 transition-all group overflow-hidden relative shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                1-Click Approval
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Frictionless Client Approval
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Share a branded proof link. Clients sign off with a single click—no software installation or cumbersome registration required.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Autumn Campaign Sign-Off</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-500">
              Audit Hash: 0x9f83...c421 • Timestamped via CometChat Log
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
