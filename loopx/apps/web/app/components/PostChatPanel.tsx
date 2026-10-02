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
} from './icons/Hugeicons';
import type { BoardPost } from '@repo/types';

export function PostChatPanel() {
  const { state, dispatch, togglePostHighlight, clearChatMessages } = useAppContext();
  const { sendMessage } = useCometChatContext();
  const { posts, activePostId, annotations, currentUser, chatMessages, collaborators } = state;
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    previewUrl: string;
    name: string;
    type: 'image' | 'video' | 'file';
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPostId = activePostId || (posts.length > 0 ? posts[0]?.id : null);
  const activePost = posts.find((p) => p.id === currentPostId);

  // Derive clean ID-based display name for current user
  const myShortId = (currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase() || '7F2A';
  const myDisplayName = (currentUser.name && currentUser.name !== 'Collaborator' && currentUser.name !== 'owner' && currentUser.name !== 'client')
    ? currentUser.name
    : `User #${myShortId}`;

  // Each post has its own unique chat thread
  const postMessages = currentPostId
    ? chatMessages.filter((m) => m.postId === currentPostId)
    : chatMessages.filter((m) => m.postId === state.roomId || m.postId === 'general');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [postMessages.length]);

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

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-40 bg-neutral-900/95 hover:bg-black backdrop-blur-md border border-neutral-800 text-white rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-2 transition-all font-medium text-xs animate-fade-in hover:scale-105 active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
        <span className="font-semibold tracking-tight">Live Chat</span>
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
      {/* ── Top Header (Matching Image 1) ── */}
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
            <h3 className="text-xs font-semibold text-neutral-900">
              {activePost ? activePost.title : 'Live Discussion'}
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
            title="New Creative Node"
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

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Section (Matching Image 1) */}
        <div className="bg-gradient-to-b from-blue-50/50 via-white to-transparent p-3.5 rounded-2xl border border-blue-100/60">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Creative Thread
            </span>
          </div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Hi, {myDisplayName} 👋
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
            Collaborate with your partner on ad copy, visual assets, and approvals in real-time.
          </p>

          {/* 3 Quick Action Chips (Matching Image 1 design) */}
          <div className="grid grid-cols-3 gap-2 mt-3">
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
          </div>
        </div>

        {/* ── Active Conversation Stream Between the Two Users ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
            <span className="truncate max-w-[140px]">
              {activePost ? `Thread: ${activePost.title}` : 'Workspace Thread'}
            </span>
            <div className="flex items-center gap-1.5">
              {activePost?.mediaUrl && (
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
                {activePost ? `Thread for "${activePost.title}"` : 'Workspace Thread'}
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                No messages yet for this creative. Start the review thread below!
              </p>
            </div>
          ) : (
            postMessages.map((msg) => {
              const isMe = msg.senderUid === currentUser.uid;
              const shortId = (msg.senderUid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase() || '7F2A';
              const displayName = isMe
                ? 'You'
                : (msg.senderName && msg.senderName !== 'Collaborator' && msg.senderName !== 'owner' && msg.senderName !== 'client')
                  ? msg.senderName
                  : `User #${shortId}`;

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
                    <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-neutral-900 text-white rounded-br-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-xs border border-neutral-200/80'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Media Attachment */}
                    {msg.mediaUrl && (
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
            placeholder="Type feedback or reply to partner..."
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
                title="Voice review confirmation"
                onClick={() =>
                  setInputText((prev) =>
                    prev.includes('🎙️ Voice review confirmed.')
                      ? prev
                      : prev
                        ? `${prev} 🎙️ Voice review confirmed.`
                        : '🎙️ Voice review confirmed.'
                  )
                }
                className="w-7 h-7 rounded-lg hover:bg-neutral-200/60 flex items-center justify-center transition-colors"
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

