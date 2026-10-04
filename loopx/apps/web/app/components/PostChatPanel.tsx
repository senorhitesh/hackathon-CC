'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useCometChatContext } from '../app/page';
import {
  ArrowUp,
  Sparkles,
  MessageSquare,
  User,
  CheckCircle2,
  Clock,
  Pin,
  Menu,
  Plus,
  Image as ImageIcon,
  Paperclip,
  Mic,
  X,
  Download,
  Upload,
  Hash,
  Layers,
} from './icons/Hugeicons';
import type { BoardPost } from '@repo/types';
import { VoiceMemoRecorder, VoiceMemoPlayer } from './VoiceMemoRecorder';

export function PostChatPanel() {
  const {
    state,
    dispatch,
    togglePostHighlight,
    clearChatMessages,
    updateUserName,
    setUserAlias,
    getEffectiveUserName,
  } = useAppContext();
  const { sendMessage } = useCometChatContext();
  const { posts, activePostId, annotations, currentUser, chatMessages, collaborators, customAliases } = state;
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'frame'>('frame');
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    previewUrl: string;
    name: string;
    type: 'image' | 'video' | 'file';
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Name editing states
  const [isEditingMyName, setIsEditingMyName] = useState(false);
  const [myNameInput, setMyNameInput] = useState('');
  const [renamingUid, setRenamingUid] = useState<string | null>(null);
  const [renamingInput, setRenamingInput] = useState('');

  // Selected frame post ID
  const selectedFramePostId = activePostId || (posts.length > 0 ? posts[0]?.id : null);
  const activePost = posts.find((p) => p.id === selectedFramePostId);

  // When activePostId changes (user selected a frame on canvas), auto-switch to frame mode
  const prevActivePostIdRef = useRef(activePostId);
  useEffect(() => {
    if (activePostId && activePostId !== prevActivePostIdRef.current) {
      setChatMode('frame');
    }
    prevActivePostIdRef.current = activePostId;
  }, [activePostId]);

  // Derive clean ID-based display name for current user
  const cleanMyUid = (currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
  const myShortId = cleanMyUid && !cleanMyUid.toLowerCase().includes('7f2a') && !cleanMyUid.toLowerCase().includes('init')
    ? cleanMyUid.slice(-4).toUpperCase()
    : 'USER';
  const myDisplayName = (currentUser.name && currentUser.name !== 'Collaborator' && currentUser.name !== 'owner' && currentUser.name !== 'client' && !currentUser.name.toUpperCase().includes('7F2A'))
    ? currentUser.name
    : `User #${myShortId}`;

  // Mode-based message streams
  const generalMessages = chatMessages.filter(
    (m) => m.postId === 'general' || m.postId === state.roomId || !m.postId
  );
  const frameMessages = selectedFramePostId
    ? chatMessages.filter((m) => m.postId === selectedFramePostId)
    : [];

  const postMessages = chatMode === 'general' ? generalMessages : frameMessages;
  const currentPostId = chatMode === 'general' ? 'general' : (selectedFramePostId || 'general');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [postMessages.length, chatMode]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    const mediaType: 'image' | 'video' | 'file' = isVideo ? 'video' : isImage ? 'image' : 'file';

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        file,
        previewUrl: reader.result as string,
        name: file.name,
        type: mediaType,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedMedia) || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(
        inputText.trim(),
        currentPostId || undefined,
        selectedMedia
          ? {
              file: selectedMedia.file,
              url: selectedMedia.previewUrl,
              name: selectedMedia.name,
              type: selectedMedia.type,
            }
          : undefined
      );
    } catch (err) {
      console.warn('[loopx] Send message failed:', err);
    }
    setInputText('');
    setSelectedMedia(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsSending(false);
  }

  async function handleQuickPrompt(text: string) {
    setIsSending(true);
    try {
      await sendMessage(text, currentPostId || undefined);
    } catch (err) {
      console.warn('[loopx] Quick prompt failed:', err);
    }
    setIsSending(false);
  }

  async function handleVoiceMemoReady(audioBlob: Blob, durationSeconds: number) {
    const audioUrl = URL.createObjectURL(audioBlob);
    setIsSending(true);
    try {
      await sendMessage('', currentPostId || undefined, {
        file: audioBlob,
        url: audioUrl,
        name: `voice-memo-${Date.now()}.webm`,
        type: 'audio',
        audioDuration: durationSeconds,
      });
    } catch (err) {
      console.warn('[loopx] Send voice memo failed:', err);
    }
    setIsSending(false);
    setIsRecordingVoice(false);
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-40 bg-neutral-900/95 hover:bg-black backdrop-blur-md border border-neutral-800 text-white rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-2 transition-all font-medium text-xs animate-fade-in hover:scale-105 active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
        <span className="font-semibold tracking-tight">
          {chatMode === 'general' ? '#general Chat' : (activePost ? activePost.title : 'Live Chat')}
        </span>
        {postMessages.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold flex items-center justify-center">
            {postMessages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="w-[340px] bg-white/95 backdrop-blur-md border-l border-neutral-200 flex flex-col h-[calc(100vh-48px)] flex-shrink-0 z-30 select-none shadow-xl transition-all font-sans">
      {/* ── Top Header ── */}
      <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize"
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 truncate max-w-[150px]">
              {chatMode === 'general'
                ? '#general · Studio Chat'
                : (activePost ? activePost.title : 'Live Discussion')}
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CometChat Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
            title="New Ad Creative"
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 via-amber-400 to-blue-500 shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-neutral-800">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Mode Switcher (General vs Frame Specific) ── */}
      <div className="px-3 py-2 bg-neutral-50/90 border-b border-neutral-100 shrink-0">
        <div className="grid grid-cols-2 p-1 bg-neutral-200/70 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setChatMode('general')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              chatMode === 'general'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
            }`}
          >
            <Hash className={`w-3.5 h-3.5 ${chatMode === 'general' ? 'text-blue-600' : 'text-neutral-400'}`} />
            <span>General</span>
            {generalMessages.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                chatMode === 'general' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-300 text-neutral-700'
              }`}>
                {generalMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setChatMode('frame')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              chatMode === 'frame'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${chatMode === 'frame' ? 'text-purple-600' : 'text-neutral-400'}`} />
            <span className="truncate">Frame Specific</span>
            {frameMessages.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                chatMode === 'frame' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-300 text-neutral-700'
              }`}>
                {frameMessages.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Frame Switcher Pills when in Frame Mode */}
        {chatMode === 'frame' && posts.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-neutral-200/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] uppercase font-mono text-neutral-400 shrink-0 font-medium">Frames:</span>
            {posts.map((post) => {
              const isSelected = post.id === selectedFramePostId;
              const msgCount = chatMessages.filter((m) => m.postId === post.id).length;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                  title={post.title}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                      : 'bg-white text-neutral-600 border border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  <span className="truncate max-w-[85px]">{post.title || 'Untitled'}</span>
                  {msgCount > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {msgCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-b from-blue-50/50 via-white to-transparent p-3.5 rounded-2xl border border-blue-100/60">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            {chatMode === 'general' ? (
              <>
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Studio Channel · #General
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 truncate max-w-[200px]">
                  Frame Thread · {activePost ? activePost.title : 'Select Frame'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Hi, {myDisplayName} 👋
            </h2>
            <button
              type="button"
              onClick={() => {
                setMyNameInput(myDisplayName);
                setIsEditingMyName(!isEditingMyName);
              }}
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <span>{isEditingMyName ? 'Close' : 'Edit Name'}</span>
            </button>
          </div>

          {isEditingMyName && (
            <div className="mt-2 p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-1.5 animate-fade-in">
              <label className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider block">
                Your Display Name:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={myNameInput}
                  onChange={(e) => setMyNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateUserName(myNameInput);
                      setIsEditingMyName(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingMyName(false);
                    }
                  }}
                  placeholder="e.g. Sarah · Art Director"
                  className="flex-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-50 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateUserName(myNameInput);
                    setIsEditingMyName(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Save
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {['🎨 Designer', '✍️ Copywriter', '👑 Lead', '💼 Client'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const base = myNameInput.split('·')[0]?.trim() || myDisplayName.split('·')[0]?.trim() || 'User';
                      setMyNameInput(`${base} · ${preset}`);
                    }}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            {chatMode === 'general'
              ? 'Workspace-wide channel for team syncs, creative direction, and studio announcements.'
              : 'Collaborate with your partner on ad copy, visual assets, and approvals in real-time.'}
          </p>

          {/* 3 Quick Action Chips */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {chatMode === 'general' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Team sync: let's align on upcoming creative deliverables & goals.")}
                  className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-100/80 hover:border-blue-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    📢
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Team Sync</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Milestone</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPrompt('Brainstorming new visual concepts & high-converting angles.')}
                  className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/70 border border-purple-100/80 hover:border-purple-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    💡
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Brainstorm</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Ideate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPrompt('All creative assets look cohesive and ready for campaign launch! 🚀')}
                  className="p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-100/80 hover:border-emerald-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    🚀
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Launch Ready</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Sign-off</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt('Could we test a bolder headline copy for this creative?')}
                  className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50/70 border border-purple-100/80 hover:border-purple-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    ✍️
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Review Copy</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Headline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPrompt('Checking the visual hierarchy and color contrast.')}
                  className="p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-100/80 hover:border-emerald-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    🎨
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Visual Polish</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Palette</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPrompt('This iteration looks ready to ship! Approved on my end. ✅')}
                  className="p-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-100/80 hover:border-amber-300 text-left transition-all hover:scale-[1.02] shadow-xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-[11px] font-bold mb-1.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    ✅
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Approve Draft</p>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-mono">Sign-off</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Active Conversation Stream Between the Two Users ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
            <span className="truncate max-w-[140px] flex items-center gap-1">
              {chatMode === 'general' ? (
                <>
                  <Hash className="w-3 h-3 text-blue-500" />
                  <span>Channel: #general</span>
                </>
              ) : (
                <span>{activePost ? `Thread: ${activePost.title}` : 'No Frame Selected'}</span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {chatMode === 'frame' && activePost?.mediaUrl && (
                <a
                  href={activePost.mediaUrl}
                  download={activePost.title ? `${activePost.title.toLowerCase().replace(/\s+/g, '-')}-asset` : 'creative-asset'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download creative asset"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 text-[9px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-2xs"
                >
                  <Download className="w-2.5 h-2.5" />
                  <span>Asset</span>
                </a>
              )}
              <span>{postMessages.length} updates</span>
              {postMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearChatMessages(currentPostId || undefined)}
                  className="hover:text-red-600 font-medium lowercase px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-red-50 border border-neutral-200/80 transition-colors"
                  title="Purge messages in this thread"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {postMessages.length === 0 ? (
            <div className="p-5 text-center rounded-xl bg-neutral-50/60 border border-neutral-100 text-neutral-400">
              <p className="text-xs font-semibold text-neutral-700 mb-1">
                {chatMode === 'general'
                  ? 'Welcome to #general Studio Chat'
                  : activePost
                    ? `Thread for "${activePost.title}"`
                    : 'No Frame Selected'}
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                {chatMode === 'general'
                  ? 'No general updates yet. Start a workspace-wide discussion or announcement below!'
                  : activePost
                    ? 'No messages yet for this creative. Start the review thread below!'
                    : 'Click any creative card on the canvas or frame pill above, or switch to General Chat.'}
              </p>
              {chatMode === 'frame' && !activePost && (
                <button
                  type="button"
                  onClick={() => setChatMode('general')}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-semibold hover:bg-neutral-800 transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <Hash className="w-3 h-3 text-blue-400" />
                  <span>Switch to General Chat</span>
                </button>
              )}
            </div>
          ) : (
            postMessages.map((msg) => {
              const isMe = msg.senderUid === currentUser.uid;
              const cleanSender = (msg.senderUid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
              const shortId = cleanSender && !cleanSender.toLowerCase().includes('7f2a') && !cleanSender.toLowerCase().includes('init')
                ? cleanSender.slice(-4).toUpperCase()
                : 'USER';
              const effName = getEffectiveUserName(msg.senderUid, msg.senderName);
              const displayName = isMe ? 'You' : effName;
              const isRenaming = renamingUid === msg.senderUid;
              const hasAlias = Boolean(customAliases && customAliases[msg.senderUid]);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-sans">
                    <span className="font-semibold text-neutral-700">
                      {displayName}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-mono border border-neutral-200/60">
                      ID: #{shortId}
                    </span>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingUid(isRenaming ? null : msg.senderUid);
                          setRenamingInput(customAliases?.[msg.senderUid] || effName);
                        }}
                        className="text-[9px] text-neutral-500 hover:text-neutral-900 underline ml-0.5"
                        title="Give a custom name to this user"
                      >
                        {hasAlias ? 'Rename' : 'Give Name'}
                      </button>
                    )}
                    <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {isRenaming && (
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-neutral-100 border border-neutral-300 shadow-2xs mb-1 animate-fade-in">
                      <input
                        type="text"
                        autoFocus
                        value={renamingInput}
                        onChange={(e) => setRenamingInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setUserAlias(msg.senderUid, renamingInput);
                            setRenamingUid(null);
                          } else if (e.key === 'Escape') {
                            setRenamingUid(null);
                          }
                        }}
                        placeholder={`Name for #${shortId}`}
                        className="px-2 py-0.5 rounded text-[11px] bg-white border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUserAlias(msg.senderUid, renamingInput);
                          setRenamingUid(null);
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-semibold hover:bg-neutral-800"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingUid(null)}
                        className="px-1 text-[10px] text-neutral-500 hover:text-neutral-800"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-neutral-900 text-white rounded-br-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-xs border border-neutral-200/80'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Audio Voice Memo */}
                    {msg.mediaUrl && msg.mediaType === 'audio' && (
                      <VoiceMemoPlayer
                        audioUrl={msg.mediaUrl}
                        durationSeconds={msg.audioDuration}
                        isMe={isMe}
                      />
                    )}

                    {/* Image / Video / File Attachment */}
                    {msg.mediaUrl && msg.mediaType !== 'audio' && (
                      <div className={`mt-2 rounded-xl overflow-hidden border ${isMe ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'} shadow-xs`}>
                        {msg.mediaType === 'video' ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="w-full max-h-48 object-cover rounded-t-xl bg-black"
                          />
                        ) : (
                          <img
                            src={msg.mediaUrl}
                            alt={msg.mediaName || 'Attached asset'}
                            className="w-full max-h-52 object-cover rounded-t-xl cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.mediaUrl, '_blank')}
                          />
                        )}
                        <div className="px-2.5 py-1.5 flex items-center justify-between bg-neutral-900/90 text-white text-[10px]">
                          <span className="truncate max-w-[120px] font-mono text-neutral-300">
                            {msg.mediaName || (msg.mediaType === 'video' ? 'video-asset' : 'image-asset')}
                          </span>
                          <a
                            href={msg.mediaUrl}
                            download={msg.mediaName || 'downloaded-media'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/35 text-white font-medium transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom Floating Input Bar (Matching Image 1) ── */}
      <div className="p-3 bg-white border-t border-neutral-100">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Feature 2: Voice Memo Recorder */}
        {isRecordingVoice && (
          <div className="mb-2">
            <VoiceMemoRecorder
              onMemoReady={handleVoiceMemoReady}
              onCancel={() => setIsRecordingVoice(false)}
            />
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="relative bg-neutral-50/90 hover:bg-neutral-50 border border-neutral-200/90 rounded-2xl p-2.5 transition-all focus-within:border-neutral-400 focus-within:bg-white shadow-xs"
        >
          {/* Selected Media Preview Chip */}
          {selectedMedia && (
            <div className="mb-2 p-1.5 px-2 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 overflow-hidden">
                {selectedMedia.type === 'video' ? (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    🎬
                  </div>
                ) : (
                  <img
                    src={selectedMedia.previewUrl}
                    alt="attachment preview"
                    className="w-8 h-8 rounded-lg object-cover border border-blue-200 shrink-0"
                  />
                )}
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-blue-900 truncate max-w-[170px]">{selectedMedia.name}</p>
                  <span className="text-[9px] text-blue-600 uppercase font-mono font-medium">{selectedMedia.type} attachment</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMedia(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-5 h-5 rounded-full hover:bg-blue-200/70 text-blue-700 flex items-center justify-center shrink-0 transition-colors"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              chatMode === 'general'
                ? 'Message studio team in #general...'
                : activePost
                  ? `Type feedback for "${activePost.title}"...`
                  : 'Type message...'
            }
            className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none px-1 pb-2 font-sans"
          />

          <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
            <div className="flex items-center gap-1 text-neutral-500">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image or Video"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  selectedMedia
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-neutral-200/60 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => activePost && togglePostHighlight(activePost.id)}
                title={activePost?.isHighlighted ? 'Remove Aura Glow' : 'Highlight Post with Aura Glow'}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activePost?.isHighlighted ? 'bg-purple-600 text-white shadow-2xs' : 'hover:bg-neutral-200/60 text-neutral-500'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={isRecordingVoice ? "Cancel Voice Memo" : "Record Voice Memo"}
                onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isRecordingVoice
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'hover:bg-neutral-200/60 text-neutral-500'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedMedia) || isSending}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                (inputText.trim() || selectedMedia) && !isSending
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:scale-105 active:scale-95'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <span className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

