'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Upload, X, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import type { PlatformPreset } from '@repo/types';

const PRESET_OPTIONS: { id: PlatformPreset; label: string; ratio: string }[] = [
  { id: 'IG_SQUARE', label: 'Instagram Square', ratio: '1:1' },
  { id: 'REELS_STORY', label: 'Reels / Story', ratio: '9:16' },
  { id: 'X_BANNER', label: 'X / Twitter Banner', ratio: '16:9' },
  { id: 'LINKEDIN_POST', label: 'LinkedIn Post', ratio: '1200:628' },
];

export function CreatePostModal() {
  const { state, dispatch, createPost } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState<PlatformPreset>('IG_SQUARE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!state.isCreatePostOpen) return null;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        setMediaUrl(dataUri);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createPost({
      title: title.trim() || 'New Creative Ad Post',
      description: description.trim(),
      mediaUrl,
      mediaType: 'image',
      preset,
      status: 'DRAFT',
    });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: false });
    setTitle('');
    setDescription('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: false })}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Creative Canvas
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Create New Creative Post
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload custom creative assets to start feedback & CometChat iteration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Post Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Campaign — Hero Ad 1"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Platform Preset / Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreset(opt.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    preset === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="font-mono text-[10px] opacity-75">{opt.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload / Data URI */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Post Media (LocalStorage Upload)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-4 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">
                  {isUploading ? 'Uploading...' : 'Choose File (Persisted in LocalStorage)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Media Preview */}
            {mediaUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-36 flex items-center justify-center">
                <img src={mediaUrl} alt="Preview" className="h-full object-cover w-full" />
                <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                  Preview
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <span>Add Post to Canvas</span>
          </button>
        </form>
      </div>
    </div>
  );
}
