'use client';

import React from 'react';
import {
  Pin,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AspectRatioSelector } from './AspectRatioSelector';
import { PresenceBar } from './PresenceBar';

export function TopBar() {
  const { state, dispatch } = useAppContext();
  const { pinModeActive, huddleActive, sessionName, annotations } = state;

  const openCount = annotations.filter((a) => a.status === 'OPEN').length;

  async function handleHuddleClick() {
    if (huddleActive) {
      const { leaveHuddle } = await import('@repo/cometchat-client');
      await leaveHuddle();
      dispatch({ type: 'SET_HUDDLE_ACTIVE', active: false });
    } else {
      dispatch({ type: 'SET_HUDDLE_ACTIVE', active: true });
      const participant = {
        uid: state.currentUser.uid,
        name: state.currentUser.name,
        isMuted: false,
        isVideoOff: true,
        isSpeaking: false,
      };
      dispatch({ type: 'HUDDLE_PARTICIPANT_JOINED', participant });
    }
  }

  return (
    <header className="h-13 flex items-center justify-between px-4 border-b border-canvas-border bg-canvas-surface z-40 flex-shrink-0 gap-3">
      {/* Left: Logo + Session Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* AdProof Logo Mark */}
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-white">AP</span>
          </div>
          <span className="text-sm font-semibold text-canvas-fg hidden sm:block">AdProof</span>
        </div>
        <div className="w-px h-5 bg-canvas-border flex-shrink-0" />
        <span className="text-sm text-canvas-muted truncate">{sessionName}</span>
        {openCount > 0 && (
          <span className="flex-shrink-0 text-xs bg-accent/20 text-accent border border-accent/30 rounded-full px-2 py-0.5">
            {openCount} open
          </span>
        )}
      </div>

      {/* Center: Aspect Ratio Selector */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <AspectRatioSelector />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Presence */}
        <PresenceBar />

        <div className="w-px h-5 bg-canvas-border" />

        {/* Pin Mode Toggle */}
        <button
          onClick={() => dispatch({ type: 'SET_PIN_MODE', active: !pinModeActive })}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
            border transition-all duration-150
            ${pinModeActive
              ? 'bg-accent border-accent text-white shadow-lg shadow-accent/25'
              : 'bg-canvas-bg border-canvas-border text-canvas-muted hover:text-canvas-fg hover:border-canvas-hover'
            }
          `}
          title={pinModeActive ? 'Exit Pin Mode (click canvas to cancel)' : 'Enable Pin Mode — click canvas to leave feedback'}
        >
          <Pin className={`w-3.5 h-3.5 ${pinModeActive ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{pinModeActive ? 'Pinning…' : 'Pin Feedback'}</span>
        </button>

        {/* Huddle Button */}
        <button
          onClick={handleHuddleClick}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
            border transition-all duration-150
            ${huddleActive
              ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/25'
              : 'bg-canvas-bg border-canvas-border text-canvas-muted hover:text-canvas-fg hover:border-canvas-hover'
            }
          `}
          title={huddleActive ? 'Leave Voice Huddle' : 'Start Voice Huddle'}
        >
          {huddleActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Huddle</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
