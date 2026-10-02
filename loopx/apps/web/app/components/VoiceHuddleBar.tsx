'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  Users,
} from './icons/Hugeicons';
import type { HuddleParticipant } from '@repo/types';
import { useAppContext } from '../context/AppContext';

function ParticipantAvatar({
  participant,
  size = 32,
}: {
  participant: HuddleParticipant;
  size?: number;
}) {
  const initials = participant.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600',
    'bg-amber-600', 'bg-rose-600', 'bg-sky-600',
  ];
  const colorIdx = participant.uid.charCodeAt(0) % colors.length;

  return (
    <div className="relative flex-shrink-0" title={participant.name}>
      <div
        className={`
          rounded-full flex items-center justify-center text-white font-semibold
          ${colors[colorIdx]}
          ${participant.isSpeaking ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-gray-900' : ''}
        `}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
      {participant.isMuted && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
          <MicOff className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  );
}

/** Animated audio wave bars */
function AudioWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-green-400"
          style={{
            height: active ? undefined : 4,
            animation: active
              ? `huddle-wave 1.2s ease-in-out infinite ${i * 0.15}s`
              : undefined,
            minHeight: 3,
            maxHeight: 14,
          }}
        />
      ))}
    </div>
  );
}

export function VoiceHuddleBar() {
  const { state, dispatch } = useAppContext();
  const { huddleActive, huddleParticipants, currentUser } = state;

  const [localMuted, setLocalMuted] = useState(false);
  const [localVideoOff, setLocalVideoOff] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!huddleActive) {
      setElapsed(0);
      startTimeRef.current = Date.now();
      return;
    }
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [huddleActive]);

  if (!huddleActive) return null;

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  async function handleMuteToggle() {
    const next = !localMuted;
    setLocalMuted(next);
    const { toggleMute } = await import('@repo/cometchat-client');
    await toggleMute(next);
  }

  async function handleVideoToggle() {
    const next = !localVideoOff;
    setLocalVideoOff(next);
    const { toggleVideo } = await import('@repo/cometchat-client');
    await toggleVideo(next);
  }

  async function handleLeave() {
    const { leaveHuddle } = await import('@repo/cometchat-client');
    await leaveHuddle();
    dispatch({ type: 'SET_HUDDLE_ACTIVE', active: false });
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-canvas-border bg-canvas-surface/95 backdrop-blur-xl shadow-2xl shadow-black/60"
        style={{ minWidth: 320 }}
      >
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">
            {mins}:{secs}
          </span>
        </div>

        <div className="w-px h-5 bg-canvas-border" />

        {/* Participant Avatars */}
        <div className="flex -space-x-2">
          {huddleParticipants.slice(0, 4).map((p) => (
            <ParticipantAvatar key={p.uid} participant={p} size={28} />
          ))}
          {huddleParticipants.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-canvas-hover flex items-center justify-center text-[10px] text-canvas-muted ring-2 ring-canvas-surface">
              +{huddleParticipants.length - 4}
            </div>
          )}
        </div>

        {/* Audio Wave */}
        <AudioWave active={!localMuted} />

        <div className="flex items-center gap-1 ml-1">
          {/* Mute Toggle */}
          <button
            onClick={handleMuteToggle}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${localMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-canvas-hover text-canvas-fg hover:bg-canvas-border'
              }
            `}
            title={localMuted ? 'Unmute' : 'Mute'}
          >
            {localMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={handleVideoToggle}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${localVideoOff
                ? 'bg-canvas-hover text-canvas-muted hover:bg-canvas-border'
                : 'bg-canvas-hover text-canvas-fg hover:bg-canvas-border'
              }
            `}
            title={localVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {localVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>

          {/* Leave Huddle */}
          <button
            onClick={handleLeave}
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all ml-1"
            title="Leave huddle"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
