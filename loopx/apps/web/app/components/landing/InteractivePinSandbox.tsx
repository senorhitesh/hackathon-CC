'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pin,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
  Zap,
} from '../icons/Hugeicons';

interface DroppedPin {
  id: number;
  x: number;
  y: number;
  author: string;
  avatar: string;
  role: string;
  text: string;
  reply?: string;
  timestamp: string;
  status: 'Open' | 'Approved';
}

export function InteractivePinSandbox() {
  const [pins, setPins] = useState<DroppedPin[]>([
    {
      id: 1,
      x: 35,
      y: 28,
      author: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      role: 'Creative Lead',
      text: 'Headline font weight should be Semibold (600) rather than Bold (700) for cleaner editorial look.',
      reply: 'CometChat Sync: Updated in Figma tokens! Syncing variant.',
      timestamp: '3m ago',
      status: 'Open',
    },
    {
      id: 2,
      x: 72,
      y: 65,
      author: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      role: 'Client Reviewer',
      text: 'CTA button color contrast verified. Passes WCAG AAA! Approved for launch.',
      timestamp: '1m ago',
      status: 'Approved',
    },
  ]);

  const [activePinId, setActivePinId] = useState<number>(1);
  const [newCommentText, setNewCommentText] = useState('');
  const [pendingPinPos, setPendingPinPos] = useState<{ x: number; y: number } | null>(null);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drop pin if not clicking directly on an existing pin marker
    if ((e.target as HTMLElement).closest('.pin-element')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setPendingPinPos({ x, y });
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPinPos || !newCommentText.trim()) return;

    const newId = pins.length + 1;
    const newPin: DroppedPin = {
      id: newId,
      x: pendingPinPos.x,
      y: pendingPinPos.y,
      author: 'You (Visiting Creative)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Guest Collaborator',
      text: newCommentText.trim(),
      reply: 'CometChat Bot: Pin dispatched to #production-review room in 14ms.',
      timestamp: 'Just now',
      status: 'Open',
    };

    setPins([...pins, newPin]);
    setActivePinId(newId);
    setPendingPinPos(null);
    setNewCommentText('');
  };

  const activePin = pins.find((p) => p.id === activePinId) || pins[0];

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Sandbox</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
          Try Contextual Pinning in 5 Seconds.
        </h2>
        <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
          Click anywhere on the ad canvas below to drop a pin. Watch it connect seamlessly to a live CometChat discussion thread.
        </p>
      </div>

      {/* Interactive Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: The Clickable Creative Ad */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ad-card // 1:1 IG Square (Click to Drop Pin)</span>
            </div>
            <span className="text-[11px] text-cyan-400">Total Pins: {pins.length}</span>
          </div>

          {/* Ad Artboard Canvas */}
          <div
            onClick={handleCardClick}
            className="relative w-full aspect-square max-h-[460px] mx-auto rounded-2xl overflow-hidden cursor-crosshair border border-white/10 group select-none shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)',
            }}
          >
            {/* Visual Artboard Mockup */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                    LX
                  </div>
                  <span className="font-mono text-xs text-white/70 uppercase tracking-widest">
                    Spring Launch
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-mono text-[10px] backdrop-blur-md">
                  Variant #B
                </span>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                  Zero Distortion Design
                </span>
                <h3 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
                  Engineered for bold creative vision.
                </h3>
                <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
                  Seamlessly review, pinpoint, and approve multi-format brand campaigns with instant team alignment.
                </p>
                <div className="pt-2">
                  <div className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-neutral-950 font-bold text-xs shadow-lg">
                    Discover Collection →
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>© 2026 Studio Loopx</span>
                <span>4K Hi-Res Proof</span>
              </div>
            </div>

            {/* Render Existing Pins */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePinId(pin.id);
                  setPendingPinPos(null);
                }}
                className="pin-element absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`absolute w-8 h-8 rounded-full ${
                      pin.status === 'Approved' ? 'bg-emerald-400/40' : 'bg-cyan-400/40'
                    } animate-beacon-ping`}
                  />
                  <div
                    className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center font-mono text-xs font-bold text-white shadow-xl transition-transform ${
                      activePinId === pin.id ? 'scale-125' : 'hover:scale-110'
                    } ${pin.status === 'Approved' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-cyan-500 shadow-cyan-500/50'}`}
                  >
                    {pin.id}
                  </div>
                </div>
              </div>
            ))}

            {/* Pending Pin Modal overlay if user clicked to drop a pin */}
            {pendingPinPos && (
              <div
                className="pin-element absolute z-30 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pendingPinPos.x}%`, top: `${pendingPinPos.y}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white text-white font-mono text-xs font-bold flex items-center justify-center shadow-2xl animate-bounce">
                  +
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-neutral-500 font-mono">
            {pendingPinPos
              ? `Drop Pin at [X: ${pendingPinPos.x}%, Y: ${pendingPinPos.y}%] — Type feedback on the right!`
              : 'Tip: Click anywhere on the visual ad above to drop a new review pin.'}
          </p>
        </div>

        {/* Right: CometChat Live Pin Detail Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* New Pin Composer if user clicked */}
          {pendingPinPos ? (
            <div className="bg-neutral-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl animate-fade-in text-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-xs font-mono">
                    +
                  </div>
                  <span className="text-xs font-semibold text-white">Add Review Note</span>
                </div>
                <button
                  onClick={() => setPendingPinPos(null)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  ✕ Cancel
                </button>
              </div>

              <form onSubmit={handleConfirmPin} className="space-y-3">
                <p className="text-xs text-neutral-400 font-mono">
                  Coordinates: [X: {pendingPinPos.x}%, Y: {pendingPinPos.y}%]
                </p>
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="e.g. Can we adjust the logo margin or change the CTA text?"
                  rows={3}
                  autoFocus
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 resize-none font-sans"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Syncs to CometChat
                  </span>
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Post Pin</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Selected Pin Details */
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-white shadow-md ${
                      activePin?.status === 'Approved' ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}
                  >
                    {activePin?.id}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Pin #{activePin?.id} Review Thread</h4>
                    <p className="text-[10px] font-mono text-neutral-400">
                      Coordinates: [X: {activePin?.x}%, Y: {activePin?.y}%]
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border flex items-center gap-1 ${
                    activePin?.status === 'Approved'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  {activePin?.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                  {activePin?.status}
                </span>
              </div>

              {/* Message Content */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={activePin?.avatar}
                    alt={activePin?.author}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-semibold text-white">{activePin?.author}</span>
                      <span className="text-neutral-500">{activePin?.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                      {activePin?.text}
                    </p>
                  </div>
                </div>

                {activePin?.reply && (
                  <div className="pl-6 border-l-2 border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                      <Zap className="w-3 h-3" />
                      <span>CometChat Instant Reaction</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-500/20">
                      {activePin.reply}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Action Footer */}
              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-500">
                  Select pins on image or click to add
                </span>
                <Link
                  href="/app"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Launch Infinite Canvas</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Value callout pill */}
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 text-xs text-neutral-400 space-y-1 text-left">
            <span className="font-semibold text-white block">Why Pixel-Locked Proofing Wins</span>
            <p className="text-[11px] text-neutral-400">
              No more guessing &quot;the third image on page 2&quot;. Every note is anchored with sub-pixel precision and linked directly to CometChat v4 audio &amp; text rooms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
