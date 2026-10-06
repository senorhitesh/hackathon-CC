'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { QRCode } from './QRCode';
import {
  Copy,
  Check,
  X,
  Play,
  Square,
  Lock,
  Link,
  Share2,
  ExternalLink,
} from './icons/Hugeicons';

// Fun Excalidraw-style collaborative animal names
const FUN_COLLAB_NAMES = [
  'Splendid Buffalo',
  'Electric Falcon',
  'Velvet Fox',
  'Cosmic Panther',
  'Dancing Lynx',
  'Golden Otter',
  'Curious Eagle',
  'Midnight Badger',
  'Silver Koala',
  'Brave Dolphin',
  'Clever Raven',
  'Gentle Panda',
];

function getRandomFunName(): string {
  const chosen = FUN_COLLAB_NAMES[Math.floor(Math.random() * FUN_COLLAB_NAMES.length)];
  return chosen ?? 'Splendid Buffalo';
}

export interface CollabAPI {
  getUsername: () => string;
  setUsername: (name: string) => void;
  startCollaboration: (roomId?: string | null) => Promise<string> | string;
  stopCollaboration: () => void;
  isCollaborating: () => boolean;
}

interface ActiveRoomDialogProps {
  collabAPI: CollabAPI;
  activeRoomLink: string;
  handleClose: () => void;
}

const ActiveRoomDialog: React.FC<ActiveRoomDialogProps> = ({
  collabAPI,
  activeRoomLink,
  handleClose,
}) => {
  const [name, setName] = useState(collabAPI.getUsername() || getRandomFunName());
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isShareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    collabAPI.setUsername(val);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activeRoomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      inputRef.current?.select();
    } catch (_) {}
  }

  async function handleNativeShare() {
    if (!isShareSupported) return;
    try {
      await navigator.share({
        title: 'Join my live collaborative drawing session',
        text: 'Collaborate with me in real-time on loopx canvas',
        url: activeRoomLink,
      });
    } catch (_) {}
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
          Live collaboration
        </h3>
      </div>

      {/* Your Name Input */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Your name (e.g. Splendid Buffalo)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#6965db] focus:bg-white focus:ring-2 focus:ring-[#6965db]/20 transition-all font-sans"
        />
      </div>

      {/* Link Row */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
          Link
        </label>
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={activeRoomLink}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/80 text-xs font-mono text-neutral-700 truncate select-all focus:outline-none focus:border-neutral-300"
          />
          {isShareSupported && (
            <button
              type="button"
              onClick={handleNativeShare}
              title="Share link"
              className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 transition-colors shrink-0 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[#6965db] hover:bg-[#5b57d1] text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scannable QR Code */}
      <div className="py-2 flex justify-center">
        <QRCode value={activeRoomLink} />
      </div>

      {/* Encryption / Privacy Notice */}
      <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs text-neutral-500 leading-relaxed">
        <p className="flex items-start gap-1.5 font-medium text-neutral-600">
          <span className="text-sm select-none" role="img" aria-label="encrypted">
            🔒
          </span>
          <span>
            Don&apos;t worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.
          </span>
        </p>
        <p className="text-[11px] text-neutral-400 pl-5">
          Stopping the session will disconnect you from the room, but you&apos;ll be able to continue working with the scene, locally. Note that this won&apos;t affect other people, and they&apos;ll still be able to collaborate on their version.
        </p>
      </div>

      {/* Stop Session Action */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={() => {
            collabAPI.stopCollaboration();
            handleClose();
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-rose-300 hover:border-rose-400 bg-rose-50/70 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop session</span>
        </button>
      </div>
    </div>
  );
};

interface ShareDialogPickerProps {
  collabAPI: CollabAPI;
  onExportToBackend: () => void;
  handleClose: () => void;
}

const ShareDialogPicker: React.FC<ShareDialogPickerProps> = ({
  collabAPI,
  onExportToBackend,
  handleClose,
}) => {
  return (
    <div className="space-y-5">
      {/* Section 1: Live Collaboration */}
      <div>
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-2">
          Live collaboration
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed mb-2 font-medium">
          Invite people to collaborate on your drawing.
        </p>
        <p className="text-xs text-neutral-500 leading-relaxed mb-5">
          Don&apos;t worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.
        </p>

        <button
          type="button"
          onClick={async () => {
            await collabAPI.startCollaboration(null);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#6965db] hover:bg-[#5b57d1] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Start session</span>
        </button>
      </div>

      {/* Or Separator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <span className="relative px-3 bg-white text-xs text-neutral-400 font-medium">
          Or
        </span>
      </div>

      {/* Section 2: Shareable Link */}
      <div>
        <h4 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
          Shareable link
        </h4>
        <p className="text-xs text-neutral-500 mb-3.5 leading-relaxed">
          Export as a read-only link.
        </p>

        <button
          type="button"
          onClick={() => {
            onExportToBackend();
            handleClose();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#ececfc] hover:bg-[#dfdffc] text-[#5b58c7] border border-[#d6d6fa] text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Link className="w-3.5 h-3.5 stroke-[2]" />
          <span>Export to Link</span>
        </button>
      </div>
    </div>
  );
};

export function ShareDialog() {
  const {
    state,
    dispatch,
    getShareUrl,
    updateUserName,
    startCollaborationSession,
    stopCollaborationSession,
  } = useAppContext();
  const [isCollaboratingLocally, setIsCollaboratingLocally] = useState<boolean>(Boolean(state.roomKey));

  // Keep local collaboration state in sync with active roomKey
  useEffect(() => {
    setIsCollaboratingLocally(Boolean(state.roomKey));
  }, [state.roomKey]);

  if (!state.isShareOpen) return null;

  const activeRoomLink = getShareUrl();

  const collabAPI: CollabAPI = {
    getUsername: () => {
      if (state.currentUser.name && state.currentUser.name !== 'Collaborator' && !state.currentUser.name.includes('User #')) {
        return state.currentUser.name;
      }
      return getRandomFunName();
    },
    setUsername: (name: string) => {
      updateUserName(name);
    },
    startCollaboration: async (roomId?: string | null) => {
      const res = await startCollaborationSession(roomId);
      setIsCollaboratingLocally(true);
      return res.roomId;
    },
    stopCollaboration: () => {
      stopCollaborationSession();
      setIsCollaboratingLocally(false);
    },
    isCollaborating: () => isCollaboratingLocally,
  };

  function handleClose() {
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isShareOpen', value: false });
  }

  function handleExportToBackend() {
    const link = getShareUrl(state.roomId || 'readonly-board');
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(link).catch(() => {});
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="w-full max-w-[420px] rounded-3xl bg-white border border-neutral-200/90 p-6 shadow-2xl relative text-neutral-900 transition-all">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {isCollaboratingLocally ? (
          <ActiveRoomDialog
            collabAPI={collabAPI}
            activeRoomLink={activeRoomLink}
            handleClose={handleClose}
          />
        ) : (
          <ShareDialogPicker
            collabAPI={collabAPI}
            onExportToBackend={handleExportToBackend}
            handleClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}
