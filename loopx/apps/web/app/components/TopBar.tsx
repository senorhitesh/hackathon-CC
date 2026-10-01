'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  ChevronDown,
  Share2,
  User,
  ShieldCheck,
  Plus,
  Check,
  LayoutGrid,
} from 'lucide-react';

export function TopBar() {
  const { state, dispatch } = useAppContext();
  const { currentUser, roomId, sessionName, rooms } = state;
  const [copied, setCopied] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  const activeRoom = rooms.find((r) => r.id === roomId) ?? rooms[0];

  function handleShareClick() {
    const shareUrl = activeRoom?.shareUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}?room=${roomId}&role=client` : '');
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-40 flex-shrink-0 gap-3">
      {/* Left: Brand Logo + Dashboard Link + Board Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <a href="/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
          <img
            src="/loogx-logo&favicon.png"
            alt="loopx logo"
            className="w-7 h-7 object-contain rounded-md border border-slate-200 group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-sm text-slate-900 tracking-tight hidden sm:block">
            loopx
          </span>
        </a>

        <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

        {/* Dashboard Return Button */}
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-2xs"
          title="Return to Admin Sessions Dashboard"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Dashboard</span>
        </a>

        <div className="w-px h-5 bg-slate-200 flex-shrink-0 hidden md:block" />

        {/* Board Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBoardDropdownOpen(!boardDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
          >
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {sessionName || 'My Project / Board 1'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {boardDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Boards & Rooms
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
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
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
                className="w-full mt-1.5 pt-1.5 border-t border-slate-100 px-2.5 py-1.5 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create New Board</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center / Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Share Link Button */}
        <button
          onClick={handleShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm"
          title="Copy shareable client link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">Copied Link!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Share Link</span>
            </>
          )}
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {/* User Login & Role Badge */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isLoginOpen', value: true })}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs text-slate-800 font-medium"
        >
          {currentUser.role === 'owner' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <User className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="truncate max-w-[100px]">{currentUser.name}</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
            {currentUser.role}
          </span>
        </button>
      </div>
    </header>
  );
}
