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
  X,
} from './icons/Hugeicons';

export function TopBar() {
  const {
    state,
    dispatch,
    logoutUser,
    getShareUrl,
    updateUserName,
    setUserAlias,
    getEffectiveUserName,
    removeCollaborator,
  } = useAppContext();
  const { currentUser, roomId, sessionName, rooms, collaborators, activeUsers, customAliases } = state;

  const [copied, setCopied] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collabPopoverOpen, setCollabPopoverOpen] = useState(false);

  // Self name editing state
  const [isEditingMyName, setIsEditingMyName] = useState(false);
  const [myNameInput, setMyNameInput] = useState(currentUser.name || '');

  // Collaborator alias editing state
  const [editingCollabUid, setEditingCollabUid] = useState<string | null>(null);
  const [collabAliasInput, setCollabAliasInput] = useState('');

  React.useEffect(() => {
    if (!isEditingMyName) {
      setMyNameInput(currentUser.name || '');
    }
  }, [currentUser.name, isEditingMyName]);

  const activeShareUrl = getShareUrl(roomId);

  function handleCopyShareLink() {
    const url = activeShareUrl;
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

  const now = Date.now();
  // Only include genuine live collaborators seen within the last 6 seconds
  const activeCollabList = Object.values(collaborators || {}).filter(
    (c) =>
      c.uid !== currentUser?.uid &&
      now - (c.lastSeen || 0) < 6000 &&
      !c.uid.toLowerCase().includes('7f2a') &&
      !c.name?.toUpperCase().includes('7F2A')
  );

  return (
    <header className="h-12 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 px-2.5 sm:px-4 flex items-center justify-between z-40 shrink-0 gap-1.5 sm:gap-3 text-neutral-900 select-none">
      {/* ── Left: Breadcrumb Navigation ── */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 mr-0.5 sm:mr-1 hover:opacity-85 transition-opacity shrink-0">
          <img
            src="/loogx-logo&favicon.png"
            alt="loopx logo"
            className="w-5 h-5 rounded-md object-contain shadow-2xs"
          />
          <span className="font-semibold text-xs tracking-tight text-neutral-900 hidden sm:inline">
            loopx
          </span>
        </Link>

        <span className="text-neutral-300 hidden sm:inline">/</span>

        <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors shrink-0">
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
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md hover:bg-neutral-100 text-xs font-semibold text-neutral-900 transition-colors"
          >
            <span className="truncate max-w-[100px] sm:max-w-[200px]" suppressHydrationWarning>
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
        {/* Collaborators Avatar Stack with Interactive Naming Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCollabPopoverOpen(!collabPopoverOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            title="View & rename collaborators"
          >
            <div className="flex items-center -space-x-1.5">
              <div
                className="w-6 h-6 rounded-full border border-white bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shadow-xs select-none"
                title={`${currentUser.name} (You)`}
                suppressHydrationWarning
              >
                <span suppressHydrationWarning>{(currentUser.name || 'Y').charAt(0).toUpperCase()}</span>
              </div>
              {activeCollabList.slice(0, 3).map((collab) => {
                const effName = getEffectiveUserName(collab.uid, collab.name);
                return (
                  <div
                    key={collab.uid}
                    className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs select-none"
                    style={{ backgroundColor: collab.color || '#2563eb' }}
                    title={effName}
                  >
                    {effName.charAt(0).toUpperCase()}
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] font-semibold text-neutral-700 hidden sm:inline">
              {activeCollabList.length + 1} online
            </span>
          </button>

          {collabPopoverOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setCollabPopoverOpen(false);
                  setEditingCollabUid(null);
                }}
              />
              <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-3.5 z-50 animate-fade-in text-neutral-900">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-bold text-neutral-900">Workspace Collaborators</h4>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                    {activeCollabList.length + 1} connected
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Current User Row */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(currentUser.name || 'Y').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-neutral-900 truncate">
                            {currentUser.name}
                          </p>
                          <span className="text-[9px] font-bold text-neutral-500 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                            YOU
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-neutral-400">
                          ID: #{((currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4) || 'USER').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Collaborators */}
                  {activeCollabList.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-neutral-500">
                      <p className="text-xs font-medium">No other collaborators yet</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Share link to invite teammates to edit together!
                      </p>
                    </div>
                  ) : (
                    activeCollabList.map((collab) => {
                      const effName = getEffectiveUserName(collab.uid, collab.name);
                      const cleanC = (collab.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
                      const shortId = (cleanC.slice(-4) || 'USER').toUpperCase();
                      const hasAlias = Boolean(customAliases && customAliases[collab.uid]);
                      const isEditingThis = editingCollabUid === collab.uid;

                      return (
                        <div
                          key={collab.uid}
                          className="p-2 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 transition-colors shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                                style={{ backgroundColor: collab.color || '#2563eb' }}
                              >
                                {effName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-neutral-900 truncate">
                                  {effName}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                                  <span>ID: #{shortId}</span>
                                  {hasAlias && (
                                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded font-sans font-medium">
                                      Custom Name
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!isEditingThis && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCollabUid(collab.uid);
                                    setCollabAliasInput(customAliases?.[collab.uid] || effName);
                                  }}
                                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                  </svg>
                                  <span>{hasAlias ? 'Rename' : 'Give Name'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeCollaborator(collab.uid)}
                                  className="w-6 h-6 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                  title="Dismiss inactive collaborator"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline Edit Form for this collaborator */}
                          {isEditingThis && (
                            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-1.5 animate-fade-in">
                              <label className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                                Give name to #{shortId}:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={collabAliasInput}
                                  onChange={(e) => setCollabAliasInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setUserAlias(collab.uid, collabAliasInput);
                                      setEditingCollabUid(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingCollabUid(null);
                                    }
                                  }}
                                  placeholder="e.g. Alex (Brand Lead)"
                                  className="flex-1 px-2 py-1 rounded-lg text-xs bg-neutral-50 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserAlias(collab.uid, collabAliasInput);
                                    setEditingCollabUid(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCollabUid(null)}
                                  className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-medium hover:bg-neutral-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                              {hasAlias && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserAlias(collab.uid, '');
                                    setEditingCollabUid(null);
                                  }}
                                  className="text-[10px] text-rose-500 hover:underline text-left"
                                >
                                  Reset to original ID handle
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Excalidraw-style Live Collaboration Share Button ── */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isShareOpen', value: true })}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 ${
            state.roomId
              ? 'bg-[#6965db] hover:bg-[#5b57d1] text-white'
              : 'bg-[#ececfc] hover:bg-[#dfdffc] text-[#5b58c7] border border-[#d6d6fa]'
          }`}
          title="Live collaboration & Share"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>


        {/* ── User Profile Menu ── */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
            title={currentUser.name}
            suppressHydrationWarning
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center shadow-2xs" suppressHydrationWarning>
                <span suppressHydrationWarning>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-2.5 z-50 animate-fade-in text-neutral-900">
              <div className="px-2 py-2 border-b border-neutral-100">
                {!isEditingMyName ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-900 truncate" suppressHydrationWarning>
                        {currentUser.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMyNameInput(currentUser.name || '');
                          setIsEditingMyName(true);
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                        <span>Edit Name</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {currentUser.isLoggedIn ? 'Member' : 'Guest'}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">
                        ID: #{(currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider block">
                      Your Display Name
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={myNameInput}
                      onChange={(e) => setMyNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateUserName(myNameInput);
                          setIsEditingMyName(false);
                        } else if (e.key === 'Escape') {
                          setIsEditingMyName(false);
                        }
                      }}
                      placeholder="e.g. Sarah · Art Director"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-neutral-50 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />

                    {/* Quick Role Presets */}
                    <div className="flex flex-wrap gap-1">
                      {['🎨 Designer', '✍️ Copywriter', '👑 Lead', '💼 Client'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const base = myNameInput.split('·')[0]?.trim() || currentUser.name.split('·')[0]?.trim() || 'User';
                            setMyNameInput(`${base} · ${preset}`);
                          }}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          updateUserName(myNameInput);
                          setIsEditingMyName(false);
                        }}
                        className="flex-1 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Save Name
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingMyName(false)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-medium hover:bg-neutral-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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


