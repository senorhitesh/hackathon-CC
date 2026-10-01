'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Plus,
  Pin,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Hand,
  RotateCcw,
  Move,
} from 'lucide-react';
import type { BoardPost } from '@repo/types';

export function CanvasWorkspace() {
  const { state, dispatch, addAnnotation } = useAppContext();
  const { posts, activePostId, pinModeActive, annotations, currentUser } = state;

  // Viewport Pan & Zoom State (Excalidraw style)
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Post Drag State
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pin annotation state
  const [commentText, setCommentText] = useState('');
  const [pendingPin, setPendingPin] = useState<{ postId: string; x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activePost = posts.find((p) => p.id === activePostId) ?? posts[0];

  // Track spacebar for panning
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pan Canvas Mouse Events
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Pan if middle mouse button, spacebar held, or clicking empty background
    if (e.button === 1 || isSpacePressed || (e.target as HTMLElement).classList.contains('dot-canvas')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingPostId) {
      const post = posts.find((p) => p.id === draggingPostId);
      if (post && containerRef.current) {
        const newX = (e.clientX - dragOffset.x - panOffset.x) / (zoom / 100);
        const newY = (e.clientY - dragOffset.y - panOffset.y) / (zoom / 100);
        dispatch({
          type: 'UPDATE_POST_POSITION',
          postId: draggingPostId,
          x: Math.round(newX),
          y: Math.round(newY),
        });
      }
    }
  }

  function handleMouseUp() {
    setIsPanning(false);
    setDraggingPostId(null);
  }

  // Start dragging a Post card
  function handlePostMouseDown(e: React.MouseEvent<HTMLDivElement>, post: BoardPost) {
    if (pinModeActive || isSpacePressed) return;

    e.stopPropagation();
    dispatch({ type: 'SELECT_POST', postId: post.id });

    const cardRect = e.currentTarget.getBoundingClientRect();
    setDraggingPostId(post.id);
    setDragOffset({
      x: e.clientX - cardRect.left,
      y: e.clientY - cardRect.top,
    });
  }

  function handlePostImageClick(e: React.MouseEvent<HTMLDivElement>, post: BoardPost) {
    if (!pinModeActive) return;

    e.stopPropagation();
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
    <main
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 relative bg-slate-50 dot-canvas overflow-hidden flex flex-col items-center justify-start select-none ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* Floating Canvas Controls Header (Image 3 style) */}
      <div className="absolute top-3 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl px-4 py-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Post</span>
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* Pin Feedback Toggle */}
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

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1 rounded-lg hover:bg-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="p-1 rounded-lg hover:bg-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(100);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1 rounded-lg hover:bg-slate-100 ml-1 text-slate-600"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pannable & Zoomable Excalidraw Canvas Area */}
      <div
        className="w-full h-full relative transform-gpu transition-transform duration-75"
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom / 100})`,
          transformOrigin: '0 0',
        }}
      >
        {posts.length === 0 ? (
          /* Empty State */
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-3xl text-center shadow-lg w-96">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Posts On Canvas</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
              Click Create Post to add draggable ad posts to your Excalidraw-style canvas
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
          posts.map((post, idx) => {
            const isSelected = post.id === activePostId;
            // Calculate absolute x/y layout position on Excalidraw canvas
            const posX = post.x ?? (idx % 2 === 0 ? 80 : 540);
            const posY = post.y ?? (Math.floor(idx / 2) * 480 + 80);

            return (
              <div
                key={post.id}
                onMouseDown={(e) => handlePostMouseDown(e, post)}
                className={`absolute w-[420px] rounded-2xl bg-white border transition-shadow duration-150 shadow-xl overflow-hidden cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'border-indigo-600 ring-4 ring-indigo-500/15 shadow-2xl z-20'
                    : 'border-slate-200 hover:border-slate-300 z-10'
                }`}
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                }}
              >
                {/* Header Move Handle Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-2">
                    <Move className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                        {post.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {post.createdByName}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(post.status)}
                </div>

                {/* Post Image Container */}
                <div
                  onClick={(e) => handlePostImageClick(e, post)}
                  className="relative w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Pin Annotations Overlay */}
                  {annotations.map((pin, pIdx) => (
                    <div
                      key={pin.id}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{
                        left: `${pin.normalizedX * 100}%`,
                        top: `${pin.normalizedY * 100}%`,
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                        {pIdx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Pending Pin Placement */}
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
                        Add Pin Comment
                      </span>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Type feedback comment..."
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
                          Save
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
