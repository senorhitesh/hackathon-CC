'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  Pin,
  MessageSquare,
  Mic,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from '../icons/Hugeicons';

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: '1. Ingest Multi-Format Creatives',
      tag: '01 / INGEST',
      desc: 'Drag & drop image and video ad files or paste URLs. loopx automatically arranges them on the dot-grid with correct aspect ratio presets (1:1, 9:16, 16:9, banners).',
      icon: Upload,
      previewTitle: 'Auto-Detect Dimensions',
      previewDetails: '3 variants imported: IG Square (1080x1080), TikTok Story (1080x1920), YouTube (1920x1080)',
      previewBadge: 'Ready for Review',
    },
    {
      id: 2,
      title: '2. Drop Sub-Pixel Contextual Pins',
      tag: '02 / PINPOINT',
      desc: 'Click on any headline, logo, model, or visual artifact. Pins anchor to absolute card coordinates and launch dedicated CometChat review rooms.',
      icon: Pin,
      previewTitle: 'Pixel-Locked Coordinates',
      previewDetails: 'Pin #1 at [X: 340, Y: 120] • Tagged @motion-team for contrast bump',
      previewBadge: 'Thread Created',
    },
    {
      id: 3,
      title: '3. Align Live in Voice Huddle',
      tag: '03 / HUDDLE',
      desc: 'No scheduling friction. Click "Start Huddle" to open an in-canvas audio room. Cursors broadcast live presence so everyone looks at the same pixel.',
      icon: Mic,
      previewTitle: 'Zero-Latency Voice Stream',
      previewDetails: 'Elena & Marcus discussing Pin #1 live • Soundwave frequency synchronized',
      previewBadge: 'Audio Connected',
    },
    {
      id: 4,
      title: '4. Instant Client Sign-Off',
      tag: '04 / APPROVE',
      desc: 'Send a client-friendly proofing link. Reviewers click "Approve" with a single tap. An immutable audit trail and export summary is logged instantly.',
      icon: CheckCircle2,
      previewTitle: 'Proof Locked & Timestamped',
      previewDetails: 'All 3 creative variations marked Approved • Ready for Meta & TikTok Ads Manager',
      previewBadge: 'Campaign Approved',
    },
  ];

  const currentStep = steps.find((s) => s.id === activeStep) ?? steps[0]!;

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto border-t border-neutral-800/80">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Streamlined Workflow</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-tight">
          From First Cut to Final Sign-Off in Minutes.
        </h2>
        <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
          Designed specifically to cut creative review turnaround from 3 days to under 30 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Step Selector List */}
        <div className="lg:col-span-6 space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-neutral-900 border-cyan-500/50 shadow-[0_4px_24px_-4px_rgba(6,182,212,0.15)]'
                    : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-mono uppercase tracking-wider ${
                      isActive ? 'text-cyan-400 font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    {step.tag}
                  </span>
                </div>

                <h4 className="text-base font-semibold text-white mb-1.5">{step.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Dynamic Visual Stage for Current Step */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 p-8 shadow-2xl relative overflow-hidden text-left min-h-[360px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                <span className="text-xs font-mono text-cyan-400">{currentStep.tag} SIMULATION</span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                  {currentStep.previewBadge}
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {currentStep.previewTitle}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800 font-mono text-xs">
                  {currentStep.previewDetails}
                </p>
              </div>
            </div>

            {/* Interactive Step Visualizer */}
            <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((stepNum) => (
                  <button
                    key={stepNum}
                    onClick={() => setActiveStep(stepNum)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeStep === stepNum ? 'w-8 bg-cyan-400' : 'w-2 bg-neutral-700'
                    }`}
                  />
                ))}
              </div>

              <Link
                href="/app"
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Launch Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
