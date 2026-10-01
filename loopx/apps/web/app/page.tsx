'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Share2,
  Layers,
  MessageSquare,
  Bot,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/loogx-logo&favicon.png"
            alt="loopx logo"
            className="w-8 h-8 object-contain rounded-lg border border-slate-200 shadow-2xs"
          />
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            loopx
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all group"
          >
            <span>Launch Studio Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-6 animate-fade-in shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Real-Time Creative Iteration & n8n Node Workflow</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-3xl mx-auto">
          Collaborate on Creative Ads with{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            n8n-Style Nodes
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Connect your creative post variations directly to CometChat & AI Agent nodes on an infinite dot-grid canvas. Fast, visual, and client-ready.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/app"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group transition-all"
          >
            <span>Open Studio Canvas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/app?action=login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-all shadow-2xs flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Admin Supabase Sign In</span>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-14 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl overflow-hidden dot-canvas relative group">
          <div className="rounded-2xl border border-slate-200 bg-white/95 overflow-hidden p-6 flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Post Node #1 (IG Square) connected via SVG Bezier Cable to CometChat Iteration Node</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl text-left">
              {/* Post Node Card Preview */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Post Node #1
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    In Review
                  </span>
                </div>
                <div className="w-full h-44 rounded-xl bg-slate-100 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
                    alt="Hero Ad"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Summer Promo Hero Ad</h4>
              </div>

              {/* Chat Node Card Preview */}
              <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    CometChat Node
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Live Connected
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                    <strong className="text-slate-900 block text-[10px]">Studio Owner:</strong>
                    "Uploaded latest variation. Let's iterate!"
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900">
                    <strong className="text-purple-950 block text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      CometChat AI Agent:
                    </strong>
                    "Headline Suggestion: 'Unleash Your Summer Style — 20% Off!'"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights Grid ── */}
      <section className="px-6 py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Engineered for Studio Leads & Client Reviewers
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Everything you need to review, annotate, and approve creative ad campaigns
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">n8n Node Workflows</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect post nodes directly to CometChat iteration nodes via animated SVG bezier wires on an infinite canvas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">CometChat & AI Agent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time messaging powered by CometChat SDK with instant AI copy generation for fast ad creative turnaround.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Supabase Admin Auth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Secure Supabase authentication for Studio Admins, while clients join instantly via 1-click shareable URLs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 loopx Studio — Built for Hackathon-CC</p>
      </footer>
    </div>
  );
}
