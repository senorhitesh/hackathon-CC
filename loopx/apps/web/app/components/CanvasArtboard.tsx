'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PLATFORM_PRESETS } from '@repo/types';
import { CanvasElementView } from './CanvasElementView';
import { PinMarker } from './PinMarker';
import { PinPopover } from './PinPopover';

interface PendingPin {
  /** position within the artboard in pixels */
  artboardX: number;
  artboardY: number;
  /** normalized 0-1 coordinates */
  normalizedX: number;
  normalizedY: number;
}

export function CanvasArtboard() {
  const { state, dispatch, addAnnotation } = useAppContext();
  const {
    activePreset,
    canvasElements,
    annotations,
    pinModeActive,
    selectedElementId,
    currentUser,
  } = state;

  const preset = PLATFORM_PRESETS[activePreset];
  const containerRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);

  // Current rendered scale of the artboard (used for coordinate transforms)
  const [scale, setScale] = useState(1);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);

  // ─── Auto-scale artboard to fit container ──────────────────────────────────
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const { clientWidth: cw, clientHeight: ch } = containerRef.current;
      const padding = 48;
      const scaleX = (cw - padding) / preset.width;
      const scaleY = (ch - padding) / preset.height;
      setScale(Math.min(scaleX, scaleY, 1));
    }

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [preset]);

  // ─── Artboard click → place pin or deselect ───────────────────────────────
  const handleArtboardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pinModeActive) {
        // Deselect element if clicking empty canvas
        dispatch({ type: 'SELECT_ELEMENT', id: null });
        dispatch({ type: 'SET_SELECTED_PIN', id: null });
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      // Convert from rendered pixel space to artboard coordinate space
      const artboardX = rawX / scale;
      const artboardY = rawY / scale;

      const normalizedX = rawX / rect.width;
      const normalizedY = rawY / rect.height;

      setPendingPin({ artboardX, artboardY, normalizedX, normalizedY });
    },
    [pinModeActive, scale, dispatch],
  );

  // ─── Submit annotation comment ─────────────────────────────────────────────
  const handlePinSubmit = useCallback(
    async (comment: string) => {
      if (!pendingPin) return;

      const annotation = addAnnotation({
        preset: activePreset,
        normalizedX: pendingPin.normalizedX,
        normalizedY: pendingPin.normalizedY,
        authorId: currentUser.uid,
        authorName: currentUser.name,
        comment,
      });

      // Broadcast via CometChat (or mock)
      try {
        const { sendAnnotation } = await import('@repo/cometchat-client');
        await sendAnnotation(state.roomId, annotation, 'CREATE');
      } catch (err) {
        console.error('[loopx] Failed to send annotation:', err);
      }

      setPendingPin(null);
      dispatch({ type: 'SET_PIN_MODE', active: false });
    },
    [pendingPin, addAnnotation, activePreset, currentUser, state.roomId, dispatch],
  );

  const artboardStyle: React.CSSProperties = {
    width: preset.width,
    height: preset.height,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    position: 'relative',
    background: 'linear-gradient(135deg, #1c1c1e 0%, #27272a 100%)',
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-start justify-center overflow-hidden bg-canvas-bg relative"
      style={{ paddingTop: 24, paddingBottom: 24 }}
    >
      {/* Artboard */}
      <div
        ref={artboardRef}
        style={artboardStyle}
        className={`artboard-shadow no-select flex-shrink-0 ${pinModeActive ? 'cursor-pin' : ''}`}
        onClick={handleArtboardClick}
      >
        {/* Grid overlay pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background: 'radial-gradient(circle, #71717a 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          } as React.CSSProperties}
        />

        {/* Canvas Elements */}
        {[...canvasElements]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <CanvasElementView
              key={el.id}
              element={el}
              canvasScale={scale}
              isSelected={selectedElementId === el.id}
              isPinMode={pinModeActive}
            />
          ))}

        {/* Pin Markers */}
        {annotations
          .filter((ann) => ann.preset === activePreset)
          .map((ann) => (
            <PinMarker
              key={ann.id}
              annotation={ann}
              canvasWidth={preset.width}
              canvasHeight={preset.height}
            />
          ))}

        {/* Pending pin ghost marker */}
        {pendingPin && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: pendingPin.artboardX,
              top: pendingPin.artboardY,
              transform: 'translate(-50%, -50%)',
              zIndex: 200,
            }}
          >
            <div className="w-7 h-7 rounded-full bg-accent/50 border-2 border-accent animate-pulse" />
          </div>
        )}
      </div>

      {/* Pin Popover — rendered outside the scaled artboard to avoid transform issues */}
      {pendingPin && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: containerRef.current ? 24 : 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {(() => {
            const containerWidth = containerRef.current?.clientWidth ?? 800;
            const artboardRenderedWidth = preset.width * scale;
            const artboardOffsetX = (containerWidth - artboardRenderedWidth) / 2;
            const absX = artboardOffsetX + pendingPin.artboardX * scale;
            const absY = pendingPin.artboardY * scale;

            return (
              <div className="pointer-events-auto absolute" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                <PinPopover
                  x={absX}
                  y={absY}
                  pinIndex={annotations.length + 1}
                  authorName={currentUser.name}
                  onSubmit={handlePinSubmit}
                  onCancel={() => {
                    setPendingPin(null);
                    dispatch({ type: 'SET_PIN_MODE', active: false });
                  }}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Format Dimension Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-canvas-muted bg-canvas-surface/80 border border-canvas-border/50 rounded-full px-3 py-1 pointer-events-none backdrop-blur-sm">
        {preset.width} × {preset.height}px · {preset.label}
      </div>
    </div>
  );
}
