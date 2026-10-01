'use client';

import React from 'react';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { PostChatPanel } from './components/PostChatPanel';
import { LoginModal } from './components/LoginModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { CreatePostModal } from './components/CreatePostModal';

export default function LoopXPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* ── Top Bar (Board Switcher & Actions) ── */}
      <TopBar />

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Boards & Assets Sidebar (Wireframe Image 5 Left Panel) */}
        <LeftSidebar />

        {/* Center: Dot Grid Canvas & Posts Gallery (Wireframe Image 5 Center Canvas) */}
        <CanvasWorkspace />

        {/* Right: Dedicated CometChat Chat & AI Iteration Rail (Wireframe Image 5 Right Panel) */}
        <PostChatPanel />
      </div>

      {/* ── Interactive Modals ── */}
      <LoginModal />
      <CreateRoomModal />
      <CreatePostModal />
    </div>
  );
}
