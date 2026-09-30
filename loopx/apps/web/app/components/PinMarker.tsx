'use client';

import React from 'react';
import type { PinAnnotation } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, Circle } from 'lucide-react';

interface PinMarkerProps {
  annotation: PinAnnotation;
  canvasWidth: number;
  canvasHeight: number;
}

export function PinMarker({ annotation, canvasWidth, canvasHeight }: PinMarkerProps) {
  const { state, dispatch } = useAppContext();
  const isSelected = state.selectedPinId === annotation.id;
  const isResolved = annotation.status === 'RESOLVED';

  const pixelX = annotation.normalizedX * canvasWidth;
  const pixelY = annotation.normalizedY * canvasHeight;

  const pinColor = isResolved ? '#22c55e' : isSelected ? '#f59e0b' : '#6366f1';

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({
      type: 'SET_SELECTED_PIN',
      id: isSelected ? null : annotation.id,
    });
  }

  return (
    <div
      className="pin-marker"
      style={{ left: pixelX, top: pixelY }}
      onClick={handleClick}
    >
      {/* Pulse ring — only for open, unselected pins */}
      {!isResolved && !isSelected && (
        <div
          className="pin-ring"
          style={{ background: `${pinColor}40` }}
        />
      )}

      {/* Pin Bubble */}
      <div
        className="relative flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shadow-lg ring-2 ring-canvas-bg cursor-pointer transition-all duration-150"
        style={{
          background: pinColor,
          boxShadow: isSelected
            ? `0 0 0 3px ${pinColor}60, 0 4px 12px ${pinColor}40`
            : `0 2px 8px ${pinColor}60`,
        }}
        title={`#${annotation.index} ${annotation.authorName}: "${annotation.comment}"`}
      >
        {isResolved ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <span>{annotation.index}</span>
        )}
      </div>

      {/* Tooltip on hover */}
      {isSelected && (
        <div className="absolute left-8 top-0 z-20 w-56 animate-fade-in">
          <div className="bg-canvas-surface border border-canvas-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-3 pb-1.5 border-b border-canvas-border">
              <span className="text-[10px] font-semibold text-canvas-muted">
                #{annotation.index} · {annotation.authorName}
              </span>
              <span
                className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  isResolved
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-accent/20 text-accent'
                }`}
              >
                {annotation.status}
              </span>
            </div>
            <p className="px-3 py-2 text-xs text-canvas-fg leading-relaxed">
              {annotation.comment}
            </p>
            {annotation.resolvedBy && (
              <p className="px-3 pb-2 text-[10px] text-canvas-muted">
                Resolved by {annotation.resolvedBy}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
