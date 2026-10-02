'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Upload, X, Check, Image as ImageIcon } from './icons/Hugeicons';
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
  const [error, setError] = useState('');

  const isReels = preset === 'REELS_STORY';

  if (!state.isCreatePostOpen) return null;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
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

  function handleUseDefaultTemplate() {
    setError('');
    setMediaUrl('/default-card.png');
  }

  function handleClearMedia() {
    setMediaUrl('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isReels && !mediaUrl.trim()) {
      setError('Instagram Reels & Stories require visual media (image or video). Please upload media or click "Use Default Card".');
      return;
    }

    createPost({
      title: title.trim() || 'Creative Post',
      description: description.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      mediaType: mediaUrl.trim() ? 'image' : undefined,
      preset,
      status: 'DRAFT',
    });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: false });
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setError('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-neutral-200/90 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-neutral-900">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: false })}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Node Configuration
          </span>
          <h2 className="text-base font-semibold text-neutral-900 mt-0.5">
            Create Creative Node
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add a creative ad post to collaborate with live feedback and CometChat nodes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Title */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Campaign — Hero Ad 1"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all font-sans"
            />
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1.5">
              Platform Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreset(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    preset === opt.id
                      ? 'bg-neutral-50 border-black text-black shadow-2xs ring-1 ring-black'
                      : 'bg-white border-neutral-200/90 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{opt.label}</p>
                    <p className="text-[10px] font-mono text-neutral-500">{opt.ratio}</p>
                  </div>
                  {preset === opt.id && <Check className="w-4 h-4 text-black" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Asset Image Upload or URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-neutral-700">
                Creative Visual Media{' '}
                {isReels ? (
                  <span className="text-red-500 font-semibold">* (Mandatory for Reels & Stories)</span>
                ) : (
                  <span className="text-neutral-400 font-normal">(Optional)</span>
                )}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseDefaultTemplate}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors flex items-center gap-1 border border-neutral-200"
                >
                  <ImageIcon className="w-3 h-3 text-neutral-600" />
                  Use Default Card
                </button>
                {mediaUrl && (
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    className="text-[10px] text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-100/60 transition-colors p-3 text-center">
                {mediaUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={mediaUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                    <span className="absolute bottom-0 right-0 bg-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-neutral-200 text-neutral-700 shadow-2xs">
                      Change
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                    <span className="text-xs text-neutral-800 font-medium">
                      {isUploading ? 'Processing...' : 'Upload media file (optional)'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      PNG, JPG, or WebP • Leave empty for text-only post
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Or paste an image URL, or leave blank..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-700 mb-1">
              Campaign Copy / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add ad copy or primary creative instructions..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all font-sans"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'isCreatePostOpen', value: false })}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              Add Node to Canvas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
