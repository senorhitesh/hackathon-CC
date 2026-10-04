'use client';

import React, { useState, useEffect } from 'react';
import type { BoardPost } from '@repo/types';
import { useAppContext } from '../context/AppContext';
import { useCometChatContext } from '../app/page';

interface ABCompareModalProps {
  postA: BoardPost;
  postB: BoardPost;
  onClose: () => void;
}

interface Vote {
  uid: string;
  name: string;
  choice: 'A' | 'B';
  timestamp: number;
}

const STORAGE_KEY = (roomId: string, aId: string, bId: string) =>
  `loopx_abvote_${roomId}_${[aId, bId].sort().join('_')}`;

export function ABCompareModal({ postA, postB, onClose }: ABCompareModalProps) {
  const { state } = useAppContext();
  const { sendMessage } = useCometChatContext();
  const { currentUser, roomId } = state;

  const storageKey = STORAGE_KEY(roomId, postA.id, postB.id);

  const [votes, setVotes] = useState<Vote[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  const [myVote, setMyVote] = useState<'A' | 'B' | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved: Vote[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return saved.find((v) => v.uid === currentUser.uid)?.choice ?? null;
    } catch { return null; }
  });
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const totalVotes = votes.length;
  const votesA = votes.filter((v) => v.choice === 'A').length;
  const votesB = votes.filter((v) => v.choice === 'B').length;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 0;
  const pctB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 0;

  // Broadcast & listen for votes via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(`loopx_abvotes_${roomId}`);
    bc.onmessage = (e) => {
      if (e.data?.type === 'AB_VOTE') {
        setVotes((prev) => {
          const next = prev.filter((v) => v.uid !== e.data.vote.uid);
          next.push(e.data.vote);
          localStorage.setItem(storageKey, JSON.stringify(next));
          return next;
        });
      }
    };
    return () => bc.close();
  }, [roomId, storageKey]);

  function castVote(choice: 'A' | 'B') {
    const vote: Vote = { uid: currentUser.uid, name: currentUser.name, choice, timestamp: Date.now() };
    const next = votes.filter((v) => v.uid !== currentUser.uid);
    next.push(vote);
    setVotes(next);
    setMyVote(choice);
    localStorage.setItem(storageKey, JSON.stringify(next));

    // Broadcast to collaborators
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`loopx_abvotes_${roomId}`);
      bc.postMessage({ type: 'AB_VOTE', vote });
      bc.close();
    }

    // If first vote, notify chat
    if (!myVote) {
      sendMessage(
        `🗳️ A/B Vote cast!\n${currentUser.name} voted for **Creative ${choice}** ("${choice === 'A' ? postA.title : postB.title}")\n\nCurrent tally: A=${next.filter((v) => v.choice === 'A').length} | B=${next.filter((v) => v.choice === 'B').length}`,
        postA.id
      ).catch(() => {});
    }
  }

  function handleSliderMouseDown(e: React.MouseEvent) {
    setIsDraggingSlider(true);
    e.preventDefault();
  }

  function handleSliderMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingSlider) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
  }

  function PostCard({ post, label }: { post: BoardPost; label: 'A' | 'B' }) {
    const voteCount = label === 'A' ? votesA : votesB;
    const pct = label === 'A' ? pctA : pctB;
    const isWinner = totalVotes > 0 && (label === 'A' ? votesA >= votesB : votesB > votesA);
    const isMyVote = myVote === label;

    return (
      <div className={`flex flex-col gap-2 flex-1 ${label === 'B' ? 'items-end' : 'items-start'}`}>
        {/* Label */}
        <div className="flex items-center gap-2">
          {isWinner && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">👑 Leading</span>}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
            isMyVote ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
          }`}>
            Creative {label}
          </span>
        </div>

        {/* Card */}
        <div className={`w-full rounded-2xl overflow-hidden border-2 transition-all ${
          isMyVote ? 'border-neutral-900 shadow-2xl' : 'border-neutral-200 hover:border-neutral-400'
        } bg-white`}>
          {/* Preview */}
          <div className="relative">
            {post.mediaUrl ? (
              <img src={post.mediaUrl} alt={post.title} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col items-center justify-center p-4 text-center">
                <p className="text-xs font-semibold text-neutral-700 leading-snug">{post.title}</p>
                {post.description && (
                  <p className="text-[10px] text-neutral-500 mt-1 line-clamp-3">{post.description}</p>
                )}
              </div>
            )}
            {/* Platform badge */}
            <div className="absolute top-2 left-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/70 text-white font-mono">
                {post.preset.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Card info */}
          <div className="p-2.5 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-900 truncate">{post.title}</p>
            {post.description && (
              <p className="text-[10px] text-neutral-500 truncate mt-0.5">{post.description}</p>
            )}
          </div>
        </div>

        {/* Vote bar */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-neutral-600">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
            <span className="font-bold text-neutral-900">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isWinner ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Vote button */}
        <button
          onClick={() => castVote(label)}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            isMyVote
              ? 'bg-neutral-900 text-white shadow-lg'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
          }`}
        >
          {isMyVote ? '✓ My Vote' : `Vote for Creative ${label}`}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm">
              ⚔️
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">A/B Creative Comparison</h3>
              <p className="text-[10px] text-neutral-500 font-mono">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {Object.keys(state.collaborators).length + 1} collaborator{Object.keys(state.collaborators).length !== 0 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'side-by-side' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'slider' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Slider
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          {viewMode === 'side-by-side' ? (
            <div className="flex gap-4">
              <PostCard post={postA} label="A" />
              <div className="flex items-center justify-center shrink-0">
                <span className="text-lg font-black text-neutral-300">VS</span>
              </div>
              <PostCard post={postB} label="B" />
            </div>
          ) : (
            /* Slider comparison */
            <div className="space-y-4">
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden border border-neutral-200 cursor-col-resize select-none"
                onMouseMove={handleSliderMouseMove}
                onMouseUp={() => setIsDraggingSlider(false)}
                onMouseLeave={() => setIsDraggingSlider(false)}
              >
                {/* Post B (background) */}
                {postB.mediaUrl ? (
                  <img src={postB.mediaUrl} alt={postB.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <p className="text-sm font-semibold text-neutral-700 px-4 text-center">{postB.title}</p>
                  </div>
                )}

                {/* Post A (clipped) */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  {postA.mediaUrl ? (
                    <img src={postA.mediaUrl} alt={postA.title} className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <p className="text-sm font-semibold text-neutral-700 px-4 text-center">{postA.title}</p>
                    </div>
                  )}
                </div>

                {/* Slider divider */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                  onMouseDown={handleSliderMouseDown}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-2xl flex items-center justify-center text-neutral-900 font-bold text-xs cursor-col-resize border border-neutral-200">
                    ⇔
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-600/90 text-white">A</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600/90 text-white">B</span>
                </div>
              </div>

              {/* Vote buttons in slider mode */}
              <div className="grid grid-cols-2 gap-3">
                {(['A', 'B'] as const).map((label) => {
                  const voteCount = label === 'A' ? votesA : votesB;
                  const pct = label === 'A' ? pctA : pctB;
                  const isMyVote = myVote === label;
                  const post = label === 'A' ? postA : postB;
                  return (
                    <button
                      key={label}
                      onClick={() => castVote(label)}
                      className={`p-3 rounded-xl text-left transition-all border active:scale-95 ${
                        isMyVote ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <p className="text-xs font-bold">{isMyVote ? '✓ ' : ''}Creative {label}</p>
                      <p className={`text-[10px] truncate mt-0.5 ${isMyVote ? 'text-white/70' : 'text-neutral-500'}`}>{post.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono">{voteCount} votes</span>
                        <span className="text-[10px] font-bold">{pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voters list */}
          {votes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Votes Cast</p>
              <div className="flex flex-wrap gap-1.5">
                {votes.map((v) => (
                  <span key={v.uid} className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                    v.choice === 'A' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {v.name} → {v.choice}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
