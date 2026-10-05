'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Mic,
  ArrowRight,
  Play,
  Layers,
} from '../icons/Hugeicons';

type ViewMode = 'stage' | 'exploded' | 'cinema';

export function IsometricHeroStage() {
  const [viewMode, setViewMode] = useState<ViewMode>('stage');
  const [activePin, setActivePin] = useState<number>(1);
  const [isHuddleActive, setIsHuddleActive] = useState<boolean>(true);
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth mouse tilt parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({
      x: x * 14, // max 7 deg tilt
      y: -y * 14,
    });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Chat comments associated with pins
  const pinDetails: Record<number, { title: string; author: string; role: string; comment: string; time: string; status: string; color: string }> = {
    1: {
      title: 'TikTok 9:16 Video Hook',
      author: 'Sarah J.',
      role: 'Creative Director',
      comment: 'Pin #1: Let’s boost the contrast on the hook copy by +15% so it pops on dark mode feeds.',
      time: '2m ago',
      status: 'In Review',
      color: 'from-amber-500 to-orange-500',
    },
    2: {
      title: 'Instagram 1:1 Carousel',
      author: 'Marcus Vance',
      role: 'Brand Lead',
      comment: 'Pin #2: Color grade & typography approved. Matches our Autumn 2026 design token guidelines!',
      time: 'Just now',
      status: 'Approved',
      color: 'from-emerald-500 to-teal-500',
    },
    3: {
      title: 'YouTube 16:9 Display Banner',
      author: 'Chloe K.',
      role: 'Client Reviewer',
      comment: 'Pin #3: CTA button font size should be at least 14pt for mobile web conversions.',
      time: '5m ago',
      status: 'Open Note',
      color: 'from-indigo-500 to-purple-500',
    },
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto my-8">
      {/* ── View Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 text-xs backdrop-blur-md shadow-lg">
          <button
            id="view-mode-stage-btn"
            onClick={() => setViewMode('stage')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'stage'
                ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                : 'hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>📐 Isometric 3D Stage</span>
          </button>

          <button
            id="view-mode-exploded-btn"
            onClick={() => setViewMode('exploded')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'exploded'
                ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                : 'hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>💥 Exploded Layers</span>
          </button>

          <button
            id="view-mode-cinema-btn"
            onClick={() => setViewMode('cinema')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'cinema'
                ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                : 'hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>✨ 8K Cinema Render</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Voice Huddle Pill */}
          <button
            onClick={() => setIsHuddleActive(!isHuddleActive)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 backdrop-blur-md ${
              isHuddleActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-0.5">
              <span className={`w-1 rounded-full bg-emerald-400 ${isHuddleActive ? 'animate-eq-1' : 'h-2'}`} />
              <span className={`w-1 rounded-full bg-emerald-400 ${isHuddleActive ? 'animate-eq-2' : 'h-3'}`} />
              <span className={`w-1 rounded-full bg-emerald-400 ${isHuddleActive ? 'animate-eq-3' : 'h-1.5'}`} />
            </div>
            <span>{isHuddleActive ? 'Voice Huddle Live (4)' : 'Huddle Inactive'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>CometChat v4 Sync</span>
          </div>
        </div>
      </div>

      {/* ── Main Isometric Canvas Stage Area ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[580px] sm:h-[660px] lg:h-[720px] rounded-3xl bg-neutral-950 border border-neutral-800/80 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85)] overflow-hidden perspective-1400 select-none flex items-center justify-center p-4"
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── CINEMA RENDER MODE ── */}
        {viewMode === 'cinema' ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center animate-fade-in">
            <img
              src="/isometric-hero.jpg"
              alt="loopx 3D Isometric Creative Canvas"
              className="w-full h-full object-cover rounded-2xl transform scale-100 hover:scale-105 transition-transform duration-700"
            />
            {/* Interactive Hotspot 1 (TikTok) */}
            <div
              onClick={() => setActivePin(1)}
              className="absolute top-[32%] left-[48%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-beacon-ping" />
                <div className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform">
                  1
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="px-3 py-1.5 rounded-lg bg-neutral-900/95 border border-cyan-500/40 text-white text-[11px] font-sans shadow-xl whitespace-nowrap">
                  <span className="font-semibold text-cyan-400">Pin #1:</span> Video Hook Contrast
                </div>
                <div className="w-2 h-2 bg-neutral-900 rotate-45 -mt-1 border-r border-b border-cyan-500/40" />
              </div>
            </div>

            {/* Interactive Hotspot 2 (Instagram) */}
            <div
              onClick={() => setActivePin(2)}
              className="absolute top-[48%] left-[34%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full bg-purple-400/40 animate-beacon-ping" />
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white font-mono text-xs font-bold shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  2
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="px-3 py-1.5 rounded-lg bg-neutral-900/95 border border-purple-500/40 text-white text-[11px] font-sans shadow-xl whitespace-nowrap">
                  <span className="font-semibold text-purple-400">Pin #2:</span> Brand Color Grade
                </div>
                <div className="w-2 h-2 bg-neutral-900 rotate-45 -mt-1 border-r border-b border-purple-500/40" />
              </div>
            </div>

            {/* Interactive Hotspot 3 (CometChat Thread) */}
            <div
              onClick={() => setActivePin(3)}
              className="absolute top-[38%] right-[14%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full bg-emerald-400/40 animate-beacon-ping" />
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white font-mono text-xs font-bold shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Floating Live Badge */}
            {(() => {
              const currentPinData = pinDetails[activePin] ?? {
                title: 'TikTok 9:16 Video Hook',
                author: 'Sarah J.',
                role: 'Creative Director',
                comment: 'Pin #1: Let’s boost the contrast on the hook copy by +15% so it pops on dark mode feeds.',
                time: '2m ago',
                status: 'In Review',
                color: 'from-amber-500 to-orange-500',
              };
              return (
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between p-4 rounded-2xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono text-neutral-300">
                      {currentPinData.title} — <strong className="text-white">{currentPinData.comment}</strong>
                    </span>
                  </div>
                  <span className="hidden md:inline text-[11px] font-mono text-cyan-400">
                    Live CometChat Real-Time Thread
                  </span>
                </div>
              );
            })()}
          </div>
        ) : (
          /* ── 3D ISOMETRIC / EXPLODED STAGE ── */
          <div
            className="relative w-full h-full flex items-center justify-center preserve-3d transition-transform duration-300"
            style={{
              transform: `rotateX(${viewMode === 'exploded' ? 62 : 55 + mouseTilt.y}deg) rotateZ(${
                viewMode === 'exploded' ? -42 : -36 + mouseTilt.x
              }deg) scale(0.95)`,
            }}
          >
            {/* ── LAYER 0: Ground Dot-Grid Isometric Plane ── */}
            <div
              className="absolute w-[800px] h-[640px] rounded-3xl border border-white/10 isometric-grid-plane bg-neutral-950/90 shadow-2xl transition-all duration-700"
              style={{
                transform: `translateZ(${viewMode === 'exploded' ? -120 : 0}px)`,
              }}
            >
              {/* Dot grid coordinates */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-neutral-600 flex items-center gap-3">
                <span>CANVAS GRID // 4096 x 4096</span>
                <span>ORIGIN [0, 0, 0]</span>
              </div>

              {/* Rulers / Guidelines */}
              <div className="absolute inset-x-8 top-1/2 border-t border-dashed border-cyan-500/20" />
              <div className="absolute inset-y-8 left-1/2 border-l border-dashed border-purple-500/20" />

              {/* Status pill in ground plane */}
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-neutral-500">
                Layer 0: Infinite Spatial Plane
              </div>
            </div>

            {/* ── LAYER 1: Creative Artboard Variations ── */}
            <div
              className="absolute w-[800px] h-[640px] pointer-events-auto preserve-3d transition-all duration-700"
              style={{
                transform: `translateZ(${viewMode === 'exploded' ? 0 : 35}px)`,
              }}
            >
              {/* Card A: TikTok / Reels 9:16 Vertical Video Ad */}
              <div
                onClick={() => setActivePin(1)}
                className={`absolute top-[60px] left-[180px] w-[180px] h-[320px] rounded-2xl glass-dark-card border p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 animate-float-slow ${
                  activePin === 1
                    ? 'border-cyan-400 shadow-isometric-glow-cyan scale-105'
                    : 'border-white/15 hover:border-white/30'
                }`}
                style={{
                  transform: 'translateZ(40px)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 border border-neutral-700 text-[9px] font-mono text-cyan-400">
                      TIKTOK 9:16
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono text-amber-300">
                      In Review
                    </span>
                  </div>

                  {/* Video Mockup Display */}
                  <div className="relative w-full h-[190px] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900 via-neutral-900 to-black border border-white/10 flex flex-col items-center justify-center p-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                    <span className="text-[11px] font-bold text-white tracking-tight">Summer Drop V1</span>
                    <span className="text-[9px] text-neutral-400 mt-1">00:15 • 4K 60fps</span>

                    {/* Soundwave bars inside card */}
                    <div className="flex items-center gap-1 mt-3">
                      <span className="w-1 h-3 rounded bg-cyan-400 animate-eq-1" />
                      <span className="w-1 h-5 rounded bg-cyan-400 animate-eq-2" />
                      <span className="w-1 h-2 rounded bg-cyan-400 animate-eq-3" />
                      <span className="w-1 h-4 rounded bg-cyan-400 animate-eq-4" />
                    </div>

                    {/* Pin 1 Marker on the Ad */}
                    <div className="absolute top-4 left-4 flex items-center justify-center">
                      <span className="absolute w-6 h-6 rounded-full bg-cyan-400/40 animate-beacon-ping" />
                      <div className="w-5 h-5 rounded-full bg-cyan-500 border border-white text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md">
                        1
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Pin #1: Contrast</span>
                  <span className="text-cyan-400 font-semibold">2 notes</span>
                </div>
              </div>

              {/* Card B: Instagram 1:1 Square Carousel Ad */}
              <div
                onClick={() => setActivePin(2)}
                className={`absolute top-[180px] left-[390px] w-[210px] h-[220px] rounded-2xl glass-dark-card border p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 animate-float-reverse ${
                  activePin === 2
                    ? 'border-purple-400 shadow-isometric-glow-purple scale-105'
                    : 'border-white/15 hover:border-white/30'
                }`}
                style={{
                  transform: 'translateZ(55px)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 border border-neutral-700 text-[9px] font-mono text-purple-400">
                      INSTAGRAM 1:1
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Approved
                    </span>
                  </div>

                  <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-gradient-to-tr from-purple-900/60 via-pink-900/40 to-neutral-900 border border-white/10 p-2.5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-white/80">Urban Collection</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] text-white">40% OFF</span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-serif text-white leading-tight">Effortless Streetwear.</p>
                      <p className="text-[9px] text-purple-300 font-mono">Swipe for catalog &gt;&gt;</p>
                    </div>

                    {/* Pin 2 Marker on Ad */}
                    <div className="absolute bottom-3 right-3 flex items-center justify-center">
                      <span className="absolute w-6 h-6 rounded-full bg-purple-400/40 animate-beacon-ping" />
                      <div className="w-5 h-5 rounded-full bg-purple-500 border border-white text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md">
                        2
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Sign-off: Marcus V.</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              {/* Card C: YouTube 16:9 Banner Display */}
              <div
                onClick={() => setActivePin(3)}
                className={`absolute top-[370px] left-[150px] w-[290px] h-[160px] rounded-2xl glass-dark-card border p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 animate-float-medium ${
                  activePin === 3
                    ? 'border-indigo-400 shadow-isometric-glow-purple scale-105'
                    : 'border-white/15 hover:border-white/30'
                }`}
                style={{
                  transform: 'translateZ(25px)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 border border-neutral-700 text-[9px] font-mono text-indigo-400">
                      YOUTUBE 16:9 BUMPER
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-[9px] font-mono text-blue-300">
                      In Discussion
                    </span>
                  </div>

                  <div className="relative w-full h-[80px] rounded-xl overflow-hidden bg-gradient-to-r from-neutral-900 via-indigo-950 to-blue-900 border border-white/10 p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-white block">Autumn Global Campaign</span>
                      <span className="text-[9px] text-neutral-400 font-mono">Pre-roll 6s Non-skip</span>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-white text-black font-semibold text-[10px]">
                      Shop Now
                    </div>

                    {/* Pin 3 Marker */}
                    <div className="absolute top-2 right-12 flex items-center justify-center">
                      <span className="absolute w-6 h-6 rounded-full bg-indigo-400/40 animate-beacon-ping" />
                      <div className="w-5 h-5 rounded-full bg-indigo-500 border border-white text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md">
                        3
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Pin #3: CTA Size</span>
                  <span className="text-indigo-400 font-semibold">1 note</span>
                </div>
              </div>
            </div>

            {/* ── LAYER 2: Live CometChat Review Hub & Neon Data Conduits ── */}
            <div
              className="absolute w-[800px] h-[640px] pointer-events-auto preserve-3d transition-all duration-700"
              style={{
                transform: `translateZ(${viewMode === 'exploded' ? 140 : 80}px)`,
              }}
            >
              {/* SVG Glowing Laser Beams Connecting Pins to CometChat Thread */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 800 640"
                fill="none"
              >
                <defs>
                  <linearGradient id="beamGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="beamGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Laser line from TikTok Pin 1 (around 270, 160) to CometChat (around 620, 200) */}
                <path
                  d="M 270 160 C 380 140, 500 170, 620 200"
                  stroke="url(#beamGradient1)"
                  strokeWidth="2.5"
                  className={activePin === 1 ? 'animate-laser-fast' : 'animate-laser-flow opacity-60'}
                />

                {/* Laser line from Instagram Pin 2 (around 520, 310) to CometChat (around 620, 260) */}
                <path
                  d="M 520 310 C 560 300, 580 280, 620 260"
                  stroke="url(#beamGradient2)"
                  strokeWidth="2.5"
                  className={activePin === 2 ? 'animate-laser-fast' : 'animate-laser-flow opacity-60'}
                />

                {/* Laser line from YouTube Pin 3 (around 380, 430) to CometChat (around 620, 330) */}
                <path
                  d="M 380 430 C 480 430, 540 370, 620 330"
                  stroke="#818cf8"
                  strokeWidth="2"
                  className={activePin === 3 ? 'animate-laser-fast' : 'animate-laser-flow opacity-40'}
                />
              </svg>

              {/* Floating CometChat Review Panel Card */}
              <div
                className="absolute top-[80px] right-[10px] w-[310px] rounded-2xl glass-dark-card border border-white/20 p-4 shadow-isometric-soft backdrop-blur-2xl transition-all duration-300 animate-float-medium text-left"
                style={{
                  transform: 'translateZ(90px)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-tight">CometChat Review Hub</h4>
                      <p className="text-[10px] font-mono text-cyan-400">thread / #summer-drop-v1</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Live Messages Stream */}
                <div className="space-y-2.5 mb-3 text-xs">
                  {/* Message 1 */}
                  <div
                    onClick={() => setActivePin(1)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activePin === 1
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-semibold text-cyan-300">Sarah J. (Art Director)</span>
                      <span className="text-neutral-500">2m ago</span>
                    </div>
                    <p className="text-[11px] text-neutral-200 leading-snug">
                      Pin #1: Let’s boost contrast on the headline by +15% so it pops on dark mode.
                    </p>
                  </div>

                  {/* Message 2 */}
                  <div
                    onClick={() => setActivePin(2)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activePin === 2
                        ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-semibold text-purple-300">Marcus V. (Client Lead)</span>
                      <span className="text-neutral-500">Just now</span>
                    </div>
                    <p className="text-[11px] text-neutral-200 leading-snug">
                      Pin #2: Color grade & typography approved! Ready for production export.
                    </p>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono text-neutral-400">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>Chloe is reviewing Pin #3...</span>
                  </div>
                </div>

                {/* Voice Huddle Strip at bottom of chat */}
                {isHuddleActive && (
                  <div className="p-2 rounded-xl bg-neutral-900/90 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-white">Voice Huddle Active</p>
                        <p className="text-[9px] font-mono text-emerald-400">Speaking: Sarah J.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-emerald-400 rounded-full animate-eq-1" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-eq-2" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-eq-3" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-eq-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Live Collaborator Cursors Gliding on the Isometric Plane ── */}
              {/* Cursor 1: Sarah (Art Director) */}
              <div
                className="absolute top-[170px] left-[320px] pointer-events-none transition-all duration-1000 animate-float-slow"
                style={{ transform: 'translateZ(110px)' }}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-cyan-400 filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2l16 11-7 2-3 7L4 2z" />
                  </svg>
                  <div className="px-2 py-0.5 rounded-full bg-cyan-500 text-black font-semibold text-[10px] shadow-lg whitespace-nowrap">
                    Sarah (Art Dir)
                  </div>
                </div>
              </div>

              {/* Cursor 2: Alex (Client) */}
              <div
                className="absolute top-[340px] left-[450px] pointer-events-none transition-all duration-1000 animate-float-reverse"
                style={{ transform: 'translateZ(95px)' }}
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-purple-400 filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2l16 11-7 2-3 7L4 2z" />
                  </svg>
                  <div className="px-2 py-0.5 rounded-full bg-purple-500 text-white font-semibold text-[10px] shadow-lg whitespace-nowrap">
                    Alex (Client)
                  </div>
                </div>
              </div>

              {/* Floating Isometric Tool Dock */}
              <div
                className="absolute bottom-[20px] left-[260px] px-3 py-1.5 rounded-2xl glass-dark-pill border border-white/20 shadow-xl flex items-center gap-3 text-neutral-300"
                style={{ transform: 'translateZ(120px)' }}
              >
                <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Select Tool">
                  <span className="font-mono text-xs">↖ Move</span>
                </button>
                <button className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1" title="Drop Pin">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-mono text-xs">Pin (P)</span>
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 transition-colors" title="CometChat">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 transition-colors" title="A/B Compare">
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Exploded Layer Legend (shown only in exploded mode) */}
        {viewMode === 'exploded' && (
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between p-3 rounded-xl bg-neutral-900/90 border border-purple-500/30 text-white text-xs font-mono backdrop-blur-md">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Level 3: CometChat Mesh (+140px Z)
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Level 2: Creative Ad Canvas (+40px Z)
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                Level 1: Dot-Grid Engine (0px Z)
              </span>
            </div>
            <span className="text-neutral-400 text-[11px]">Lossless 3D Spatially Indexed</span>
          </div>
        )}
      </div>

      {/* Hero Footnote / Interactive Helper */}
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 font-mono px-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span>Interactive 3D Stage: Click on Pins #1, #2 or #3 to test live laser thread routing</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>Mouse Parallax 3D Active</span>
          <span>•</span>
          <Link href="/app" className="text-neutral-300 hover:text-white underline underline-offset-4 font-sans font-medium flex items-center gap-1">
            <span>Open in Full Studio Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
