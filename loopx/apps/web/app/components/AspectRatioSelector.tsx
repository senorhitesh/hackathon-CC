'use client';

import React from 'react';
import type { PlatformPreset } from '@repo/types';
import { PLATFORM_PRESETS } from '@repo/types';
import { useAppContext } from '../context/AppContext';

const PRESET_ORDER: PlatformPreset[] = ['IG_SQUARE', 'REELS_STORY', 'X_BANNER', 'LINKEDIN_POST'];

/** Visual aspect ratio miniature */
function PresetVisualizer({ preset }: { preset: PlatformPreset }) {
  const dims = PLATFORM_PRESETS[preset];
  const maxSize = 24;
  const ratio = dims.width / dims.height;
  const w = ratio >= 1 ? maxSize : Math.round(maxSize * ratio);
  const h = ratio >= 1 ? Math.round(maxSize / ratio) : maxSize;

  return (
    <div
      className="rounded-sm border border-current opacity-60 flex-shrink-0"
      style={{ width: w, height: h, minWidth: 8, minHeight: 8 }}
    />
  );
}

export function AspectRatioSelector() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="flex items-center gap-1 p-1 bg-canvas-surface rounded-lg border border-canvas-border">
      {PRESET_ORDER.map((preset) => {
        const dims = PLATFORM_PRESETS[preset];
        const active = state.activePreset === preset;
        return (
          <button
            key={preset}
            onClick={() => dispatch({ type: 'SET_PRESET', preset })}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150 whitespace-nowrap
              ${active
                ? 'bg-accent text-white shadow-sm shadow-accent/30'
                : 'text-canvas-muted hover:text-canvas-fg hover:bg-canvas-hover'
              }
            `}
            title={`${dims.label} — ${dims.width}×${dims.height}`}
          >
            <PresetVisualizer preset={preset} />
            <span className="hidden sm:inline">{dims.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
