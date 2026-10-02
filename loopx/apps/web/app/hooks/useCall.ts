'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { HuddleParticipant } from '@repo/types';

export function useCall() {
  const { state, dispatch } = useAppContext();
  const { huddleActive, huddleParticipants, currentUser, roomId } = state;

  const [isInCall, setIsInCall] = useState(huddleActive);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const unsubscribersRef = useRef<(() => void)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const effectiveSessionId = `${roomId || 'workspace'}_huddle`;

  // Synchronize with AppContext huddle state
  useEffect(() => {
    setIsInCall(huddleActive);
  }, [huddleActive]);

  // Timer effect when in call
  useEffect(() => {
    if (!isInCall) {
      setElapsed(0);
      return;
    }
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isInCall]);

  // Real-time Audio Level Detection for Voice Wave Animation & Speaking Rings
  const startAudioMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] ?? 0;
        }
        const average = sum / bufferLength;
        // Threshold for speaking
        setIsSpeaking(average > 18);
        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      animFrameRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.warn('[loopx Voice] Audio analyser setup fallback:', err);
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // ─── Join Voice Huddle (Audio Only) ──────────────────────────────────────────
  const joinCall = useCallback(
    async (targetSessionId?: string, container?: HTMLElement | null) => {
      const sessionId = targetSessionId || effectiveSessionId;

      try {
        // 1. Request microphone access for real voice communication & audio metering
        let stream: MediaStream | null = null;
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStreamRef.current = stream;
            startAudioMeter(stream);
          } catch (micErr) {
            console.warn('[loopx Voice] Microphone prompt dismissed or denied:', micErr);
          }
        }

        // 2. Derive participant identity
        const shortId = (currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase() || '7F2A';
        const displayName = (currentUser.name && currentUser.name !== 'Collaborator' && currentUser.name !== 'owner' && currentUser.name !== 'client')
          ? currentUser.name
          : `User #${shortId}`;

        const myParticipant: HuddleParticipant = {
          uid: currentUser.uid,
          name: displayName,
          avatar: currentUser.avatar,
          isMuted: false,
          isVideoOff: true, // Strictly audio-only
          isSpeaking: false,
        };

        // 3. Connect via CometChat Calls SDK
        const { initCometChatCalls, startHuddle, isMockMode } = await import('@repo/cometchat-client');
        await initCometChatCalls();

        await startHuddle({
          sessionId,
          container: container || null,
          isVideo: false, // Voice only
          onParticipantJoined: (p) => {
            dispatch({ type: 'HUDDLE_PARTICIPANT_JOINED', participant: p });
          },
          onParticipantLeft: (uid) => {
            dispatch({ type: 'HUDDLE_PARTICIPANT_LEFT', uid });
          },
          onHuddleEnded: () => {
            leaveCall();
          },
        });

        // 4. Update local state
        setIsInCall(true);
        setIsMuted(false);
        dispatch({ type: 'SET_HUDDLE_ACTIVE', active: true });
        dispatch({ type: 'HUDDLE_PARTICIPANT_JOINED', participant: myParticipant });

        // 5. Cross-tab synchronization via BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(`canvas_collab_${roomId}`);
          bc.postMessage({
            type: 'canvas_sync',
            event: 'HUDDLE_JOINED',
            senderUid: currentUser.uid,
            participant: myParticipant,
          });
          bc.close();
        }
      } catch (err) {
        console.warn('[loopx Voice] Failed to join voice huddle:', err);
        // Fallback: activate local huddle state so UI remains functional
        setIsInCall(true);
        dispatch({ type: 'SET_HUDDLE_ACTIVE', active: true });
      }
    },
    [currentUser.uid, currentUser.name, currentUser.avatar, effectiveSessionId, roomId, dispatch, startAudioMeter],
  );

  // ─── Leave Voice Huddle ──────────────────────────────────────────────────────
  const leaveCall = useCallback(async () => {
    try {
      const { leaveHuddle } = await import('@repo/cometchat-client');
      await leaveHuddle(effectiveSessionId);
    } catch (err) {
      console.warn('[loopx Voice] Leave session error:', err);
    }

    stopAudioMeter();
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    setIsInCall(false);
    setIsMuted(false);
    dispatch({ type: 'SET_HUDDLE_ACTIVE', active: false });
    dispatch({ type: 'HUDDLE_PARTICIPANT_LEFT', uid: currentUser.uid });

    // Sync leave across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`canvas_collab_${roomId}`);
      bc.postMessage({
        type: 'canvas_sync',
        event: 'HUDDLE_LEFT',
        senderUid: currentUser.uid,
      });
      bc.close();
    }
  }, [effectiveSessionId, roomId, currentUser.uid, dispatch, stopAudioMeter]);

  // ─── Toggle Microphone (Mute / Unmute) ────────────────────────────────────────
  const toggleAudio = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Toggle hardware mic stream track
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // Toggle CometChat Calls SDK audio
    try {
      const { toggleMute } = await import('@repo/cometchat-client');
      await toggleMute(nextMuted);
    } catch (err) {
      console.warn('[loopx Voice] Toggle mute warning:', err);
    }

    // Sync mute status across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`canvas_collab_${roomId}`);
      bc.postMessage({
        type: 'canvas_sync',
        event: 'HUDDLE_MUTE_TOGGLED',
        senderUid: currentUser.uid,
        isMuted: nextMuted,
      });
      bc.close();
    }
  }, [isMuted, roomId, currentUser.uid]);

  // ─── Listen for peer huddle events on BroadcastChannel ────────────────────────
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(`canvas_collab_${roomId}`);

    bc.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'canvas_sync') return;

      if (data.event === 'HUDDLE_JOINED' && data.participant) {
        if (data.senderUid !== currentUser.uid) {
          dispatch({ type: 'HUDDLE_PARTICIPANT_JOINED', participant: data.participant });
        }
      } else if (data.event === 'HUDDLE_LEFT') {
        if (data.senderUid !== currentUser.uid) {
          dispatch({ type: 'HUDDLE_PARTICIPANT_LEFT', uid: data.senderUid });
        }
      }
    };

    return () => {
      bc.close();
    };
  }, [roomId, currentUser.uid, dispatch]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudioMeter();
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, [stopAudioMeter]);

  return {
    isInCall,
    isMuted,
    isSpeaking,
    elapsed,
    participants: huddleParticipants,
    joinCall,
    leaveCall,
    toggleAudio,
  };
}
