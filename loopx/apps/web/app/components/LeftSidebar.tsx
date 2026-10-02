'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useCall } from '../hooks/useCall';
import {
  MacSidebar,
  Plus,
  Pin,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
  Image,
  ArrowRight,
} from './icons/Hugeicons';

export function LeftSidebar() {
  const { state, dispatch, togglePostHighlight } = useAppContext();
  const { isInCall, joinCall, leaveCall } = useCall();
  const {
    posts,
    activePostId,
    sessionName,
    pinModeActive,
    huddleActive,
    currentUser,
    activeUsers,
    collaborators,
  } = state;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Real collaborators list
  const otherUsers = (activeUsers || []).filter((u) => u.uid !== currentUser?.uid);
  const totalOtherCount = Math.max(otherUsers.length, Object.keys(collaborators || {}).length);

  const getAvatarColor = (name: string) => {
    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Changes
          </span>
        );
      case 'IN_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            In Review
          </span>
        );
    }
  };

  const getPresetLabel = (preset: string) => {
    switch (preset) {
      case 'REELS_STORY':
        return '9:16 Story';
      case 'IG_SQUARE':
        return '1:1 Square';
      case 'X_BANNER':
        return '16:9 Banner';
      case 'LINKEDIN_POST':
        return 'LinkedIn';
      default:
        return preset;
    }
  };

  if (!isSidebarVisible) {
    return (
      <aside className="select-none shrink-0 z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-xl rounded-2xl p-1.5 flex flex-col items-center gap-2">
          <button
            onClick={() => setIsSidebarVisible(true)}
            title="Expand Sidebar"
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 flex items-center justify-center transition-all shadow-2xs"
          >
            <MacSidebar className="w-4 h-4" />
          </button>
          <div className="w-4 h-[1px] bg-neutral-200" />
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
            title="Create New Frame"
            className="w-8 h-8 rounded-xl bg-black hover:bg-neutral-800 text-white flex items-center justify-center transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_PIN_MODE', active: !pinModeActive })}
            title={pinModeActive ? 'Exit Pin Mode' : 'Drop Pin Comment'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              pinModeActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => (isInCall ? leaveCall() : joinCall())}
            title={isInCall ? 'Leave Audio Huddle' : 'Join Audio Huddle'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isInCall
                ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="select-none shrink-0 z-30 flex flex-col gap-2.5 w-[310px] pointer-events-auto font-sans animate-fade-in">
      {/* ── Main Frosted Glass Card ── */}
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-xl overflow-hidden flex flex-col">
        {/* ── Header: Project & Board Info ── */}
        <div className="p-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dark Studio Monogram Logo */}
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-tight shrink-0 relative">
              <span>LX</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold text-neutral-900 truncate">
                  {sessionName || 'Creative Workspace'}
                </h4>
              </div>
              <span className="text-[11px] text-neutral-400 block truncate font-medium">
                Live Studio Proofing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarVisible(false)}
              title="Collapse Sidebar"
              className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            >
              <MacSidebar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Section: Ad Creative Frames ── */}
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400">
              Ad Frames ({posts.length})
            </span>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Frame</span>
            </button>
          </div>

          {/* Frames Scrollable Stack */}
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
            {posts.map((post) => {
              const isSelected = activePostId === post.id;
              const postAnnotations = state.annotations.filter((a) => a.preset === post.preset);

              return (
                <div
                  key={post.id}
                  onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                    isSelected
                      ? 'bg-neutral-50/95 border-neutral-900/30 shadow-xs ring-1 ring-neutral-900/5 pl-3.5'
                      : 'bg-white border-neutral-200/70 hover:border-neutral-300 hover:bg-neutral-50/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-neutral-900" />
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-900 truncate">
                      {post.title}
                    </span>
                    {getStatusBadge(post.status)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono text-[9px] font-medium border border-neutral-200/60">
                        {getPresetLabel(post.preset)}
                      </span>
                    </div>

                    {post.isHighlighted ? (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>Aura Glow</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                        <span>Creative Frame</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section: Quick Studio Actions ── */}
        <div className="p-3 pt-2 border-t border-neutral-100 flex flex-col gap-2 bg-neutral-50/40">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const targetPostId = activePostId || posts[0]?.id;
                if (targetPostId) togglePostHighlight(targetPostId);
              }}
              disabled={posts.length === 0}
              className={`py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all border ${
                posts.find((p) => p.id === (activePostId || posts[0]?.id))?.isHighlighted
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-2xs'
              }`}
              title="Toggle Aura Glow Highlight (H)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{posts.find((p) => p.id === (activePostId || posts[0]?.id))?.isHighlighted ? 'Aura Active' : 'Highlight'}</span>
              <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-100 border border-neutral-200 text-neutral-600">H</kbd>
            </button>

            <button
              onClick={() => (isInCall ? leaveCall() : joinCall())}
              className={`py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all border ${
                isInCall
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-2xs'
              }`}
            >
              {isInCall ? (
                <span className="flex items-center gap-0.5 mr-0.5">
                  <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                </span>
              ) : (
                <Mic className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span>{isInCall ? 'In Huddle' : 'Live Huddle'}</span>
            </button>
          </div>

          {/* Reviewers Active Presence Bar */}
          <div className="p-2 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                <div
                  className={`w-5 h-5 rounded-full border border-white ${getAvatarColor(currentUser?.name || 'You')} text-white text-[9px] font-bold flex items-center justify-center shadow-xs`}
                  title={`${currentUser?.name || 'You'} (You)`}
                >
                  {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                </div>
                {otherUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.uid}
                    className={`w-5 h-5 rounded-full border border-white ${getAvatarColor(u.name)} text-white text-[9px] font-bold flex items-center justify-center shadow-xs`}
                    title={u.name}
                  >
                    {(u.name || 'C').charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-neutral-600 font-medium">
                {totalOtherCount > 0
                  ? `${totalOtherCount + 1} Collaborators`
                  : 'Solo (You)'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
              Synced
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
