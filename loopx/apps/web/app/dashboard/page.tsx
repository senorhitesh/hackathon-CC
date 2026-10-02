'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import {
  Plus,
  Zap,
  Share2,
  Trash2,
  LogOut,
  LayoutGrid,
  Check,
  ArrowRight,
  Clock,
} from '../components/icons/Hugeicons';
import type { BoardRoom } from '@repo/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { state, dispatch, createRoom, deleteRoom, logoutUser, getShareUrl } = useAppContext();
  const { currentUser, rooms } = state;

  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle Logout
  async function handleLogout() {
    await logoutUser();
    router.push('/login');
  }

  // Create New Workspace
  function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const created = createRoom(newRoomName.trim());
    setNewRoomName('');
    setIsCreating(false);

    dispatch({ type: 'SET_ROOM_ID', roomId: created.id, sessionName: created.name });
    router.push(`/app?room=${encodeURIComponent(created.id)}`);
  }

  // Delete Workspace
  async function handleDelete(roomId: string) {
    if (!confirm('Are you sure you want to delete this workspace?')) return;
    await deleteRoom(roomId);
  }

  // Copy share link
  function copyShareLink(room: BoardRoom) {
    const link = getShareUrl(room.id);
    navigator.clipboard.writeText(link);
    setCopiedId(room.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openSessionCanvas(room: BoardRoom) {
    dispatch({ type: 'SET_ROOM_ID', roomId: room.id, sessionName: room.name });
    router.push(`/app?room=${encodeURIComponent(room.id)}`);
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col">
      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center transition-colors group-hover:border-neutral-300">
              <svg
                className="w-3 h-3 fill-black"
                viewBox="0 0 76 65"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">
              loopx
            </span>
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-xs font-mono text-neutral-500">
            Workspaces Dashboard
          </span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-neutral-200 bg-white text-xs text-neutral-700">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-neutral-100 text-[9px] font-mono text-neutral-800 flex items-center justify-center border border-neutral-200">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-neutral-900 font-medium">{currentUser.name}</span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
              {currentUser.isLoggedIn ? 'Auth' : 'Guest'}
            </span>
          </div>

          {currentUser.isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 text-neutral-600 hover:text-black text-xs font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Section */}
        <div className="border border-neutral-200/90 bg-white rounded-2xl p-6 text-neutral-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Collaborative Node Engine
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
              Campaign Workspaces
            </h1>
            <p className="text-xs text-neutral-600 leading-relaxed font-normal font-sans">
              Each workspace provides an infinite dot-canvas with visual workflow nodes, live CometChat iterations, and multiplayer live cursor sync.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Create Session Inline Form */}
        {isCreating && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xl animate-fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-neutral-600" />
                <span>Create New Workspace</span>
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-xs text-neutral-400 hover:text-black p-1"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Q4 Performance Creative Refresh"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-sans"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>Create & Open Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Total Workspaces
            </span>
            <p className="text-2xl font-serif text-neutral-950">{rooms.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Multiplayer Sync
            </span>
            <p className="text-sm font-semibold text-neutral-900 pt-1">Excalidraw Live Cursors</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Realtime Engine
            </span>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </p>
          </div>
        </div>

        {/* ── Workspaces Grid ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-700 flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-500" />
              <span>All Workspaces ({rooms.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium">
                      Workspace
                    </span>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="text-neutral-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Delete Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-black transition-colors line-clamp-1">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>ID: {room.id.substring(0, 16)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                  <button
                    onClick={() => openSessionCanvas(room)}
                    className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Zap className="w-3 h-3 text-white" />
                    <span>Open Canvas</span>
                  </button>

                  <button
                    onClick={() => copyShareLink(room)}
                    className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all flex items-center gap-1 active:scale-95"
                    title="Copy Shareable Link"
                  >
                    {copiedId === room.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 text-[11px] font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[11px]">Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
