'use client';

import { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BrandAssetDrawer } from './components/BrandAssetDrawer';
import { CanvasArtboard } from './components/CanvasArtboard';
import { ReviewRail } from './components/ReviewRail';
import { VoiceHuddleBar } from './components/VoiceHuddleBar';
import { useCometChat } from './hooks/useCometChat';

export default function AdProofPage() {
  // Initialize CometChat and all real-time listeners
  useCometChat();

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-canvas-bg">
      {/* ── Top Bar ── */}
      <TopBar />

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Brand Asset Drawer */}
        <BrandAssetDrawer />

        {/* Center: Canvas Artboard */}
        <CanvasArtboard />

        {/* Right: Review Rail */}
        <ReviewRail />
      </div>

      {/* ── Floating Huddle Bar (rendered above everything when active) ── */}
      <VoiceHuddleBar />
    </div>
  );
}
