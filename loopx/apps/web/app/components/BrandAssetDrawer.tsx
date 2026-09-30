'use client';

import React, { useCallback } from 'react';
import {
  Type,
  Image as ImageIcon,
  Tag,
  AlignLeft,
  Square,
  Layers,
  Plus,
  Upload,
} from 'lucide-react';
import type { CanvasElement } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { PLATFORM_PRESETS } from '@repo/types';

interface TextPreset {
  label: string;
  content: string;
  style: CanvasElement['style'];
  width: number;
  height: number;
}

const TEXT_PRESETS: TextPreset[] = [
  {
    label: 'Headline',
    content: 'Your Headline Here',
    width: 400,
    height: 80,
    style: { fontSize: 48, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  },
  {
    label: 'Subheading',
    content: 'Subheading text',
    width: 320,
    height: 48,
    style: { fontSize: 28, fontWeight: '500', color: '#a1a1aa', textAlign: 'center' },
  },
  {
    label: 'Body Copy',
    content: 'Body copy goes here.',
    width: 360,
    height: 80,
    style: { fontSize: 18, fontWeight: '400', color: '#d4d4d8', textAlign: 'left' },
  },
  {
    label: 'CTA Button',
    content: 'Shop Now →',
    width: 200,
    height: 56,
    style: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      background: '#6366f1',
      textAlign: 'center',
      borderRadius: 12,
      padding: 16,
    },
  },
];

const BADGE_PRESETS = [
  { label: '50% OFF', bg: '#ef4444', color: '#fff' },
  { label: 'NEW', bg: '#6366f1', color: '#fff' },
  { label: 'LIMITED', bg: '#f59e0b', color: '#000' },
  { label: '✓ VERIFIED', bg: '#22c55e', color: '#fff' },
  { label: 'SALE', bg: '#ec4899', color: '#fff' },
];

// Placeholder brand asset thumbnails (SVG data URIs)
const PLACEHOLDER_ASSETS = [
  { id: 'logo1', name: 'Brand Logo', emoji: '🎯' },
  { id: 'prod1', name: 'Product Shot', emoji: '📦' },
  { id: 'prod2', name: 'Product Hero', emoji: '⭐' },
  { id: 'bg1', name: 'Gradient BG', emoji: '🌈' },
];

export function BrandAssetDrawer() {
  const { state, addCanvasElement } = useAppContext();
  const preset = PLATFORM_PRESETS[state.activePreset];

  const centerX = preset.width / 2;
  const centerY = preset.height / 2;

  const addText = useCallback(
    (tp: TextPreset) => {
      addCanvasElement({
        type: 'text',
        x: centerX - tp.width / 2,
        y: centerY - tp.height / 2,
        width: tp.width,
        height: tp.height,
        content: tp.content,
        rotation: 0,
        style: tp.style,
        name: tp.label,
      });
    },
    [addCanvasElement, centerX, centerY],
  );

  const addBadge = useCallback(
    (badge: (typeof BADGE_PRESETS)[0]) => {
      addCanvasElement({
        type: 'badge',
        x: 40,
        y: 40,
        width: 160,
        height: 52,
        content: badge.label,
        rotation: 0,
        style: {
          background: badge.bg,
          color: badge.color,
          borderRadius: 8,
          fontSize: 16,
          fontWeight: '700',
          textAlign: 'center',
          padding: 12,
        },
        name: badge.label,
      });
    },
    [addCanvasElement],
  );

  const addPlaceholderImage = useCallback(
    (asset: (typeof PLACEHOLDER_ASSETS)[0]) => {
      addCanvasElement({
        type: 'image',
        x: centerX - 160,
        y: centerY - 160,
        width: 320,
        height: 320,
        content: `placeholder:${asset.emoji}:${asset.name}`,
        rotation: 0,
        style: { objectFit: 'cover', borderRadius: 8 },
        name: asset.name,
      });
    },
    [addCanvasElement, centerX, centerY],
  );

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-canvas-surface border-r border-canvas-border overflow-y-auto">
      {/* Header */}
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-canvas-muted uppercase tracking-widest">
          Assets
        </h2>
      </div>

      {/* Upload Drop Zone */}
      <div className="mx-3 mb-3">
        <label className="flex flex-col items-center justify-center gap-1 w-full h-20 rounded-lg border border-dashed border-canvas-border hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer group">
          <Upload className="w-4 h-4 text-canvas-muted group-hover:text-accent transition-colors" />
          <span className="text-xs text-canvas-muted group-hover:text-accent transition-colors">
            Upload asset
          </span>
          <input type="file" className="hidden" accept="image/*" />
        </label>
      </div>

      {/* Brand Assets */}
      <SectionLabel label="Brand" icon={<ImageIcon className="w-3 h-3" />} />
      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
        {PLACEHOLDER_ASSETS.map((asset) => (
          <button
            key={asset.id}
            onClick={() => addPlaceholderImage(asset)}
            className="flex flex-col items-center justify-center gap-1 h-16 rounded-md bg-canvas-bg border border-canvas-border hover:border-accent/40 hover:bg-accent/5 transition-all text-xs text-canvas-muted hover:text-canvas-fg"
          >
            <span className="text-xl">{asset.emoji}</span>
            <span className="text-[10px] text-center leading-tight px-1">{asset.name}</span>
          </button>
        ))}
      </div>

      {/* Text Elements */}
      <SectionLabel label="Text" icon={<Type className="w-3 h-3" />} />
      <div className="flex flex-col gap-1 px-3 pb-3">
        {TEXT_PRESETS.map((tp) => (
          <button
            key={tp.label}
            onClick={() => addText(tp)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-canvas-hover text-left transition-colors group"
          >
            <AlignLeft className="w-3 h-3 text-canvas-muted group-hover:text-accent flex-shrink-0" />
            <div>
              <div
                className="text-xs font-medium text-canvas-fg"
                style={{ fontSize: Math.min(14, (tp.style?.fontSize ?? 14) * 0.3 + 8) }}
              >
                {tp.label}
              </div>
              <div className="text-[10px] text-canvas-muted">
                {tp.style?.fontSize}px · {tp.style?.fontWeight === '700' ? 'Bold' : tp.style?.fontWeight === '500' ? 'Medium' : 'Regular'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Badges */}
      <SectionLabel label="Badges" icon={<Tag className="w-3 h-3" />} />
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {BADGE_PRESETS.map((badge) => (
          <button
            key={badge.label}
            onClick={() => addBadge(badge)}
            className="text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer transition-transform hover:scale-105"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function SectionLabel({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      <span className="text-canvas-muted">{icon}</span>
      <span className="text-[10px] font-semibold text-canvas-muted uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
