'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { useState } from 'react';
import type { PinAnnotation } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { PLATFORM_PRESETS } from '@repo/types';

type FilterMode = 'ALL' | 'OPEN' | 'RESOLVED';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function AnnotationCard({ annotation }: { annotation: PinAnnotation }) {
  const { state, dispatch, resolveAnnotation, reopenAnnotation } = useAppContext();
  const isSelected = state.selectedPinId === annotation.id;
  const isResolved = annotation.status === 'RESOLVED';

  async function handleResolve() {
    resolveAnnotation(annotation.id);
    try {
      const { resolveAnnotation: sdkResolve } = await import('@repo/cometchat-client');
      await sdkResolve(
        state.roomId,
        annotation.id,
        state.currentUser.name,
        { ...annotation, status: 'RESOLVED', resolvedBy: state.currentUser.name, resolvedAt: Date.now() },
      );
    } catch (_) {}
  }

  async function handleReopen() {
    reopenAnnotation(annotation.id);
    try {
      const { reopenAnnotation: sdkReopen } = await import('@repo/cometchat-client');
      await sdkReopen(state.roomId, annotation.id, { ...annotation, status: 'OPEN' });
    } catch (_) {}
  }

  function handleCardClick() {
    dispatch({ type: 'SET_SELECTED_PIN', id: isSelected ? null : annotation.id });
  }

  return (
    <div
      onClick={handleCardClick}
      className={`
        group relative rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden
        ${isSelected
          ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
          : 'border-canvas-border bg-canvas-surface hover:border-canvas-hover'
        }
      `}
    >
      {/* Resolved indicator strip */}
      {isResolved && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 rounded-l-xl" />
      )}

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          {/* Pin number badge */}
          <div
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
            style={{ background: isResolved ? '#22c55e' : '#6366f1' }}
          >
            {annotation.index}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium text-canvas-fg truncate">
                {annotation.authorName}
              </span>
              <span className="text-[10px] text-canvas-muted flex-shrink-0">
                {timeAgo(annotation.createdAt)}
              </span>
            </div>
            <div className="text-[10px] text-canvas-muted">
              {PLATFORM_PRESETS[annotation.preset].shortLabel}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`
              flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide
              ${isResolved ? 'bg-green-500/20 text-green-400' : 'bg-accent/20 text-accent'}
            `}
          >
            {annotation.status}
          </span>
        </div>

        {/* Comment */}
        <p className="text-xs text-canvas-fg leading-relaxed mb-2.5 pl-7">
          {annotation.comment}
        </p>

        {/* Resolved by */}
        {annotation.resolvedBy && (
          <p className="text-[10px] text-canvas-muted pl-7 mb-2">
            ✓ Resolved by {annotation.resolvedBy}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pl-7 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isResolved ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleResolve(); }}
              className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Resolve
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleReopen(); }}
              className="flex items-center gap-1 text-[10px] text-canvas-muted hover:text-canvas-fg font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewRail() {
  const { state } = useAppContext();
  const { annotations, activePreset } = state;

  const [filter, setFilter] = useState<FilterMode>('ALL');

  const presetAnnotations = annotations.filter((a) => a.preset === activePreset);
  const filtered = presetAnnotations.filter((a) => {
    if (filter === 'OPEN') return a.status === 'OPEN';
    if (filter === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  const openCount = presetAnnotations.filter((a) => a.status === 'OPEN').length;
  const resolvedCount = presetAnnotations.filter((a) => a.status === 'RESOLVED').length;

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-canvas-surface border-l border-canvas-border">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-canvas-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-canvas-muted" />
          <h2 className="text-sm font-semibold text-canvas-fg">Feedback</h2>
          {presetAnnotations.length > 0 && (
            <span className="ml-auto text-[10px] text-canvas-muted">
              {presetAnnotations.length} total
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-0.5 bg-canvas-bg rounded-lg">
          {([['ALL', 'All', presetAnnotations.length], ['OPEN', 'Open', openCount], ['RESOLVED', 'Done', resolvedCount]] as const).map(
            ([mode, label, count]) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`
                  flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all
                  ${filter === mode
                    ? 'bg-canvas-surface text-canvas-fg shadow-sm'
                    : 'text-canvas-muted hover:text-canvas-fg'
                  }
                `}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      filter === mode ? 'bg-accent/20 text-accent' : 'bg-canvas-hover text-canvas-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Annotation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-8 h-8 text-canvas-border mb-3" />
            <p className="text-sm text-canvas-muted">No feedback yet</p>
            <p className="text-xs text-canvas-muted/60 mt-1">
              Enable Pin mode and click the canvas to leave contextual feedback
            </p>
          </div>
        ) : (
          filtered
            .slice()
            .reverse()
            .map((annotation) => (
              <AnnotationCard key={annotation.id} annotation={annotation} />
            ))
        )}
      </div>
    </aside>
  );
}
