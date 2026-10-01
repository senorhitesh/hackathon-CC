'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Layers,
  FolderKanban,
  Search,
  Plus,
  Upload,
  Image as ImageIcon,
  Tag,
  Check,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { BrandAsset } from '@repo/types';

export function LeftSidebar() {
  const { state, dispatch, addBrandAsset } = useAppContext();
  const { posts, activePostId, brandAssets, sessionName } = state;
  const [activeTab, setActiveTab] = useState<'board' | 'assets'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        addBrandAsset(file.name.replace(/\.[^/.]+$/, ''), 'brand', src);
      }
    };
    reader.readAsDataURL(file);
  }

  const filteredAssets = brandAssets.filter((a) => {
    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesQuery = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-30 select-none">
      {/* Top Header Selector (Image 1 style: My Project / Board 1) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Boards</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreateRoomOpen', value: true })}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Create new board"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Board & Assets Mode Switcher Tabs (Wireframe Image 5 style) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'board'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'assets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Assets</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'board' ? (
          /* ── Board / Frames / Layers Tab ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Frames & Posts ({posts.length})
              </span>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: true })}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Post</span>
              </button>
            </div>

            {/* Frames List */}
            <div className="space-y-1.5">
              {posts.map((post) => {
                const isSelected = post.id === activePostId;
                return (
                  <div
                    key={post.id}
                    onClick={() => dispatch({ type: 'SELECT_POST', postId: post.id })}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">{post.title}</h4>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {post.preset.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layers Section (Image 1 style) */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Layers Breakdown
              </span>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium px-2 py-1">
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Frame 1 Canvas</span>
                </div>
                <div className="pl-6 space-y-1 text-[11px] text-slate-500">
                  <div className="px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer">
                    Text: Headline Copy
                  </div>
                  <div className="px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer">
                    Image: Product Showcase
                  </div>
                  <div className="px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer">
                    Badge: Discount 20%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Brand Assets Tab (LocalStorage Uploads) ── */
          <div className="space-y-3">
            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-xs font-semibold text-slate-700">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Brand Asset</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAssetUpload}
                className="hidden"
              />
            </label>

            {/* Asset Categories */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {['all', 'brand', 'product', 'badge'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg capitalize font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl border border-slate-200 bg-white p-1.5 hover:border-slate-400 transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                    <img src={asset.src} alt={asset.name} className="h-full w-full object-contain p-1" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate block mt-1 px-0.5">
                    {asset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
