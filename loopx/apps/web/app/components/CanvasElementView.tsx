'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { CanvasElement } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { Trash2, Lock, Unlock } from 'lucide-react';

interface CanvasElementViewProps {
  element: CanvasElement;
  canvasScale: number;
  isSelected: boolean;
  isPinMode: boolean;
}

export function CanvasElementView({
  element,
  canvasScale,
  isSelected,
  isPinMode,
}: CanvasElementViewProps) {
  const { dispatch } = useAppContext();
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPinMode || element.locked) return;
      e.stopPropagation();
      dispatch({ type: 'SELECT_ELEMENT', id: element.id });
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        elemX: element.x,
        elemY: element.y,
      };

      const onMove = (me: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (me.clientX - dragRef.current.startX) / canvasScale;
        const dy = (me.clientY - dragRef.current.startY) / canvasScale;
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: element.id,
          changes: {
            x: dragRef.current.elemX + dx,
            y: dragRef.current.elemY + dy,
          },
        });
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [element, canvasScale, isPinMode, dispatch],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPinMode || element.locked) return;
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: element.width,
        startH: element.height,
      };

      const onMove = (me: MouseEvent) => {
        if (!resizeRef.current) return;
        const dx = (me.clientX - resizeRef.current.startX) / canvasScale;
        const dy = (me.clientY - resizeRef.current.startY) / canvasScale;
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: element.id,
          changes: {
            width: Math.max(40, resizeRef.current.startW + dx),
            height: Math.max(20, resizeRef.current.startH + dy),
          },
        });
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [element, canvasScale, isPinMode, dispatch],
  );

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    cursor: isPinMode ? 'crosshair' : element.locked ? 'not-allowed' : 'move',
    userSelect: 'none',
    // Apply element styles
    ...(element.style?.background ? { background: element.style.background } : {}),
    ...(element.style?.borderRadius ? { borderRadius: element.style.borderRadius } : {}),
    ...(element.style?.opacity !== undefined ? { opacity: element.style.opacity } : {}),
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: element.style?.textAlign === 'left' ? 'flex-start' : element.style?.textAlign === 'right' ? 'flex-end' : 'center',
    fontSize: element.style?.fontSize,
    fontWeight: element.style?.fontWeight,
    color: element.style?.color,
    textAlign: element.style?.textAlign,
    letterSpacing: element.style?.letterSpacing,
    lineHeight: element.style?.lineHeight,
    fontFamily: element.style?.fontFamily,
    padding: element.style?.padding,
    borderRadius: element.style?.borderRadius,
    overflow: 'hidden',
    whiteSpace: element.type === 'text' ? 'pre-wrap' : undefined,
  };

  function renderContent() {
    if (element.type === 'image') {
      if (element.content.startsWith('placeholder:')) {
        const parts = element.content.split(':');
        const emoji = parts[1] ?? '🖼️';
        const name = parts[2] ?? 'Asset';
        return (
          <div
            style={contentStyle}
            className="flex-col gap-2 bg-canvas-surface border border-canvas-border rounded-lg text-canvas-muted"
          >
            <span style={{ fontSize: Math.min(element.width, element.height) * 0.25 }}>{emoji}</span>
            <span style={{ fontSize: 12 }}>{name}</span>
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.content}
          alt={element.name ?? 'canvas image'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: (element.style?.objectFit as React.CSSProperties['objectFit']) ?? 'cover',
            borderRadius: element.style?.borderRadius,
          }}
          draggable={false}
        />
      );
    }

    if (element.type === 'text' || element.type === 'badge') {
      return <div style={contentStyle}>{element.content}</div>;
    }

    return null;
  }

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      className={`group ${isSelected && !isPinMode ? 'canvas-element-selected' : ''}`}
    >
      {renderContent()}

      {/* Selection controls overlay */}
      {isSelected && !isPinMode && (
        <>
          {/* Resize handle — bottom-right */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-accent rounded-sm cursor-se-resize shadow-lg border border-white/20"
            onMouseDown={handleResizeMouseDown}
          />
          {/* Top-right controls */}
          <div className="absolute -top-8 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="h-6 w-6 rounded bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-canvas-fg flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'UPDATE_ELEMENT', id: element.id, changes: { locked: !element.locked } });
              }}
              title={element.locked ? 'Unlock element' : 'Lock element'}
            >
              {element.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            </button>
            <button
              className="h-6 w-6 rounded bg-canvas-surface border border-canvas-border text-canvas-muted hover:text-red-400 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'REMOVE_ELEMENT', id: element.id });
              }}
              title="Delete element"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
