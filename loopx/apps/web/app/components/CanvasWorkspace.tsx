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
  RotateCcw,
  Move,
  Send,
  Bot,
  Zap,
  Heart,
  Repeat,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Volume2,
  BarChart2,
  Check,
} from 'lucide-react';
import type { BoardPost } from '@repo/types';

interface ChatMessage {
  id: string;
  postId: string;
  senderName: string;
  senderRole: 'owner' | 'client' | 'ai';
  text: string;
  timestamp: number;
}

import { supabase } from '../lib/supabaseClient';

export function CanvasWorkspace() {
  const { state, dispatch, addAnnotation, resolveAnnotation } = useAppContext();
  const { posts, activePostId, pinModeActive, annotations, currentUser } = state;

  // Viewport Pan & Zoom State (Excalidraw / n8n style)
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging Node State
  const [draggingTarget, setDraggingTarget] = useState<{ id: string; type: 'post' | 'chat' } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Chat Node positions map
  const [chatNodePositions, setChatNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Chat Node messages & input state per post (Empty by default — Supabase DB driven)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [nodeTabs, setNodeTabs] = useState<Record<string, 'chat' | 'ai' | 'pins'>>({});

  // Fetch messages from Supabase DB on mount
  useEffect(() => {
    async function loadDbMessages() {
      try {
        const { data: dbMsgs } = await supabase.from('messages').select('*');
        if (dbMsgs && dbMsgs.length > 0) {
          const formatted: ChatMessage[] = dbMsgs.map((m: any) => ({
            id: m.id,
            postId: m.post_id || m.postId,
            senderName: m.sender_name || m.senderName || 'Collaborator',
            senderRole: m.sender_role || m.senderRole || 'owner',
            text: m.text,
            timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
          }));
          setChatMessages(formatted);
        }
      } catch (_) {}
    }
    loadDbMessages();
  }, []);

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

  // Pan Canvas Events
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
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

    if (draggingTarget) {
      const newX = Math.round((e.clientX - dragOffset.x - panOffset.x) / (zoom / 100));
      const newY = Math.round((e.clientY - dragOffset.y - panOffset.y) / (zoom / 100));

      if (draggingTarget.type === 'post') {
        dispatch({
          type: 'UPDATE_POST_POSITION',
          postId: draggingTarget.id,
          x: newX,
          y: newY,
        });
      } else {
        setChatNodePositions((prev) => ({
          ...prev,
          [draggingTarget.id]: { x: newX, y: newY },
        }));
      }
    }
  }

  function handleMouseUp() {
    setIsPanning(false);
    setDraggingTarget(null);
  }

  // Node Drag Handlers
  function startDrag(e: React.MouseEvent<HTMLDivElement>, id: string, type: 'post' | 'chat') {
    if (pinModeActive || isSpacePressed) return;
    e.stopPropagation();

    if (type === 'post') {
      dispatch({ type: 'SELECT_POST', postId: id });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingTarget({ id, type });
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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

  // Send Message inside a Chat Node
  function handleSendMessage(e: React.FormEvent, postId: string) {
    e.preventDefault();
    const text = inputTexts[postId]?.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      postId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputTexts((prev) => ({ ...prev, [postId]: '' }));

    // Save message to Supabase DB
    (async () => {
      try {
        await supabase.from('messages').insert({
          id: newMsg.id,
          post_id: newMsg.postId,
          sender_name: newMsg.senderName,
          sender_role: newMsg.senderRole,
          text: newMsg.text,
        });
      } catch (_) {}
    })();

    // AI Agent automatic response trigger
    const tab = nodeTabs[postId] || 'chat';
    if (tab === 'ai' || text.toLowerCase().includes('ai') || text.toLowerCase().includes('copy')) {
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          postId,
          senderName: 'CometChat AI Agent',
          senderRole: 'ai',
          text: `✨ AI Ad Copy Suggestion for "${activePost?.title}":\n"Upgrade Your Campaign — 20% Off Limited Time!"`,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }, 800);
    }
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

  // ── Authentic Social Media UI Card Renderer ──
  function renderSocialMediaCard(post: BoardPost) {
    const postAnnotations = annotations;

    switch (post.preset) {
      /* ── X / TWITTER POST THREAD UI ── */
      case 'X_BANNER':
        return (
          <div className="bg-white text-slate-900 font-sans p-4 space-y-3">
            {/* X Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  KS
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900">Kargul Studio</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                  </div>
                  <span className="text-[10px] text-slate-500">@kargul_studio · 1h</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* X Post Copy */}
            <p className="text-xs text-slate-800 leading-relaxed font-normal">
              {post.description || "Excited to reveal our latest creative campaign iteration! What do you think of this visual layout? 👇 #loopx #creative"}
            </p>

            {/* 16:9 Image Media Card with Pin Annotations Overlay */}
            <div
              onClick={(e) => handlePostImageClick(e, post)}
              className="relative w-full aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer"
            >
              <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />

              {/* Pin Overlay */}
              {postAnnotations.map((pin, pIdx) => (
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
            </div>

            {/* X Actions Footer */}
            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1 hover:text-blue-500"><MessageSquare className="w-3.5 h-3.5" /> 18</span>
              <span className="flex items-center gap-1 hover:text-green-500"><Repeat className="w-3.5 h-3.5" /> 42</span>
              <span className="flex items-center gap-1 hover:text-rose-500"><Heart className="w-3.5 h-3.5" /> 128</span>
              <span className="flex items-center gap-1 hover:text-blue-500"><BarChart2 className="w-3.5 h-3.5" /> 3.2k</span>
              <Bookmark className="w-3.5 h-3.5 hover:text-blue-500" />
            </div>
          </div>
        );

      /* ── REELS / INSTAGRAM STORY 9:16 UI ── */
      case 'REELS_STORY':
        return (
          <div className="relative w-full aspect-[9/16] bg-slate-900 text-white rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between p-4">
            {/* Background Image */}
            <div
              onClick={(e) => handlePostImageClick(e, post)}
              className="absolute inset-0 z-0 cursor-pointer"
            >
              <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

              {/* Pin Overlay */}
              {postAnnotations.map((pin, pIdx) => (
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
            </div>

            {/* Story Top Bar */}
            <div className="relative z-10 space-y-2">
              <div className="w-full h-0.5 bg-white/40 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-white rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-pink-500 p-0.5 bg-slate-900">
                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold">KS</div>
                  </div>
                  <span className="text-xs font-bold text-white shadow-xs">kargul_studio</span>
                  <span className="text-[10px] text-white/70">12h</span>
                </div>
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Story Right Action Column & Caption */}
            <div className="relative z-10 flex items-end justify-between">
              <div className="space-y-1 max-w-[220px]">
                <p className="text-xs font-medium text-white shadow-xs leading-snug">
                  {post.description || post.title}
                </p>
                <span className="text-[10px] text-white/80 font-mono flex items-center gap-1">
                  🎵 Original Audio — Kargul Studio
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="flex flex-col items-center text-[10px] font-bold"><Heart className="w-5 h-5 fill-white/20" /> 4.2k</div>
                <div className="flex flex-col items-center text-[10px] font-bold"><MessageSquare className="w-5 h-5" /> 182</div>
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        );

      /* ── LINKEDIN POST UI ── */
      case 'LINKEDIN_POST':
        return (
          <div className="bg-white text-slate-900 font-sans p-4 space-y-3">
            {/* LinkedIn Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  AR
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Alex Rivera</h4>
                  <p className="text-[10px] text-slate-500">Creative Lead at Kargul Studio • 2h • 🌐</p>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* LinkedIn Copy */}
            <p className="text-xs text-slate-800 leading-relaxed">
              {post.description || "Proud to present our latest visual campaign iteration for our client partner! Let us know your thoughts in the feedback thread below. 🚀"}
            </p>

            {/* Media Image Banner */}
            <div
              onClick={(e) => handlePostImageClick(e, post)}
              className="relative w-full aspect-[1200/628] rounded-xl bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer"
            >
              <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />

              {/* Pin Overlay */}
              {postAnnotations.map((pin, pIdx) => (
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
            </div>

            {/* LinkedIn Actions Footer */}
            <div className="flex items-center justify-around text-slate-600 text-[11px] font-semibold pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer"><ThumbsUp className="w-4 h-4" /> Like</span>
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer"><MessageSquare className="w-4 h-4" /> Comment</span>
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer"><Repeat className="w-4 h-4" /> Repost</span>
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer"><Send className="w-4 h-4" /> Send</span>
            </div>
          </div>
        );

      /* ── INSTAGRAM SQUARE 1:1 UI (Default) ── */
      default:
        return (
          <div className="bg-white text-slate-900 font-sans">
            {/* IG Header */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[9px] font-bold text-slate-900">
                    KS
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900">kargul_studio</span>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* 1:1 Image */}
            <div
              onClick={(e) => handlePostImageClick(e, post)}
              className="relative w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer"
            >
              <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />

              {/* Pin Overlay */}
              {postAnnotations.map((pin, pIdx) => (
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
            </div>

            {/* IG Footer */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 hover:text-rose-500 cursor-pointer" />
                  <MessageSquare className="w-4 h-4 hover:text-blue-500 cursor-pointer" />
                  <Send className="w-4 h-4 hover:text-blue-500 cursor-pointer" />
                </div>
                <Bookmark className="w-4 h-4 hover:text-slate-900 cursor-pointer" />
              </div>
              <p className="text-[11px] text-slate-800 leading-snug">
                <strong className="text-slate-900 font-bold mr-1">kargul_studio</strong>
                {post.description || post.title}
              </p>
            </div>
          </div>
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
      {/* Floating Header Controls Bar */}
      <div className="absolute top-3 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl px-4 py-2">
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

        {/* Zoom Controls */}
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

      {/* ── n8n NODE GRAPH CANVAS AREA ── */}
      <div
        className="absolute inset-0 w-full h-full transform-gpu transition-transform duration-75 pointer-events-auto"
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom / 100})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* SVG Bezier Wires */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0 overflow-visible">
          {posts.map((post, idx) => {
            const postX = post.x ?? (idx % 2 === 0 ? 80 : 540);
            const postY = post.y ?? (Math.floor(idx / 2) * 520 + 80);

            const chatPos = chatNodePositions[post.id] ?? {
              x: postX + 460,
              y: postY,
            };

            const startX = postX + 400;
            const startY = postY + 180;
            const endX = chatPos.x;
            const endY = chatPos.y + 180;

            const dx = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            return (
              <g key={`wire_${post.id}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse opacity-80"
                />
                <circle cx={startX} cy={startY} r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                <circle cx={endX} cy={endY} r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })}
        </svg>

        {posts.length === 0 ? (
          /* Empty State */
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-3xl text-center shadow-lg w-96 z-20">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Post Nodes Created</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
              Click Create Post to start an n8n-style workflow node connected to a CometChat iteration node
            </p>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post Node</span>
            </button>
          </div>
        ) : (
          posts.map((post, idx) => {
            const isSelected = post.id === activePostId;
            const postX = post.x ?? (idx % 2 === 0 ? 80 : 540);
            const postY = post.y ?? (Math.floor(idx / 2) * 520 + 80);

            const chatPos = chatNodePositions[post.id] ?? {
              x: postX + 460,
              y: postY,
            };

            const pMessages = chatMessages.filter((m) => m.postId === post.id);
            const currentTab = nodeTabs[post.id] || 'chat';

            return (
              <React.Fragment key={post.id}>
                {/* ── 1. AUTHENTIC SOCIAL MEDIA POST NODE ── */}
                <div
                  onMouseDown={(e) => startDrag(e, post.id, 'post')}
                  className={`absolute w-[400px] rounded-2xl bg-white border transition-shadow duration-150 shadow-xl overflow-hidden cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'border-indigo-600 ring-4 ring-indigo-500/15 shadow-2xl z-20'
                      : 'border-slate-200 hover:border-slate-300 z-10'
                  }`}
                  style={{
                    left: `${postX}px`,
                    top: `${postY}px`,
                  }}
                >
                  {/* Handle Output Port */}
                  <div className="absolute right-0 top-[170px] translate-x-1/2 z-30 flex items-center gap-1 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-white">
                    <span>Chat Out</span>
                    <Zap className="w-2.5 h-2.5" />
                  </div>

                  {/* Node Header Handle */}
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2">
                      <Move className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                          {post.preset.replace('_', ' ')} POST
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(post.status)}
                  </div>

                  {/* Render Authentic Social Media UI */}
                  {renderSocialMediaCard(post)}

                  {/* Pending Pin Comment Floating Box */}
                  {pendingPin && pendingPin.postId === post.id && (
                    <div
                      className="absolute z-40 p-3 bg-white border border-slate-200 shadow-2xl rounded-2xl w-64 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                        Add Pin Comment
                      </span>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Type feedback..."
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

                {/* ── 2. CONNECTED COMETCHAT ITERATION NODE ── */}
                <div
                  onMouseDown={(e) => startDrag(e, post.id, 'chat')}
                  className="absolute w-[360px] rounded-2xl bg-white border border-indigo-200 shadow-2xl overflow-hidden z-20 cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${chatPos.x}px`,
                    top: `${chatPos.y}px`,
                  }}
                >
                  {/* Input Port Label */}
                  <div className="absolute left-0 top-[170px] -translate-x-1/2 z-30 flex items-center gap-1 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-white">
                    <Zap className="w-2.5 h-2.5" />
                    <span>In</span>
                  </div>

                  {/* Node Header */}
                  <div className="p-3 border-b border-indigo-100 bg-indigo-50/80 flex items-center justify-between cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                          COMETCHAT ITERATION NODE
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                          {post.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Status Picker Inside Node */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto">
                    {(['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => dispatch({ type: 'UPDATE_POST_STATUS', postId: post.id, status: st })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                          post.status === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Tab Switcher inside Node */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border-b border-slate-200 text-[11px]">
                    <button
                      onClick={() => setNodeTabs((prev) => ({ ...prev, [post.id]: 'chat' }))}
                      className={`flex items-center justify-center gap-1 py-1 font-semibold rounded-md transition-all ${
                        currentTab === 'chat'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-indigo-600" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => setNodeTabs((prev) => ({ ...prev, [post.id]: 'ai' }))}
                      className={`flex items-center justify-center gap-1 py-1 font-semibold rounded-md transition-all ${
                        currentTab === 'ai'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Bot className="w-3 h-3 text-purple-600" />
                      <span>AI Agent</span>
                    </button>
                    <button
                      onClick={() => setNodeTabs((prev) => ({ ...prev, [post.id]: 'pins' }))}
                      className={`flex items-center justify-center gap-1 py-1 font-semibold rounded-md transition-all ${
                        currentTab === 'pins'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Pin className="w-3 h-3 text-amber-600" />
                      <span>Pins</span>
                    </button>
                  </div>

                  {/* Node Message Body */}
                  <div className="p-3 h-52 overflow-y-auto space-y-2 bg-white text-xs">
                    {currentTab === 'pins' ? (
                      /* Pin List */
                      <div className="space-y-1.5">
                        {annotations.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-[11px]">
                            No pin feedback added. Click "Pin Feedback" to add pin comments.
                          </div>
                        ) : (
                          annotations.map((pin, pIdx) => (
                            <div key={pin.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-slate-800">#{pIdx + 1} {pin.authorName}</span>
                                <span className="text-[9px] font-bold text-indigo-600">{pin.status}</span>
                              </div>
                              <p className="text-slate-600">{pin.comment}</p>
                              {pin.status === 'OPEN' && (
                                <button
                                  onClick={() => resolveAnnotation(pin.id)}
                                  className="text-[9px] font-bold text-emerald-600 hover:underline mt-1 block"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      /* Live CometChat / AI Messages */
                      pMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2 rounded-xl border ${
                            msg.senderRole === 'ai'
                              ? 'bg-purple-50 border-purple-200 text-purple-950'
                              : msg.senderRole === 'owner'
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-indigo-50 border-indigo-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              {msg.senderRole === 'ai' && <Sparkles className="w-3 h-3 text-purple-600" />}
                              {msg.senderName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Node Message Input Form */}
                  <form onSubmit={(e) => handleSendMessage(e, post.id)} className="p-2 border-t border-slate-100 bg-slate-50">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={inputTexts[post.id] || ''}
                        onChange={(e) => setInputTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={currentTab === 'ai' ? 'Ask AI Agent for copy ideas...' : 'Type message to iterate...'}
                        className="w-full pl-2.5 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 p-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </main>
  );
}
