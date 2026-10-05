'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Plus,
  Pin,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Send,
  Trash2,
  X,
  Play,
  Zap,
  MoreHorizontal,
  Heart,
  Repeat,
  Share2,
  Bookmark,
  ThumbsUp,
  Volume2,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Camera,
  LayoutGrid,
  Sparkles,
  Hand,
  FullScreen,
} from './icons/Hugeicons';
import type { BoardPost } from '@repo/types';
import type { ChatMessage } from '../context/AppContext';
import { useCometChatContext } from '../app/page';
import { PinAnnotationOverlay } from './PinAnnotationOverlay';
import { AIAuditPanel } from './AIAuditPanel';
import { ABCompareModal } from './ABCompareModal';
import { VoiceMemoPlayer } from './VoiceMemoRecorder';

export function CanvasWorkspace() {
  const {
    state,
    dispatch,
    deletePost,
    updatePostPosition,
    updatePostStatus,
    togglePostHighlight,
    broadcastCursor,
  } = useAppContext();
  const { sendMessage } = useCometChatContext();

  const { posts, activePostId, currentUser, collaborators, chatMessages, customAliases } = state;

  // Viewport Pan & Zoom State (Canvas zoom, NOT the page)
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isHandMode, setIsHandMode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Dragging Node State
  const [draggingTarget, setDraggingTarget] = useState<{ id: string; type: 'post' | 'chat' } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Open Chat Nodes State
  const [openChatNodes, setOpenChatNodes] = useState<Record<string, boolean>>({});
  const [chatNodePositions, setChatNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Chat Node inputs
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});

  // ── Feature 1: Per-post pin annotation mode ───────────────────────────────
  const [activePinPostId, setActivePinPostId] = useState<string | null>(null);

  // ── Feature 3: AI Audit panel ─────────────────────────────────────────────
  const [auditPostId, setAuditPostId] = useState<string | null>(null);

  // ── Feature 4: A/B Compare modal ─────────────────────────────────────────
  const [abCompare, setAbCompare] = useState<{ postA: BoardPost; postB: BoardPost } | null>(null);
  const [abSelectMode, setAbSelectMode] = useState<{ firstPostId: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activePost = posts.find((p) => p.id === activePostId) ?? posts[0];

  // Auto-connect all posts to CometChat iteration nodes on load and sync
  useEffect(() => {

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`loopx_open_nodes_${state.roomId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOpenChatNodes((prev) => ({ ...parsed, ...prev }));
        } catch (_) {}
      }
    }
  }, [state.roomId]);

  useEffect(() => {
    if (posts.length > 0) {
      setOpenChatNodes((prev) => {
        let changed = false;
        const next = { ...prev };
        posts.forEach((p) => {
          if (next[p.id] === undefined) {
            next[p.id] = true;
            changed = true;
          }
        });
        if (changed && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`loopx_open_nodes_${state.roomId}`, JSON.stringify(next));
          } catch (_) {}
        }
        return changed ? next : prev;
      });
    }
  }, [posts, state.roomId]);

  // Real-time synchronization of open chat nodes and positions across collaborator tabs
  useEffect(() => {
    const handleSyncPayload = (payload: any) => {
      if (!payload || payload.senderUid === currentUser.uid) return;
      if (payload.type === 'canvas_sync') {
        if (payload.event === 'CHAT_NODE_TOGGLED') {
          setOpenChatNodes((prev) => ({
            ...prev,
            [payload.postId]: payload.isOpen,
          }));
        } else if (payload.event === 'CHAT_NODE_MOVED') {
          setChatNodePositions((prev) => ({
            ...prev,
            [payload.postId]: { x: payload.x, y: payload.y },
          }));
        }
      }
    };

    // Cross-browser CometChat sync event listener
    const handleRemoteEvent = (e: Event) => {
      handleSyncPayload((e as CustomEvent).detail);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('loopx_canvas_sync', handleRemoteEvent);
    }

    // Same-origin BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(`canvas_collab_${state.roomId}`);
      channel.onmessage = (event) => {
        handleSyncPayload(event.data);
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('loopx_canvas_sync', handleRemoteEvent);
      }
      if (channel) {
        channel.close();
      }
    };
  }, [state.roomId, currentUser.uid]);

  // ── Keyboard Shortcuts: Ctrl+ / Ctrl- to maximize/minimize canvas (NOT page) ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      }

      // Intercept Ctrl/Cmd + and Ctrl/Cmd - to zoom canvas, NOT browser page!
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          e.stopPropagation();
          setZoom((z) => Math.min(300, z + 10));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          e.stopPropagation();
          setZoom((z) => Math.max(25, z - 10));
        } else if (e.key === '0') {
          e.preventDefault();
          e.stopPropagation();
          setZoom(100);
          setPanOffset({ x: 0, y: 0 });
        }
      }

      // Maximize Canvas toggle shortcut: Shift+F or Ctrl+M
      if (
        (e.shiftKey && e.key.toLowerCase() === 'f') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm')
      ) {
        e.preventDefault();
        setIsMaximized((prev) => !prev);
      }

      // Aura Glow Highlight toggle shortcut: H
      if (e.key === 'h' || e.key === 'H') {
        if (activePost) {
          e.preventDefault();
          togglePostHighlight(activePost.id);
        }
      }

      // Hand tool shortcuts: P toggles hand mode, Escape or V resets to selection mode
      if (e.key === 'Escape' || e.key.toLowerCase() === 'v') {
        setIsHandMode(false);
      } else if (e.key.toLowerCase() === 'p') {
        setIsHandMode((prev) => !prev);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Intercept Wheel with Ctrl/Cmd to zoom canvas instead of page zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 10 : -10;
        setZoom((z) => Math.min(300, Math.max(25, z + delta)));
      } else if (e.shiftKey) {
        setPanOffset((p) => ({ ...p, x: p.x - e.deltaY }));
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // CometChat Real-time is handled by useCometChat hook in the parent

  // Pan Canvas Events
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 1 || isSpacePressed || isHandMode || (e.target as HTMLElement).classList.contains('dot-canvas')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    // Broadcast live cursor to collaborators
    const scale = zoom / 100;
    const canvasX = Math.round((e.clientX - panOffset.x) / scale);
    const canvasY = Math.round((e.clientY - panOffset.y) / scale);
    broadcastCursor(canvasX, canvasY);

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingTarget) {
      const newX = Math.round((e.clientX - dragOffset.x - panOffset.x) / scale);
      const newY = Math.round((e.clientY - dragOffset.y - panOffset.y) / scale);

      if (draggingTarget.type === 'post') {
        updatePostPosition(draggingTarget.id, newX, newY);
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
    if (draggingTarget && draggingTarget.type === 'chat') {
      const pos = chatNodePositions[draggingTarget.id];
      if (pos) {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(`canvas_collab_${state.roomId}`);
          bc.postMessage({
            type: 'canvas_sync',
            event: 'CHAT_NODE_MOVED',
            senderUid: currentUser.uid,
            postId: draggingTarget.id,
            x: pos.x,
            y: pos.y,
          });
          bc.close();
        }
        import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
          sendCollabSyncMessage(state.roomId, {
            type: 'canvas_sync',
            event: 'CHAT_NODE_MOVED',
            senderUid: currentUser.uid,
            postId: draggingTarget.id,
            x: pos.x,
            y: pos.y,
          }).catch(() => {});
        }).catch(() => {});
      }
    }
    setDraggingTarget(null);
  }

  function startDrag(e: React.MouseEvent<HTMLDivElement>, id: string, type: 'post' | 'chat') {
    if (isSpacePressed || isHandMode) return;
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

  function toggleStartConvo(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    dispatch({ type: 'SELECT_POST', postId });
    const newState = !openChatNodes[postId];
    setOpenChatNodes((prev) => {
      const next = { ...prev, [postId]: newState };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`loopx_open_nodes_${state.roomId}`, JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`canvas_collab_${state.roomId}`);
      bc.postMessage({
        type: 'canvas_sync',
        event: 'CHAT_NODE_TOGGLED',
        senderUid: currentUser.uid,
        postId,
        isOpen: newState,
      });
      bc.close();
    }
    import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
      sendCollabSyncMessage(state.roomId, {
        type: 'canvas_sync',
        event: 'CHAT_NODE_TOGGLED',
        senderUid: currentUser.uid,
        postId,
        isOpen: newState,
      }).catch(() => {});
    }).catch(() => {});
  }



  function handleSendMessage(e: React.FormEvent, postId: string) {
    e.preventDefault();
    const text = inputTexts[postId]?.trim();
    if (!text) return;

    sendMessage(text, postId);
    setInputTexts((prev) => ({ ...prev, [postId]: '' }));
  }

  function getStatusBadge(status: BoardPost['status']) {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Changes
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            In Review
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
            Draft
          </span>
        );
    }
  }

  function getNodeCategoryBadge(status: BoardPost['status']) {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>✓ Approved Output</span>
          </div>
        );
      case 'CHANGES_REQUESTED':
        return (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-medium shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>⚡ Changes Requested</span>
          </div>
        );
      case 'IN_REVIEW':
        return (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-800 text-[11px] font-medium shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>💬 Peer Review</span>
          </div>
        );
      default:
        return (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-medium shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>✦ Creative Asset</span>
          </div>
        );
    }
  }

  function renderSocialMediaCard(post: BoardPost) {
    switch (post.preset) {
      case 'X_BANNER':
        return (
          <div className="bg-white text-neutral-900 font-sans p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                  LX
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-neutral-900">LoopX Studio</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">@loopx_studio</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            <p className="text-xs text-neutral-800 leading-relaxed font-normal">
              {post.description || post.title || "Deploying our latest creative campaign iteration. Review live on the infinite creative canvas."}
            </p>

            {post.mediaUrl ? (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full aspect-video rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 cursor-pointer"
              >
                <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />
              </div>
            ) : (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full p-4 rounded-lg bg-neutral-50 border border-neutral-100 cursor-pointer min-h-[60px]"
              >
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                  Text Post Canvas
                </span>
                <p className="text-xs text-neutral-700">{post.description || post.title}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-neutral-500 text-[11px] pt-1 border-t border-neutral-100">
              <span className="flex items-center gap-1 hover:text-black"><MessageSquare className="w-3.5 h-3.5" /> 24</span>
              <span className="flex items-center gap-1 hover:text-black"><Repeat className="w-3.5 h-3.5" /> 42</span>
              <span className="flex items-center gap-1 hover:text-black"><Heart className="w-3.5 h-3.5" /> 189</span>
              <Bookmark className="w-3.5 h-3.5 hover:text-black" />
            </div>
          </div>
        );

      case 'REELS_STORY':
        return (
          <div className="relative w-full aspect-[9/16] bg-neutral-900 text-white rounded-lg overflow-hidden flex flex-col justify-between p-4 border border-neutral-200 shadow-inner">
            <div
              onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
              className="absolute inset-0 z-0 cursor-pointer"
            >
              {post.mediaUrl ? (
                <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-6 text-center">
                  <p className="text-sm font-medium text-neutral-200 leading-relaxed font-sans">
                    {post.description || post.title}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
            </div>

            <div className="relative z-10 space-y-2 pointer-events-none">
              <div className="w-full h-0.5 bg-white/40 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-white rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold">LX</div>
                  <span className="text-xs font-semibold text-white">loopx</span>
                  <span className="text-[10px] text-white/70 font-mono">12m</span>
                </div>
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="relative z-10 flex items-end justify-between pointer-events-none">
              <div className="space-y-1 max-w-[200px]">
                <p className="text-xs font-medium text-white leading-snug">
                  {post.description || post.title}
                </p>
                <span className="text-[10px] text-white/80 font-mono">LoopX Audio</span>
              </div>
              <div className="flex flex-col items-center gap-3 text-white">
                <Heart className="w-5 h-5 fill-white/20" />
                <MessageSquare className="w-5 h-5" />
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        );

      case 'LINKEDIN_POST':
        return (
          <div className="bg-white text-neutral-900 font-sans p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center">
                  LX
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-neutral-900">LoopX Workspace</h4>
                  <p className="text-[10px] text-neutral-500 font-mono">Campaign iteration • 2h</p>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              {post.description || post.title || "Excited to share this iteration with our team and clients."}
            </p>

            {post.mediaUrl ? (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full aspect-[1200/628] rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 cursor-pointer"
              >
                <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />
              </div>
            ) : (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full p-4 rounded-lg bg-neutral-50 border border-neutral-100 cursor-pointer"
              >
                <p className="text-xs text-neutral-600">{post.description || post.title}</p>
              </div>
            )}

            <div className="flex items-center justify-around text-neutral-500 text-[11px] pt-2 border-t border-neutral-100">
              <span className="flex items-center gap-1.5 hover:text-black cursor-pointer"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
              <span className="flex items-center gap-1.5 hover:text-black cursor-pointer"><MessageSquare className="w-3.5 h-3.5" /> Comment</span>
              <span className="flex items-center gap-1.5 hover:text-black cursor-pointer"><Repeat className="w-3.5 h-3.5" /> Repost</span>
              <span className="flex items-center gap-1.5 hover:text-black cursor-pointer"><Send className="w-3.5 h-3.5" /> Send</span>
            </div>
          </div>
        );

      default: // IG_SQUARE 1:1
        return (
          <div className="bg-white text-neutral-900 font-sans p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-[10px]">
                  LX
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-neutral-900">loopx_creative</span>
                    <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">✓</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Creative Ad #1</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            {post.mediaUrl ? (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full aspect-square rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 cursor-pointer"
              >
                <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover pointer-events-none" />
              </div>
            ) : (
              <div
                onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                className="relative w-full aspect-[4/3] rounded-lg bg-neutral-50 border border-neutral-200 p-4 flex flex-col justify-center items-center text-center cursor-pointer"
              >
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                  Text Post
                </span>
                <p className="text-sm font-medium text-neutral-900 leading-snug">
                  {post.description || post.title}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between text-neutral-600">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 hover:text-black cursor-pointer" />
                  <MessageSquare className="w-4 h-4 hover:text-black cursor-pointer" />
                  <Send className="w-4 h-4 hover:text-black cursor-pointer" />
                </div>
                <Bookmark className="w-4 h-4 hover:text-black cursor-pointer" />
              </div>
              <p className="text-[11px] text-neutral-700 leading-snug">
                <span className="font-semibold text-neutral-900 mr-1">loopx_creative</span>
                {post.description || post.title}
              </p>
            </div>
          </div>
        );
    }
  }

  const now = Date.now();
  const activeCollabCount = Object.values(collaborators).filter(
    (c) => c.uid !== currentUser.uid && now - (c.lastSeen || 0) < 6000 && !c.uid.toLowerCase().includes('7f2a') && !c.name?.toUpperCase().includes('7F2A')
  ).length;

  return (
    <>
    <main
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`flex-1 relative bg-neutral-50 dot-canvas overflow-hidden flex flex-col items-center justify-start select-none ${
        isPanning ? 'cursor-grabbing' : isHandMode || isSpacePressed ? 'cursor-grab' : ''
      } ${isMaximized ? 'fixed inset-0 z-50 w-screen h-screen' : ''}`}
      style={{
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* ── Top Status Pill (Multiplayer & Room indicator) ── */}
      {activeCollabCount > 0 && (
        <div className="absolute top-3 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-mono text-neutral-700 border border-neutral-200 shadow-xs animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-neutral-900">{activeCollabCount + 1} collaborators live</span>
        </div>
      )}

      {/* ── Bottom Floating Action Bar (Sleek Studio Dock) ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 glass-dock rounded-2xl px-2.5 py-1.5 text-neutral-800 animate-fade-in pointer-events-auto font-sans">
        {/* Moving Border Highlight Toggle */}
        <button
          onClick={() => activePost && togglePostHighlight(activePost.id)}
          disabled={!activePost}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            activePost?.isHighlighted
              ? 'bg-purple-600 text-white shadow-xs font-semibold'
              : 'hover:bg-neutral-100 text-neutral-700'
          }`}
          title="Toggle Moving Border Highlight (H)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px]">{activePost?.isHighlighted ? 'Highlighted' : 'Highlight'}</span>
          <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${activePost?.isHighlighted ? 'bg-white/20 text-white' : 'bg-neutral-100 border border-neutral-200 text-neutral-600'}`}>H</kbd>
        </button>

        <div className="w-[1px] h-4 bg-neutral-200/80 mx-0.5" />

        {/* Canvas Zoom Controls (Ctrl+ / Ctrl- / Ctrl 0) */}
        <button
          onClick={() => setZoom((z) => Math.max(25, z - 10))}
          className="w-7 h-7 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors"
          title="Zoom Out Canvas (Ctrl -)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            setZoom(100);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2 py-1 rounded-lg hover:bg-neutral-100 text-neutral-800 font-mono text-[11px] font-semibold tracking-tight transition-colors"
          title="Reset Zoom to 100% (Ctrl 0)"
        >
          {zoom}%
        </button>

        <button
          onClick={() => setZoom((z) => Math.min(300, z + 10))}
          className="w-7 h-7 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors"
          title="Zoom In Canvas (Ctrl +)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200/80 mx-0.5" />

        {/* Hand Tool / Pan Mode Toggle */}
        <button
          onClick={() => setIsHandMode((prev) => !prev)}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
            isHandMode
              ? 'bg-neutral-900 text-white shadow-xs font-semibold'
              : 'hover:bg-neutral-100 text-neutral-600 hover:text-black'
          }`}
          title={isHandMode ? 'Hand Tool Active (Click to switch to Select, or press Esc / V)' : 'Hand Tool / Pan Canvas (P or hold Space)'}
        >
          <Hand className={`w-3.5 h-3.5 ${isHandMode ? 'text-white' : 'text-neutral-600'}`} />
        </button>

        {/* Maximize Canvas Toggle */}
        <button
          onClick={() => setIsMaximized((prev) => !prev)}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
            isMaximized
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'hover:bg-neutral-100 text-neutral-600 hover:text-black'
          }`}
          title={isMaximized ? 'Exit Full Canvas (Shift+F)' : 'Expand Canvas (Shift+F)'}
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <FullScreen className="w-3.5 h-3.5 text-neutral-600" />}
        </button>
      </div>



      {/* ── VISUAL WORKFLOW CANVAS VIEWPORT ── */}
      <div
        className="absolute inset-0 w-full h-full transform-gpu transition-transform duration-75 pointer-events-auto"
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom / 100})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Multiplayer Collaborator Live Cursors (Excalidraw style) */}
        {Object.values(collaborators).map((collab) => {
          if (
            collab.uid === currentUser.uid ||
            now - (collab.lastSeen || 0) > 6000 ||
            collab.uid.toLowerCase().includes('7f2a') ||
            collab.name?.toUpperCase().includes('7F2A')
          ) return null;
          const cleanCollabUid = (collab.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
          const collabShortId = cleanCollabUid ? cleanCollabUid.slice(-4).toUpperCase() : 'USER';
          return (
            <div
              key={collab.uid}
              className="collaborator-cursor flex items-start gap-1"
              style={{
                transform: `translate3d(${collab.x}px, ${collab.y}px, 0)`,
              }}
            >
              <svg
                className="w-4 h-4 drop-shadow-md"
                viewBox="0 0 24 24"
                fill={collab.color || '#2563eb'}
                stroke="#ffffff"
                strokeWidth="1.5"
              >
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
              </svg>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-md tracking-tight font-sans border border-black/10"
                style={{ backgroundColor: collab.color || '#2563eb' }}
              >
                {customAliases?.[collab.uid] ||
                  ((collab.name && collab.name !== 'Collaborator' && collab.name !== 'owner' && collab.name !== 'client' && !collab.name.toUpperCase().includes('7F2A'))
                    ? collab.name
                    : `User #${collabShortId}`)}
              </span>
            </div>
          );
        })}

        {/* SVG Bezier Wires connecting Post Nodes to CometChat Iteration Nodes */}
        <svg className="absolute inset-0 w-[8000px] h-[8000px] pointer-events-none z-0 overflow-visible">
          {posts.map((post, idx) => {
            const isChatOpen = !!openChatNodes[post.id];
            if (!isChatOpen) return null;

            const postX = post.x ?? (idx % 2 === 0 ? 80 : 540);
            const postY = post.y ?? (Math.floor(idx / 2) * 520 + 80);

            const chatPos = chatNodePositions[post.id] ?? {
              x: postX + 440,
              y: postY,
            };

            const startX = postX + 380;
            const startY = postY + 180;
            const endX = chatPos.x;
            const endY = chatPos.y + 180;

            const dx = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            return (
              <g key={`wire_${post.id}`}>
                {/* Outer Glow Wire */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#a3a3a3"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="opacity-90"
                />

                {/* Animated Packet Moving along the Bezier Wire */}
                <circle r="4" fill="#000000" className="shadow-lg">
                  <animateMotion path={pathData} dur="1.8s" repeatCount="indefinite" />
                </circle>

                {/* Ports */}
                <circle cx={startX} cy={startY} r="5" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                <circle cx={endX} cy={endY} r="5" fill="#000000" stroke="#ffffff" strokeWidth="2" />
              </g>
            );
          })}
        </svg>

        {posts.length === 0 ? (
          /* Empty Workspace State */
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-8 bg-white border border-neutral-200 rounded-2xl text-center shadow-xl w-96 z-20 text-neutral-900">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3 text-neutral-900">
              <Zap className="w-5 h-5 text-neutral-800" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">No Creative Posts Yet</h3>
            <p className="text-xs text-neutral-500 max-w-xs mt-1 mb-4 leading-relaxed font-normal">
              Create a post to start annotation and iterate with live chat.
            </p>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
              className="py-2 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Post</span>
            </button>
          </div>
        ) : (
          posts.map((post, idx) => {
            const isChatOpen = !!openChatNodes[post.id];
            const isSelected = activePostId === post.id;
            const pMessages = chatMessages.filter((m) => m.postId === post.id);

            const postX = post.x ?? (idx % 2 === 0 ? 80 : 540);
            const postY = post.y ?? (Math.floor(idx / 2) * 520 + 80);

            const chatPos = chatNodePositions[post.id] ?? {
              x: postX + 440,
              y: postY,
            };

            return (
              <React.Fragment key={post.id}>
                {/* ── 1. POST NODE CARD ── */}
                <div
                  onMouseDown={(e) => startDrag(e, post.id, 'post')}
                  onClick={() => !isHandMode && dispatch({ type: 'SELECT_POST', postId: post.id })}
                  className="absolute z-10 cursor-grab active:cursor-grabbing flex flex-col"
                  style={{
                    left: `${postX}px`,
                    top: `${postY}px`,
                  }}
                >
                  {/* Category Pill Tag (Image 3 Style) */}
                  {getNodeCategoryBadge(post.status)}

                  {/* Moving Border Beam when highlighted */}
                  {post.isHighlighted && (
                    <div className="absolute -inset-[2px] rounded-[18px] overflow-hidden pointer-events-none z-0">
                      <div className="moving-border-beam" />
                    </div>
                  )}

                  <div
                    className={`w-[390px] rounded-2xl bg-white transition-all duration-300 overflow-hidden relative z-10 ${
                      post.isHighlighted
                        ? 'border border-transparent shadow-[0_6px_24px_-4px_rgba(147,51,234,0.22)]'
                        : isSelected
                          ? 'border border-neutral-900 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.18)] ring-1 ring-neutral-900'
                          : 'border border-neutral-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] hover:border-neutral-300 hover:shadow-[0_12px_32px_-6px_rgba(15,23,42,0.10)]'
                    }`}
                  >
                  {/* Node Header */}
                  <div className="p-3 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200/80 font-medium">
                        {post.preset.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-semibold text-neutral-900 truncate max-w-[140px]">
                        {post.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(post.status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePost(post.id);
                        }}
                        className="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Node Media Card Preview — with Pin Annotation Overlay */}
                  <div className="overflow-hidden bg-white relative">
                    {renderSocialMediaCard(post)}
                    {/* Feature 1: Pin Annotation Overlay */}
                    <PinAnnotationOverlay
                      postId={post.id}
                      cardWidth={390}
                      cardHeight={300}
                      pinModeActive={activePinPostId === post.id}
                      onExitPinMode={() => setActivePinPostId(null)}
                    />
                  </div>

                  {/* Node Action Footer */}
                  <div className="p-2.5 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* Highlight */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePostHighlight(post.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border ${
                          post.isHighlighted
                            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs font-semibold'
                            : 'text-neutral-600 hover:text-black hover:bg-neutral-100 border-transparent hover:border-neutral-200'
                        }`}
                        title={post.isHighlighted ? 'Remove Highlight' : 'Highlight'}
                      >
                        <Sparkles className={`w-3 h-3 ${post.isHighlighted ? 'text-purple-600' : 'text-neutral-500'}`} />
                      </button>

                      {/* Feature 1: Pin Mode toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePinPostId(activePinPostId === post.id ? null : post.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border ${
                          activePinPostId === post.id
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs font-semibold'
                            : 'text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50/60 border-transparent hover:border-indigo-200'
                        }`}
                        title="Drop Pin Annotation on Creative (P)"
                      >
                        <Pin className={`w-3 h-3 ${activePinPostId === post.id ? 'text-indigo-600' : ''}`} />
                        <span className="text-[10px]">{activePinPostId === post.id ? 'Pin Mode' : 'Pin'}</span>
                      </button>

                      {/* Feature 3: AI Audit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAuditPostId(auditPostId === post.id ? null : post.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border ${
                          auditPostId === post.id
                            ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-2xs font-semibold'
                            : 'text-neutral-600 hover:text-violet-600 hover:bg-violet-50/60 border-transparent hover:border-violet-200'
                        }`}
                        title="AI Creative Audit"
                      >
                        <span className="text-[11px]">🤖</span>
                        <span className="text-[10px]">Audit</span>
                      </button>

                      {/* Feature 4: A/B Compare — first click picks first post, second click opens modal */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!abSelectMode) {
                            setAbSelectMode({ firstPostId: post.id });
                          } else if (abSelectMode.firstPostId === post.id) {
                            setAbSelectMode(null);
                          } else {
                            const postA = posts.find((p) => p.id === abSelectMode.firstPostId);
                            if (postA) setAbCompare({ postA, postB: post });
                            setAbSelectMode(null);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border ${
                          abSelectMode?.firstPostId === post.id
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-semibold'
                            : abSelectMode && abSelectMode.firstPostId !== post.id
                            ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                            : 'text-neutral-600 hover:text-blue-600 hover:bg-blue-50/60 border-transparent hover:border-blue-200'
                        }`}
                        title={abSelectMode ? abSelectMode.firstPostId === post.id ? 'Cancel A/B selection' : 'Compare with this post' : 'Start A/B comparison'}
                      >
                        <span className="text-[10px]">⚔️</span>
                        <span className="text-[10px]">
                          {abSelectMode?.firstPostId === post.id ? 'A ✓' : abSelectMode ? 'vs B?' : 'A/B'}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => toggleStartConvo(e, post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isChatOpen
                          ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                          : 'bg-black hover:bg-neutral-800 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {isChatOpen ? (
                        <>
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Convo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feature 3: AI Audit Panel overlay */}
                  {auditPostId === post.id && (
                    <AIAuditPanel
                      post={post}
                      onClose={() => setAuditPostId(null)}
                    />
                  )}
                  </div>{/* END inner card */}
                </div>{/* END post node wrapper */}

                {/* ── 2. CONNECTED COMETCHAT ITERATION NODE ── */}
                {isChatOpen && (

                  <div
                    onMouseDown={(e) => startDrag(e, post.id, 'chat')}
                    className="absolute w-[360px] rounded-2xl bg-white border border-neutral-200/90 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.18)] overflow-hidden z-20 cursor-grab active:cursor-grabbing animate-fade-in text-neutral-900"
                    style={{
                      left: `${chatPos.x}px`,
                      top: `${chatPos.y}px`,
                    }}
                  >
                    {/* Node Header */}
                    <div className="p-3 border-b border-neutral-200/80 bg-neutral-50/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-2xs">
                          <MessageSquare className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                              Review Thread
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <h4 className="text-xs font-semibold text-neutral-900 truncate max-w-[150px]">
                            {post.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleStartConvo(e, post.id)}
                          className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                          title="Close Thread"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Status Picker Chips */}
                    <div className="p-2 border-b border-neutral-100 bg-neutral-50/40 flex items-center gap-1 overflow-x-auto">
                      {(['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => updatePostStatus(post.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase transition-all ${
                            post.status === st
                              ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                              : 'bg-white border border-neutral-200/80 text-neutral-600 hover:text-black hover:border-neutral-300'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Messages Body */}
                    <div className="p-3 h-64 overflow-y-auto space-y-2 bg-neutral-50/30 text-xs">
                      {pMessages.length === 0 ? (
                        <div className="text-center py-16 text-neutral-400 text-[11px] font-mono">
                          No messages yet. Send a message to iterate live.
                        </div>
                      ) : (
                        pMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              msg.senderRole === 'owner'
                                ? 'bg-white border-neutral-200/90 text-neutral-800 shadow-2xs'
                                : 'bg-neutral-100/80 border-neutral-200/80 text-neutral-900'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] mb-1 font-mono text-neutral-500">
                              <span className="font-semibold text-neutral-800">{msg.senderName}</span>
                              <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 border border-neutral-200/60 font-medium">
                                {msg.senderRole}
                              </span>
                            </div>
                            {msg.text && <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                            {msg.mediaUrl && msg.mediaType === 'audio' && (
                              <VoiceMemoPlayer
                                audioUrl={msg.mediaUrl}
                                durationSeconds={msg.audioDuration}
                                isMe={msg.senderUid === currentUser.uid}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={(e) => handleSendMessage(e, post.id)} className="p-2 border-t border-neutral-200/80 bg-white">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={inputTexts[post.id] || ''}
                          onChange={(e) => setInputTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Type feedback or copy note..."
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-neutral-200 bg-neutral-50/80 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white transition-all"
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 p-1 rounded-lg bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* A/B select mode hint banner */}
      {abSelectMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold shadow-xl border border-blue-500">
            <span>A/B Mode: Click A/B on another post card to compare</span>
            <button
              onClick={() => setAbSelectMode(null)}
              className="ml-2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>

      {/* Feature 4: A/B Compare Modal */}
      {abCompare && (
        <ABCompareModal
          postA={abCompare.postA}
          postB={abCompare.postB}
          onClose={() => setAbCompare(null)}
        />
      )}
    </>
  );
}

