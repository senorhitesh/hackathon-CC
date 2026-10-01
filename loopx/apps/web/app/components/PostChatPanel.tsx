'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Send,
  Sparkles,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pin,
  RefreshCw,
} from 'lucide-react';
import type { BoardPost } from '@repo/types';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'owner' | 'client' | 'ai';
  text: string;
  timestamp: number;
}

export function PostChatPanel() {
  const { state, dispatch, resolveAnnotation } = useAppContext();
  const { posts, activePostId, annotations, currentUser, roomId } = state;
  const [activeTab, setActiveTab] = useState<'chat' | 'pins' | 'ai'>('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      senderName: 'Sarah Rivera (Owner)',
      senderRole: 'owner',
      text: 'Hey! Uploaded the latest 1:1 post version for your review. Let me know if you need copy changes!',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'msg_2',
      senderName: 'Client Guest',
      senderRole: 'client',
      text: 'Looks great! Can we tweak the headline font size slightly and test a bolder call to action?',
      timestamp: Date.now() - 1800000,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePost = posts.find((p) => p.id === activePostId) ?? posts[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Try CometChat SDK send message if available
    try {
      const { sendAnnotation } = await import('@repo/cometchat-client');
      // SDK message trigger
    } catch (_) {}

    // Simulated CometChat AI Agent auto-response
    if (activeTab === 'ai' || inputText.toLowerCase().includes('ai') || inputText.toLowerCase().includes('copy')) {
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `ai_${Date.now()}`,
          senderName: 'CometChat AI Agent',
          senderRole: 'ai',
          text: `✨ AI Suggestion for "${activePost?.title ?? 'Post'}":\nHere is an optimized headline: "Unleash Your Summer Style — Limited 20% Off Code!"`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  }

  function handleStatusChange(status: BoardPost['status']) {
    if (!activePost) return;
    dispatch({ type: 'UPDATE_POST_STATUS', postId: activePost.id, status });
  }

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full flex-shrink-0 z-30 select-none shadow-xs">
      {/* Top Header: Post Title & Status Dropdown (Wireframe Image 5 style) */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Iterate & Chat Section
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            CometChat Live
          </span>
        </div>
        <h3 className="text-xs font-bold text-slate-900 truncate">
          {activePost?.title ?? 'Select a Post'}
        </h3>

        {/* Status Picker Buttons */}
        {activePost && (
          <div className="flex items-center gap-1 mt-2">
            {(['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  activePost.status === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center justify-center gap-1 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('pins')}
          className={`flex items-center justify-center gap-1 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'pins'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Pin className="w-3.5 h-3.5 text-amber-600" />
          <span>Pins ({annotations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center justify-center gap-1 py-1.5 font-semibold rounded-lg transition-all ${
            activeTab === 'ai'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Agent</span>
        </button>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'chat' || activeTab === 'ai' ? (
          /* CometChat Messages List */
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.senderRole === 'ai'
                    ? 'bg-purple-50/70 border-purple-200 text-purple-950 p-2.5 rounded-xl border'
                    : msg.senderRole === 'owner'
                    ? 'bg-slate-50 border-slate-200 p-2.5 rounded-xl border'
                    : 'bg-indigo-50/60 border-indigo-100 p-2.5 rounded-xl border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    {msg.senderRole === 'ai' && <Sparkles className="w-3 h-3 text-purple-600" />}
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Pin Feedback Annotations List */
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Contextual Pin Feedback
            </span>
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No pin annotations added yet. Toggle "Pin Feedback" mode on canvas to place pins on the post image.
              </div>
            ) : (
              annotations.map((pin, idx) => (
                <div
                  key={pin.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{pin.authorName}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      pin.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {pin.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{pin.comment}</p>
                  {pin.status === 'OPEN' && (
                    <button
                      onClick={() => resolveAnnotation(pin.id)}
                      className="text-[10px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={activeTab === 'ai' ? 'Ask CometChat AI for copy ideas...' : 'Type message to iterate...'}
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
