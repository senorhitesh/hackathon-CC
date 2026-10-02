'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Share01Icon } from '@hugeicons/core-free-icons';
import { useAppContext } from '../context/AppContext';
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Plus,
  Check,
  LayoutGrid,
  Copy,
  ExternalLink,
  UserIcon,
  LogOut,
  Share2,
} from './icons/Hugeicons';

export function TopBar() {
  const { state, dispatch, logoutUser, getShareUrl } = useAppContext();
  const { currentUser, roomId, sessionName, rooms, collaborators, activeUsers } = state;

  const [copied, setCopied] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeShareUrl = getShareUrl(roomId);

  function handleCopyShareLink() {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/app?room=${encodeURIComponent(roomId || 'main-studio-workspace')}`
      : activeShareUrl;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const otherUsers = (activeUsers || []).filter((u) => u.uid !== currentUser?.uid);
  const activeCollabList = [
    ...Object.values(collaborators || {}),
    ...otherUsers
      .filter((u) => !collaborators[u.uid])
      .map((u) => ({
        uid: u.uid,
        name: u.name,
        color: '#2563eb',
        role: 'client' as const,
        x: 0,
        y: 0,
        lastSeen: Date.now(),
      })),
  ];

  return (
    <header className="h-12 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 px-4 flex items-center justify-between z-40 shrink-0 gap-3 text-neutral-900 select-none">
      {/* ── Left: Breadcrumb Navigation (Image 3 style: My projects / Untitled) ── */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-2 mr-1 hover:opacity-85 transition-opacity shrink-0">
          <img
            src="/loogx-logo&favicon.png"
            alt="loopx logo"
            className="w-5 h-5 rounded-md object-contain shadow-2xs"
          />
          <span className="font-semibold text-xs tracking-tight text-neutral-900 hidden sm:inline">
            loopx
          </span>
        </Link>

        <span className="text-neutral-300">/</span>

        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors shrink-0">
          <div className="w-5 h-5 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center">
            <LayoutGrid className="w-3 h-3 text-neutral-700" />
          </div>
          <span className="hidden sm:inline">My projects</span>
        </Link>

        <span className="text-neutral-300">/</span>

        {/* Board Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 text-xs font-semibold text-neutral-900 transition-colors"
          >
            <span className="truncate max-w-[130px] sm:max-w-[200px]">
              {sessionName || 'Untitled'}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {/* Boards Dropdown */}
          {boardDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-2xl bg-white border border-neutral-200 shadow-xl p-2 z-50 animate-fade-in text-neutral-900">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                Workspaces ({rooms.length})
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {rooms.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      dispatch({ type: 'SET_ROOM_ID', roomId: r.id, sessionName: r.name });
                      setBoardDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      r.id === roomId
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    {r.id === roomId && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setBoardDropdownOpen(false);
                  dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: true });
                }}
                className="w-full mt-1.5 pt-1.5 border-t border-neutral-100 px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ── Right: Draft status, Settings, Run, Share +, Profile Menu ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live CometChat Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-[10px] font-mono font-medium text-emerald-800 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>CometChat Live</span>
        </div>
        {/* Collaborators Avatar Stack */}
        {activeCollabList.length > 0 && (
          <div className="hidden xl:flex items-center -space-x-1.5 mr-1" title={`${activeCollabList.length} collaborator(s) online`}>
            {activeCollabList.slice(0, 3).map((collab) => (
              <div
                key={collab.uid}
                className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs select-none"
                style={{ backgroundColor: collab.color || '#2563eb' }}
                title={collab.name}
              >
                {collab.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* ── Share Button & Popover ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSharePopoverOpen(!sharePopoverOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 ${
              sharePopoverOpen
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200/90 text-neutral-800 border border-neutral-200/90'
            }`}
            title="Share workspace for live collaboration"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {sharePopoverOpen && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSharePopoverOpen(false)}
              />

              {/* Share Popover */}
              <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-4 z-50 animate-fade-in text-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src="/loogx-logo&favicon.png" alt="loopx" className="w-4 h-4 rounded-sm object-contain" />
                    <h4 className="text-xs font-semibold text-neutral-900">
                      Collaborative Workspace
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Sync
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug mb-3">
                  Anyone with this link can view, chat, and place pins on this canvas in real time.
                </p>

                {/* Share link input + Copy button */}
                <div className="flex items-center gap-1.5 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={activeShareUrl}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-700 truncate focus:outline-none focus:border-neutral-400 select-all"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 border ${
                      copied
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                        : 'bg-neutral-900 hover:bg-black text-white border-neutral-900'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <a
                    href={activeShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 transition-colors font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in New Window</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── User Profile Menu ── */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            title={currentUser.name}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center shadow-2xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-2 z-50 animate-fade-in text-neutral-900">
              <div className="px-2.5 py-2 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {currentUser.name}
                  </p>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                    {currentUser.isLoggedIn ? 'Member' : 'Guest'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                  {currentUser.email || `ID: #${(currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase()}`}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-neutral-500" />
                  <span>All Projects Dashboard</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-neutral-100">
                {currentUser.isLoggedIn ? (
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logoutUser();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-900 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Sign In to Account</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


export type SoftPillVariant = "secondary" | "primary";

interface SoftPillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SoftPillVariant;
}

const SoftPillButton = React.forwardRef<HTMLButtonElement, SoftPillButtonProps>(
  ({ className, children, variant = "secondary", ...props }, ref) => {
    const isPrimary = variant === "primary";
    return (
      <button
        ref={ref}
        className={cn(
          "group relative block rounded-full text-center px-5 py-2.5 text-[13px] font-medium tracking-tight transition-[transform] duration-200 active:scale-[0.99] active:duration-[50ms]",
          "[backdrop-filter:blur(6px)]",
          isPrimary ? "text-white/90" : "text-neutral-900",
          className,
        )}
        style={{
          boxShadow: isPrimary
            ? "0 12px 24px -8px rgba(0, 0, 0, 0.28), 0 4px 8px -2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12)"
            : "0 12px 24px -8px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full overflow-hidden transition-all duration-200 group-active:duration-[50ms]"
          style={{
            background: isPrimary
              ? "rgba(0, 0, 0, 0.56)"
              : "rgba(255, 255, 255, 0.9)",
          }}
        >
          {!isPrimary && (
            <span
              className="absolute inset-0 transition duration-200 bg-black/[0.06] group-hover:bg-black/[0.03] group-active:bg-black/[0.07] group-active:duration-[50ms]"
            />
          )}
          <span
            className="absolute inset-0 transition duration-200 group-active:opacity-0 group-active:duration-[50ms]"
            style={{
              background: isPrimary
                ? "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)"
                : "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)",
              opacity: isPrimary ? 0.12 : 0.32,
            }}
          />
          <span
            className="absolute inset-0 transition duration-200 group-active:duration-[50ms]"
            style={{
              background:
                "radial-gradient(65.62% 65.62% at 50% 100%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)",
              opacity: isPrimary ? 0.32 : 0.08,
            }}
          />
          {!isPrimary && (
            <span
              className="absolute inset-0 transition duration-200 group-active:opacity-0 group-active:duration-[50ms]"
              style={{
                background:
                  "linear-gradient(99deg, rgba(255, 255, 255, 0) 27.7%, rgba(255, 255, 255, 0.12) 60.19%, rgba(255, 255, 255, 0) 86.06%)",
              }}
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full p-px"
            style={{
              background: isPrimary
                ? "linear-gradient(rgb(255, 255, 255) 0%, rgb(153, 153, 153) 55%, rgb(255, 255, 255) 80%, rgb(153, 153, 153) 95%)"
                : "linear-gradient(transparent 0%, rgb(255, 255, 255) 55%, transparent 80%, rgb(255, 255, 255) 95%)",
              opacity: isPrimary ? 0.24 : 0.12,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </span>
        <span className="relative">{children}</span>
      </button>
    );
  },
);


