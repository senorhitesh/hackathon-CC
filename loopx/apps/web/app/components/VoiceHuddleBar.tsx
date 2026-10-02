'use client';

import React from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
} from './icons/Hugeicons';
import type { HuddleParticipant } from '@repo/types';
import { useCall } from '../hooks/useCall';

function ParticipantAvatar({
  participant,
  size = 30,
}: {
  participant: HuddleParticipant;
  size?: number;
}) {
  const initials = (participant.name || 'User')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-indigo-600',
    'bg-violet-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-sky-600',
  ];
  const colorIdx = (participant.uid || 'U').charCodeAt(0) % colors.length;

  return (
    <div className="relative flex-shrink-0" title={participant.name}>
      <div
        className={`
          rounded-full flex items-center justify-center text-white font-bold shadow-xs transition-all
          ${colors[colorIdx]}
          ${participant.isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 scale-105' : 'ring-1 ring-white'}
        `}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {participant.isMuted && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center ring-1 ring-white">
          <MicOff className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  );
}

/** Animated audio wave bars for voice speaking */
function VoiceAudioWave({ active, isSpeaking }: { active: boolean; isSpeaking: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-4 px-1" title={isSpeaking ? 'Speaking...' : 'Microphone Active'}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all duration-150 ${
            !active
              ? 'bg-neutral-300 h-1'
              : isSpeaking
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-emerald-400/80'
          }`}
          style={{
            height: !active ? 3 : isSpeaking ? (i % 2 === 0 ? 14 : 9) : (i % 2 === 0 ? 6 : 4),
            animation: active && isSpeaking ? `huddle-wave 0.8s ease-in-out infinite ${i * 0.12}s` : undefined,
            minHeight: 3,
            maxHeight: 14,
          }}
        />
      ))}
    </div>
  );
}

export function VoiceHuddleBar() {
  const { isInCall, isMuted, isSpeaking, elapsed, participants, leaveCall, toggleAudio } = useCall();

  if (!isInCall) return null;

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <>
      {/* Off-screen audio mounting container for CometChat Calls SDK (never display:none so audio streams) */}
      <div
        id="cometchat-audio-container"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Floating Modern Voice Huddle Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in select-none">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 text-neutral-900">
          {/* Live Voice Status Indicator & Timer */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-neutral-900 leading-tight">
                Live Voice Huddle
              </span>
              <span className="text-[10px] font-mono text-neutral-500 leading-none">
                {mins}:{secs}
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-neutral-200" />

          {/* Participant Avatars */}
          <div className="flex items-center -space-x-1.5">
            {participants.slice(0, 4).map((p) => (
              <ParticipantAvatar key={p.uid} participant={p} size={28} />
            ))}
            {participants.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                +{participants.length - 4}
              </div>
            )}
          </div>

          {/* Audio Wave Visualizer */}
          <VoiceAudioWave active={!isMuted} isSpeaking={isSpeaking} />

          <div className="w-px h-5 bg-neutral-200" />

          {/* Voice Controls: Mute & Leave (Audio Only) */}
          <div className="flex items-center gap-1.5">
            {/* Microphone Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`
                px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all
                ${isMuted
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-2xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }
              `}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[11px]">Muted</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">Mute</span>
                </>
              )}
            </button>

            {/* Leave Voice Huddle */}
            <button
              type="button"
              onClick={leaveCall}
              className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              title="Leave Voice Huddle"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
