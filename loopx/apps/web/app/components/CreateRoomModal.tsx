'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Copy, Check, Sparkles, X, Plus } from 'lucide-react';

export function CreateRoomModal() {
  const { state, dispatch, createRoom } = useAppContext();
  const [roomName, setRoomName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!state.isCreateRoomOpen) return null;

  const tempShareLink = typeof window !== 'undefined'
    ? `${window.location.origin}?room=${roomName ? roomName.toLowerCase().replace(/\s+/g, '-') : 'new-board'}&role=client`
    : `?room=new-board&role=client`;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const room = createRoom(roomName.trim() || 'My Project / Board 1');
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: false });
    setRoomName('');
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(tempShareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: false })}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace Initialization
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Create New Chat Room / Board
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Set up a collaborative board and invite your clients via shareable link
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Enter Chat room name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter Chat room name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. My Project / Board 1"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Sharable link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shareable Client Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tempShareLink}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600 truncate font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
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
          </div>

          {/* Create Room Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </form>
      </div>
    </div>
  );
}
