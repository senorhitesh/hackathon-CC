'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from './icons/Hugeicons';
import type { PinAnnotation } from '@repo/types';

interface PinPopoverProps {
  x: number;
  y: number;
  pinIndex: number;
  authorName: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export function PinPopover({
  x,
  y,
  pinIndex,
  authorName,
  onSubmit,
  onCancel,
}: PinPopoverProps) {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Clamp popover position so it doesn't overflow the viewport
  // The popover is positioned relative to the artboard
  const POPOVER_W = 280;
  const POPOVER_H = 160;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handleSubmit() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <>
      {/* Backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-[100]" onClick={onCancel} />

      <div
        ref={popoverRef}
        className="absolute z-[110] animate-fade-in"
        style={{
          left: x + 16,
          top: y - 16,
          width: POPOVER_W,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-canvas-surface border border-canvas-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-canvas-border">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {pinIndex}
            </div>
            <span className="text-xs text-canvas-muted flex-1">
              <span className="text-canvas-fg font-medium">{authorName}</span> — leave a comment
            </span>
            <button
              onClick={onCancel}
              className="text-canvas-muted hover:text-canvas-fg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comment Input */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the issue or suggestion…"
              rows={3}
              className="w-full bg-canvas-bg border border-canvas-border rounded-lg px-3 py-2 text-sm text-canvas-fg placeholder-canvas-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-canvas-muted">⌘↵ to send</span>
              <button
                onClick={handleSubmit}
                disabled={!comment.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
              >
                <Send className="w-3 h-3" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Connector triangle */}
        <div
          className="absolute -left-1.5 top-4 w-3 h-3 bg-canvas-surface border-l border-b border-canvas-border rotate-45"
        />
      </div>
    </>
  );
}
