'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import {
  Plus,
  Zap,
  Share2,
  Trash2,
  ShieldCheck,
  User,
  LogOut,
  LayoutGrid,
  Sparkles,
  Check,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  MessageSquare,
} from 'lucide-react';
import type { BoardRoom } from '@repo/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { state, dispatch, createRoom } = useAppContext();
  const { currentUser, rooms } = state;

  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check if Admin user is authenticated
  const isAdmin = currentUser.role === 'owner';

  // Handle Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem('loopx_user_session');
    dispatch({
      type: 'SET_USER',
      user: {
        uid: 'client_guest',
        name: 'Guest Reviewer',
        status: 'ONLINE',
        role: 'client',
      },
    });
    router.push('/login');
  }

  // Create New Campaign Session
  function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const created = createRoom(newRoomName.trim());
    setNewRoomName('');
    setIsCreating(false);

    // Immediately navigate to canvas for newly created session
    dispatch({ type: 'SET_ROOM_ID', roomId: created.id, sessionName: created.name });
    router.push(`/app?room=${created.id}`);
  }

  // Delete Session from Supabase DB & Local State
  async function handleDeleteSession(roomId: string) {
    if (!confirm('Are you sure you want to delete this campaign session?')) return;

    try {
      await supabase.from('rooms').delete().eq('id', roomId);
      dispatch({
        type: 'SET_ROOMS',
        rooms: rooms.filter((r) => r.id !== roomId),
      });
    } catch (_) {}
  }

  // Copy share link
  function copyShareLink(room: BoardRoom) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = room.shareUrl || `${origin}/app?room=${room.id}&role=client`;
    navigator.clipboard.writeText(link);
    setCopiedId(room.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Open Canvas for specific Session
  function openSessionCanvas(room: BoardRoom) {
    dispatch({ type: 'SET_ROOM_ID', roomId: room.id, sessionName: room.name });
    router.push(`/app?room=${room.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 flex flex-col">
      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/loogx-logo&favicon.png"
              alt="loopx logo"
              className="w-8 h-8 object-contain rounded-lg border border-slate-200"
            />
            <span className="font-black text-lg tracking-tight text-slate-900">
              loopx
            </span>
          </Link>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Admin Sessions Dashboard
          </span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            ) : (
              <User className="w-4 h-4 text-blue-600" />
            )}
            <span>{currentUser.name}</span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
              {currentUser.role}
            </span>
          </div>

          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all"
              title="Sign Out of Supabase"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Session Campaign Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Admin Campaign Sessions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Create and manage multiple creative ad campaign sessions. Each session has its own infinite n8n node workspace canvas & CometChat iteration node setup.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="z-10 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </button>
        </div>

        {/* Create Session Inline Modal / Form */}
        {isCreating && (
          <div className="bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Create New Campaign Session</span>
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Q4 Black Friday Instagram Ads Campaign"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
              >
                <span>Create & Open Node Canvas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Sessions Metrics Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Active Sessions
            </span>
            <p className="text-2xl font-black text-slate-900">{rooms.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Connected Node Canvases
            </span>
            <p className="text-2xl font-black text-indigo-600">{rooms.length} Canvases</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Client Guest Link Ready
            </span>
            <p className="text-2xl font-black text-emerald-600">Enabled</p>
          </div>
        </div>

        {/* ── Sessions List Grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-slate-600" />
              <span>All Campaign Sessions ({rooms.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Room Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      SESSION NODE CANVAS
                    </span>
                    <button
                      onClick={() => handleDeleteSession(room.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Owner: {room.ownerName || 'Studio Admin'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openSessionCanvas(room)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Open Canvas</span>
                  </button>

                  <button
                    onClick={() => copyShareLink(room)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                    title="Copy Shareable Client Link"
                  >
                    {copiedId === room.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="sr-only sm:not-sr-only text-[11px]">
                      {copiedId === room.id ? 'Copied' : 'Share'}
                    </span>
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
