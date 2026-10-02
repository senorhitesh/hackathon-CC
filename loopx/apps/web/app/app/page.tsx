'use client';

import React, { createContext, useContext } from 'react';
import { TopBar } from '../components/TopBar';
import { LeftSidebar } from '../components/LeftSidebar';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { PostChatPanel } from '../components/PostChatPanel';
import { LoginModal } from '../components/LoginModal';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { useCometChat } from '../hooks/useCometChat';

// ─── CometChat Context (exposes sendMessage to child components) ────────────

interface CometChatContextValue {
  sendMessage: (
    text: string,
    targetPostId?: string,
    media?: { file?: File; url: string; name?: string; type?: 'image' | 'video' | 'file' }
  ) => Promise<void>;
}

const CometChatContext = createContext<CometChatContextValue>({
  sendMessage: async () => {},
});

export function useCometChatContext() {
  return useContext(CometChatContext);
}

// ─── Workspace Page ─────────────────────────────────────────────────────────

function WorkspaceInner() {
  const { sendMessage } = useCometChat();

  return (
    <CometChatContext.Provider value={{ sendMessage }}>
      <div className="flex flex-col h-dvh overflow-hidden bg-white text-neutral-900 font-sans">
        {/* ── Top Bar (Workflow Switcher, Share+, User Profile) ── */}
        <TopBar />

        {/* ── Main Workspace ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Floating Left Sidebar (White Theme Matching Reference Image) */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <LeftSidebar />
          </div>

          {/* Center: Infinite Node Canvas with Dot Grid */}
          <CanvasWorkspace />

          {/* Floating Real-time Peer-to-Peer Chat Panel (Image 1 Style) */}
          <PostChatPanel />
        </div>

        {/* ── Interactive Modals ── */}
        <LoginModal />
        <CreateRoomModal />
        <CreatePostModal />
      </div>
    </CometChatContext.Provider>
  );
}

export default function WorkspacePage() {
  return <WorkspaceInner />;
}

