'use client';

import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Plus,
  Pin,
  Sparkles,
  Maximize2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { BoardPost } from '@repo/types';

export function CanvasWorkspace() {
  const { state, dispatch, addAnnotation } = useAppContext();
  const { posts, activePostId, pinModeActive, annotations, currentUser } = state;
  const [zoom, setZoom] = useState(100);
  const [commentText, setCommentText] = useState('');
  const [pendingPin, setPendingPin] = useState<{ postId: string; x: number; y: number } | null>(null);

  const activePost = posts.find((p) => p.id === activePostId) ?? posts[0];

  function handlePostClick(e: React.MouseEvent<HTMLDivElement>, post: BoardPost) {
    if (!pinModeActive) {
      dispatch({ type: 'SELECT_POST', postId: post.id });
      return;
    }

    // Handle Pin annotation placement
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setPendingPin({ postId: post.id, x, y });
  }

  function submitPinComment() {
    if (!pendingPin || !commentText.trim()) return;

    addAnnotation({
      preset: activePost?.preset ?? 'IG_SQUARE',
      normalizedX: pendingPin.x,
      normalizedY: pendingPin.y,
      authorId: currentUser.uid,
      authorName: currentUser.name,
      comment: commentText.trim(),
    });

    setPendingPin(null);
    setCommentText('');
    dispatch({ type: 'SET_PIN_MODE', active: false });
  }

  function getStatusBadge(status: BoardPost['status']) {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Changes Requested
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            In Review
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  }

  return (
    <main className="flex-1 relative bg-slate-50 dot-canvas overflow-auto flex flex-col items-center justify-start p-8 select-none">
      {/* Top Floating Control Toolbar (Image 3 style) */}
      <div className="sticky top-2 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl px-4 py-2 mb-6">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Post</span>
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* Pin Feedback Toggle Button */}
        <button
          onClick={() => dispatch({ type: 'SET_PIN_MODE', active: !pinModeActive })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            pinModeActive
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>{pinModeActive ? 'Click Image to Pin...' : 'Pin Feedback'}</span>
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Posts Canvas Gallery Grid */}
      <div
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 transition-transform duration-200"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        {posts.length === 0 ? (
          /* Empty State - Create Post Central Button */
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/80 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Creative Posts Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Click the Create Post button to upload custom media assets or pick from brand guidelines
            </p>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        ) : (
          posts.map((post) => {
            const isSelected = post.id === activePostId;
            return (
              <div
                key={post.id}
                onClick={(e) => handlePostClick(e, post)}
                className={`group relative rounded-2xl bg-white border transition-all duration-200 shadow-lg overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-xl'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Info */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {post.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      By {post.createdByName}
                    </span>
                  </div>
                  {getStatusBadge(post.status)}
                </div>

                {/* Media Container with Pin Annotations Overlay */}
                <div className="relative w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Render Numbered Pin Annotations */}
                  {annotations.map((pin, idx) => (
                    <div
                      key={pin.id}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{
                        left: `${pin.normalizedX * 100}%`,
                        top: `${pin.normalizedY * 100}%`,
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                        {idx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Pending Pin Placement Modal */}
                  {pendingPin && pendingPin.postId === post.id && (
                    <div
                      className="absolute z-40 p-3 bg-white border border-slate-200 shadow-2xl rounded-2xl w-64 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${pendingPin.x * 100}%`,
                        top: `${pendingPin.y * 100}%`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                        Add Pin Feedback
                      </span>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Type feedback for owner/client..."
                        autoFocus
                        rows={2}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <div className="flex items-center justify-end gap-1.5 mt-2">
                        <button
                          onClick={() => setPendingPin(null)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitPinComment}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 shadow-xs"
                        >
                          Save Pin
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-white">
                  <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                    {post.preset}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Iterate & Chat →</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
