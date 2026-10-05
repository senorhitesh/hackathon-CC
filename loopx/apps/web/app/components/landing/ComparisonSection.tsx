'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Zap,
} from '../icons/Hugeicons';

export function ComparisonSection() {
  const comparisonRows = [
    {
      feature: 'Visual Context & Pinning',
      oldWay: 'Descriptive emails like "change the headline below the third shoe"',
      loopxWay: 'Sub-pixel coordinate pins anchored directly to the creative card',
    },
    {
      feature: 'Ad Format Support',
      oldWay: 'Reviewing files separately in Google Drive folders or Slack DMs',
      loopxWay: 'Infinite dot canvas with 9:16, 1:1, 16:9, and display banners side-by-side',
    },
    {
      feature: 'Live Collaboration',
      oldWay: 'Booking a separate 30-min Zoom meeting just to review 2 images',
      loopxWay: '1-click CometChat canvas Voice Huddle with real-time multiplayer cursors',
    },
    {
      feature: 'A/B Variation Testing',
      oldWay: 'Flipping back and forth between two browser tabs or tabs in Figma',
      loopxWay: 'Interactive split-view slider comparing variants in real time',
    },
    {
      feature: 'Client Approvals',
      oldWay: 'Scattered "Looks good!" in WhatsApp, Slack, email, or texts',
      loopxWay: '1-click signed proof link with immutable CometChat audit log',
    },
  ];

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto border-t border-neutral-800/80">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>The New Standard</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
          Stop juggling 4 tools for one ad campaign.
        </h2>
        <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
          Replace the fractured workflow of Slack, Google Drive, Loom, and email with a unified real-time creative review engine.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-neutral-800 bg-neutral-950/80 text-xs font-mono py-4 px-6">
          <div className="md:col-span-4 text-neutral-400 uppercase tracking-wider">Review Dimension</div>
          <div className="md:col-span-4 text-neutral-400 uppercase tracking-wider hidden md:block">
            The Fragmented Stack (Slack + Drive + Loom)
          </div>
          <div className="md:col-span-4 text-cyan-400 uppercase tracking-wider font-semibold">
            loopx Studio Engine
          </div>
        </div>

        <div className="divide-y divide-neutral-800">
          {comparisonRows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 py-5 px-6 items-center gap-4 hover:bg-neutral-800/30 transition-colors text-left"
            >
              <div className="md:col-span-4 font-semibold text-white text-sm">
                {row.feature}
              </div>

              <div className="md:col-span-4 text-xs text-neutral-400 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span>{row.oldWay}</span>
              </div>

              <div className="md:col-span-4 text-xs text-neutral-200 flex items-start gap-2 bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="font-medium text-white">{row.loopxWay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
