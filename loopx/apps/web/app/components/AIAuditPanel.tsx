'use client';

import React, { useState } from 'react';
import type { BoardPost } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { useCometChatContext } from '../app/page';

interface AIAuditPanelProps {
  post: BoardPost;
  onClose: () => void;
}

interface AuditResult {
  hookScore: number;
  hookFeedback: string;
  complianceFlags: string[];
  compliancePassed: boolean;
  ctaScore: number;
  ctaFeedback: string;
  altHeadlines: string[];
  overallScore: number;
  summary: string;
}

// Deterministic "AI" audit engine — no API key required, works offline
function generateAudit(post: BoardPost): AuditResult {
  const text = [post.title, post.description, post.content].filter(Boolean).join(' ');
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  // Hook quality heuristics
  const hasQuestion = /\?/.test(text);
  const hasNumber = /\d/.test(text);
  const hasPower = /\b(free|exclusive|limited|new|now|instantly|proven|boost|transform|unlock|discover)\b/i.test(text);
  const hasCTA = /\b(shop|buy|get|try|start|learn|discover|apply|join|book|order|claim)\b/i.test(text);
  const hookScore = Math.min(100, 40 + (hasQuestion ? 15 : 0) + (hasNumber ? 15 : 0) + (hasPower ? 20 : 0) + (hasCTA ? 10 : 0));
  const ctaScore = hasCTA ? Math.min(100, 55 + (hasNumber ? 20 : 0) + (hasPower ? 25 : 0)) : 30;

  // Compliance checks
  const complianceFlags: string[] = [];
  let compliancePassed = true;

  // Platform-specific
  if (post.preset === 'IG_SQUARE' || post.preset === 'REELS_STORY') {
    if (charCount > 2200) { complianceFlags.push('Caption exceeds Instagram 2,200 character limit'); compliancePassed = false; }
    if (post.description && post.description.length > 125) complianceFlags.push('First 125 chars matter most — lead with the hook');
    if (!hasCTA) complianceFlags.push('Missing a clear Call-to-Action (CTA) in copy');
  }
  if (post.preset === 'X_BANNER') {
    if (charCount > 280) { complianceFlags.push('Post text exceeds X/Twitter 280 character limit'); compliancePassed = false; }
  }
  if (post.preset === 'LINKEDIN_POST') {
    if (charCount > 3000) { complianceFlags.push('LinkedIn post exceeds 3,000 character limit'); compliancePassed = false; }
    if (!post.description?.includes('\n')) complianceFlags.push('Consider adding line breaks for LinkedIn scannability');
  }

  // Generic checks
  if (!hasPower && wordCount > 5) complianceFlags.push('No power words detected — consider adding urgency/value terms');
  if (wordCount < 5) complianceFlags.push('Copy is very short — add more context for better engagement');
  if (!post.mediaUrl) complianceFlags.push('No media attached — posts with images/video get 3x more engagement');

  // Generate alt headlines
  const baseTitle = post.title || 'Your Creative';
  const altHeadlines = [
    `🔥 ${wordCount > 3 ? baseTitle.split(' ').slice(0, 3).join(' ') + ' That Actually Works' : 'This Changes Everything'}`,
    `${hasNumber ? baseTitle : `${5 + Math.floor(hookScore / 20)} Reasons`} ${baseTitle.includes('?') ? '' : 'You Need To See This'}`.trim(),
    `Stop scrolling. ${baseTitle.length > 20 ? baseTitle.substring(0, 20) + '…' : baseTitle} is live now.`,
  ];

  const overallScore = Math.round((hookScore * 0.4 + ctaScore * 0.3 + (compliancePassed ? 80 : 50) * 0.3));

  const summary =
    overallScore >= 80
      ? 'Strong creative — ready to ship with minor tweaks.'
      : overallScore >= 60
      ? 'Decent creative — apply the suggestions below to improve performance.'
      : 'Needs work — address the compliance flags and boost the hook.';

  return {
    hookScore,
    hookFeedback:
      hookScore >= 75
        ? 'Great hook! Strong opening that grabs attention.'
        : hookScore >= 50
        ? 'Decent hook. Add a question, number, or power word to punch it up.'
        : 'Weak hook. Rewrite the opening line to create immediate intrigue.',
    complianceFlags,
    compliancePassed,
    ctaScore,
    ctaFeedback:
      ctaScore >= 75
        ? 'Clear, compelling CTA detected. Good job!'
        : ctaScore >= 50
        ? 'CTA present but could be more urgent or specific.'
        : 'No clear CTA found. Tell users exactly what to do next.',
    altHeadlines,
    overallScore,
    summary,
  };
}

function ScoreRing({ score, label, size = 56 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function AIAuditPanel({ post, onClose }: AIAuditPanelProps) {
  const { sendMessage } = useCometChatContext();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [sentHeadline, setSentHeadline] = useState<string | null>(null);

  function runAudit() {
    setIsAuditing(true);
    setAuditResult(null);
    // Simulate async AI analysis
    setTimeout(() => {
      setAuditResult(generateAudit(post));
      setIsAuditing(false);
    }, 1400);
  }

  async function sendHeadlineToChat(headline: string) {
    setSentHeadline(headline);
    try {
      await sendMessage(
        `🤖 AI Creative Copilot — Alternative headline for "${post.title}":\n\n"${headline}"\n\n↑ Generated based on ad audit analysis.`,
        post.id
      );
    } catch (_) {}
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 bg-white border-t border-neutral-200 rounded-t-2xl shadow-2xl animate-fade-in overflow-hidden max-h-[420px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs shadow-sm">
            🤖
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">AI Creative Copilot</h4>
            <p className="text-[9px] text-neutral-500 font-mono">Ad Compliance & Copy Audit</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!auditResult && !isAuditing && (
          <div className="flex flex-col items-center justify-center p-6 gap-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-900">"{post.title}"</p>
              <p className="text-[11px] text-neutral-500 mt-1">Audit this creative for hook quality, compliance, and copy strength.</p>
            </div>
            <button
              onClick={runAudit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:shadow-violet-200 hover:scale-105 active:scale-95 transition-all"
            >
              🔍 Run AI Audit
            </button>
          </div>
        )}

        {isAuditing && (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-violet-200" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-neutral-700">Analyzing creative…</p>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Hook · Compliance · CTA · Platform fit</p>
            </div>
          </div>
        )}

        {auditResult && (
          <div className="p-4 space-y-4">
            {/* Score summary row */}
            <div className="flex items-center justify-around p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <ScoreRing score={auditResult.overallScore} label="Overall" size={60} />
              <div className="w-px h-10 bg-neutral-200" />
              <ScoreRing score={auditResult.hookScore} label="Hook" size={48} />
              <ScoreRing score={auditResult.ctaScore} label="CTA" size={48} />
              <ScoreRing score={auditResult.compliancePassed ? 95 : 45} label="Comply" size={48} />
            </div>

            {/* Summary */}
            <div className={`px-3 py-2.5 rounded-xl border text-xs font-medium ${
              auditResult.overallScore >= 80
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : auditResult.overallScore >= 60
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {auditResult.summary}
            </div>

            {/* Compliance flags */}
            {auditResult.complianceFlags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">⚠️ Flags</p>
                {auditResult.complianceFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-neutral-700 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hook + CTA feedback */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-2.5">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Hook</p>
                <p className="text-[11px] text-neutral-700 leading-relaxed">{auditResult.hookFeedback}</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-2.5">
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">CTA</p>
                <p className="text-[11px] text-neutral-700 leading-relaxed">{auditResult.ctaFeedback}</p>
              </div>
            </div>

            {/* Alt headlines */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">🤖 Alt Headlines — Send to Thread</p>
              {auditResult.altHeadlines.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-violet-50 border border-violet-200/80 rounded-xl px-3 py-2">
                  <span className="flex-1 text-neutral-800 leading-snug">{h}</span>
                  <button
                    onClick={() => sendHeadlineToChat(h)}
                    className={`shrink-0 text-[10px] px-2 py-1 rounded-lg font-semibold transition-all ${
                      sentHeadline === h
                        ? 'bg-emerald-500 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95'
                    }`}
                  >
                    {sentHeadline === h ? '✓ Sent' : '→ Chat'}
                  </button>
                </div>
              ))}
            </div>

            {/* Rerun */}
            <button
              onClick={runAudit}
              className="w-full py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-xs font-medium transition-colors"
            >
              ↺ Re-run Audit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
