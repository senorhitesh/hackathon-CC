'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Copy, Check, X, Plus } from './icons/Hugeicons';

export function CreateRoomModal() {
  const { state, dispatch, createRoom, getShareUrl } = useAppContext();
  const [roomName, setRoomName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!state.isCreateRoomOpen) return null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const room = createRoom(roomName.trim() || 'New Creative Workspace');
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: false });
    dispatch({ type: 'SET_ROOM_ID', roomId: room.id, sessionName: room.name });
    setRoomName('');
  }

  const previewLink = getShareUrl(roomName ? roomName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'new-workspace');

  function handleCopyPreview() {
    navigator.clipboard.writeText(previewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200/90 p-6 shadow-2xl relative text-neutral-900">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: false })}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Workspace Init
          </span>
          <h2 className="text-base font-semibold text-neutral-900 mt-0.5">
            Create Collaborative Workspace
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Spin up an infinite dot-canvas room with real-time multi-user sync
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Q4 Brand Refresh / Ad Variations"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1">
              Sharable Collaboration URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={previewLink}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-600 truncate font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyPreview}
                className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-800 transition-colors shrink-0 flex items-center gap-1 border border-neutral-200 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 font-mono">
              Anyone with this link can join directly to collaborate.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: false })}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
