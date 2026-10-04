'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

interface PinAnnotationOverlayProps {
  postId: string;
  cardWidth: number;
  cardHeight: number;
  pinModeActive: boolean;
  onExitPinMode: () => void;
}

interface PendingPin {
  normalizedX: number;
  normalizedY: number;
  pixelX: number;
  pixelY: number;
}

export function PinAnnotationOverlay({
  postId,
  cardWidth,
  cardHeight,
  pinModeActive,
  onExitPinMode,
}: PinAnnotationOverlayProps) {
  const { state, addAnnotation, resolveAnnotation, reopenAnnotation } = useAppContext();
  const { annotations, currentUser } = state;

  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pendingComment, setPendingComment] = useState('');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter annotations for this post by postId stored as comment prefix hack
  // We use a custom field by abusing the "preset" field to store postId via authorId prefix
  const postAnnotations = annotations.filter((a) => a.authorId.startsWith(`${postId}::`) || (a as any).postId === postId);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pinModeActive) return;
      e.stopPropagation();
      e.preventDefault();
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pixelX = e.clientX - rect.left;
      const pixelY = e.clientY - rect.top;
      setPendingPin({
        normalizedX: pixelX / rect.width,
        normalizedY: pixelY / rect.height,
        pixelX,
        pixelY,
      });
      setPendingComment('');
    },
    [pinModeActive]
  );

  function handleSubmitPin() {
    if (!pendingPin || !pendingComment.trim()) return;
    // Encode postId into authorId as "postId::actualAuthorId" for filtering
    addAnnotation({
      preset: 'IG_SQUARE',
      normalizedX: pendingPin.normalizedX,
      normalizedY: pendingPin.normalizedY,
      authorId: `${postId}::${currentUser.uid}`,
      authorName: currentUser.name,
      comment: pendingComment.trim(),
    });
    setPendingPin(null);
    setPendingComment('');
    onExitPinMode();
  }

  const openCount = postAnnotations.filter((a) => a.status === 'OPEN').length;
  const resolvedCount = postAnnotations.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 z-20 ${pinModeActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onClick={handleOverlayClick}
    >
      {/* Existing pins */}
      {postAnnotations.map((ann, idx) => {
        const px = ann.normalizedX * cardWidth;
        const py = ann.normalizedY * cardHeight;
        const isSelected = selectedPinId === ann.id;
        const isResolved = ann.status === 'RESOLVED';
        const pinColor = isResolved ? '#22c55e' : isSelected ? '#f59e0b' : '#6366f1';

        return (
          <div
            key={ann.id}
            className="absolute pointer-events-auto"
            style={{ left: px, top: py, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 60 : 50 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPinId(isSelected ? null : ann.id);
            }}
          >
            {!isResolved && !isSelected && (
              <div
                className="absolute rounded-full animate-ping opacity-30"
                style={{ inset: '-6px', background: pinColor }}
              />
            )}
            <div
              className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer shadow-lg transition-transform hover:scale-110"
              style={{ background: pinColor, boxShadow: `0 2px 8px ${pinColor}80` }}
            >
              {isResolved ? '✓' : idx + 1}
            </div>

            {isSelected && (
              <div
                className="absolute left-7 top-0 z-30 w-56 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden text-neutral-900">
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 border-b border-neutral-100">
                    <span className="text-[10px] font-semibold text-neutral-500">
                      #{idx + 1} · {ann.authorName}
                    </span>
                    <span
                      className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {ann.status}
                    </span>
                  </div>
                  <p className="px-3 py-2 text-xs text-neutral-800 leading-relaxed">{ann.comment}</p>
                  {ann.resolvedBy && (
                    <p className="px-3 pb-1 text-[10px] text-neutral-400">✓ Resolved by {ann.resolvedBy}</p>
                  )}
                  <div className="px-3 pb-2.5 flex gap-1.5">
                    {isResolved ? (
                      <button
                        onClick={() => { reopenAnnotation(ann.id); setSelectedPinId(null); }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium transition-colors"
                      >
                        ↩ Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => { resolveAnnotation(ann.id); setSelectedPinId(null); }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium transition-colors"
                      >
                        ✓ Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPinId(null)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200 font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pending pin */}
      {pendingPin && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{ left: pendingPin.pixelX, top: pendingPin.pixelY, transform: 'translate(-50%, -50%)', zIndex: 70 }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-bounce">
              {postAnnotations.length + 1}
            </div>
          </div>

          <div
            className="absolute z-[80] animate-fade-in"
            style={{
              left: Math.min(pendingPin.pixelX + 16, cardWidth - 220),
              top: Math.max(pendingPin.pixelY - 16, 4),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-52 bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-3 pt-2.5 pb-1.5 border-b border-neutral-100 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {postAnnotations.length + 1}
                </div>
                <span className="text-[11px] text-neutral-600 font-medium truncate">{currentUser.name}</span>
              </div>
              <div className="p-2.5">
                <textarea
                  autoFocus
                  value={pendingComment}
                  onChange={(e) => setPendingComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitPin();
                    if (e.key === 'Escape') setPendingPin(null);
                  }}
                  placeholder="Describe the issue or suggestion…"
                  rows={3}
                  className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-neutral-400">⌘↵ to send</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPendingPin(null)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitPin}
                      disabled={!pendingComment.trim()}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      Pin it
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pin count badges (visible when not in pin mode) */}
      {!pinModeActive && postAnnotations.length > 0 && (
        <div className="absolute bottom-1.5 left-1.5 pointer-events-auto flex items-center gap-1">
          {openCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold shadow-md backdrop-blur-sm">
              {openCount} open
            </span>
          )}
          {resolvedCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/90 text-white font-bold shadow-md backdrop-blur-sm">
              {resolvedCount} ✓
            </span>
          )}
        </div>
      )}
    </div>
  );
}
