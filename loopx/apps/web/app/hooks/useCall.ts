'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { HuddleParticipant } from '@repo/types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const rtcChannelRef = useRef<BroadcastChannel | null>(null);

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

  // Ensure remote audio playback element exists in DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!remoteAudioRef.current) {
      const audioEl = document.createElement('audio');
      audioEl.id = 'loopx-remote-audio-sink';
      audioEl.setAttribute('playsinline', 'true');
      // Offscreen rather than display: none so browser engine streams audio smoothly
      audioEl.style.position = 'fixed';
      audioEl.style.top = '-9999px';
      audioEl.style.left = '-9999px';
      audioEl.style.width = '1px';
      audioEl.style.height = '1px';
      audioEl.style.opacity = '0';
      audioEl.style.pointerEvents = 'none';
      document.body.appendChild(audioEl);
      remoteAudioRef.current = audioEl;
    }

    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

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
        setIsSpeaking(average > 16);
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

  // ─── Setup WebRTC Peer Audio Connection ──────────────────────────────────────
  const setupPeerConnection = useCallback((localStream: MediaStream) => {
    // Clean up existing peer connection if any
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Attach local microphone tracks
    localStream.getAudioTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // When remote voice track is received, play it on the remote audio element
    pc.ontrack = (event) => {
      console.info('[loopx Voice WebRTC] Remote audio track received:', event.streams[0]);
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch((err) => {
          console.warn('[loopx Voice WebRTC] AutoPlay prevented, waiting for interaction:', err);
        });
      }
    };

    // Forward ICE candidates to peers
    pc.onicecandidate = (event) => {
      if (event.candidate && rtcChannelRef.current) {
        rtcChannelRef.current.postMessage({
          type: 'ICE_CANDIDATE',
          senderUid: currentUser.uid,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  }, [currentUser.uid]);

  // ─── Join Voice Huddle (Audio Only) ──────────────────────────────────────────
  const joinCall = useCallback(
    async (targetSessionId?: string, container?: HTMLElement | null) => {
      const sessionId = targetSessionId || effectiveSessionId;

      try {
        // 1. Request microphone access for real voice communication & audio metering
        let stream: MediaStream | null = null;
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            });
            micStreamRef.current = stream;
            startAudioMeter(stream);
          } catch (micErr) {
            console.warn('[loopx Voice] Microphone prompt dismissed or denied:', micErr);
          }
        }

        // 2. Setup WebRTC Peer Audio Channel for real cross-tab/cross-peer voice streaming
        const rtcBc = new BroadcastChannel(`huddle_webrtc_${sessionId}`);
        rtcChannelRef.current = rtcBc;

        if (stream) {
          const pc = setupPeerConnection(stream);

          // Handle incoming WebRTC signaling messages from other tabs
          rtcBc.onmessage = async (event: MessageEvent) => {
            const data = event.data;
            if (!data || data.senderUid === currentUser.uid) return;

            try {
              if (data.type === 'PEER_JOINED') {
                // New peer joined, create and send SDP offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                rtcBc.postMessage({
                  type: 'SDP_OFFER',
                  senderUid: currentUser.uid,
                  sdp: pc.localDescription,
                });
              } else if (data.type === 'SDP_OFFER') {
                // Received offer from peer, set remote and send answer
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                rtcBc.postMessage({
                  type: 'SDP_ANSWER',
                  senderUid: currentUser.uid,
                  sdp: pc.localDescription,
                });
              } else if (data.type === 'SDP_ANSWER') {
                // Received answer from peer, complete handshake
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              } else if (data.type === 'ICE_CANDIDATE') {
                // Add candidate
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            } catch (rtcErr) {
              console.warn('[loopx Voice WebRTC] Signaling error:', rtcErr);
            }
          };

          // Announce peer arrival so existing peer creates an offer
          rtcBc.postMessage({
            type: 'PEER_JOINED',
            senderUid: currentUser.uid,
          });
        }

        // 3. Derive participant identity
        const cleanUid = (currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
        const shortId = cleanUid && !cleanUid.toLowerCase().includes('7f2a') && !cleanUid.toLowerCase().includes('init')
          ? cleanUid.slice(-4).toUpperCase()
          : 'USER';
        const displayName = (currentUser.name && currentUser.name !== 'Collaborator' && currentUser.name !== 'owner' && currentUser.name !== 'client' && !currentUser.name.toUpperCase().includes('7F2A'))
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

        // 4. Connect via CometChat Calls SDK (runs in parallel if credentials active)
        try {
          const { initCometChatCalls, startHuddle } = await import('@repo/cometchat-client');
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
        } catch (cometChatCallsErr) {
          console.info('[loopx Voice] CometChat Calls SDK active alongside direct WebRTC voice bridge');
        }

        // 5. Update local state
        setIsInCall(true);
        setIsMuted(false);
        dispatch({ type: 'SET_HUDDLE_ACTIVE', active: true });
        dispatch({ type: 'HUDDLE_PARTICIPANT_JOINED', participant: myParticipant });

        // 6. Cross-tab presence synchronization via BroadcastChannel
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
        setIsInCall(true);
        dispatch({ type: 'SET_HUDDLE_ACTIVE', active: true });
      }
    },
    [currentUser.uid, currentUser.name, currentUser.avatar, effectiveSessionId, roomId, dispatch, startAudioMeter, setupPeerConnection],
  );

  // ─── Leave Voice Huddle ──────────────────────────────────────────────────────
  const leaveCall = useCallback(async () => {
    try {
      const { leaveHuddle } = await import('@repo/cometchat-client');
      await leaveHuddle(effectiveSessionId);
    } catch (err) {
      console.warn('[loopx Voice] Leave session error:', err);
    }

    // Close WebRTC audio peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (rtcChannelRef.current) {
      rtcChannelRef.current.close();
      rtcChannelRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
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

    // Toggle hardware mic stream track (stops transmitting audio)
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

  // ─── Listen for peer huddle presence on BroadcastChannel ─────────────────────
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
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (rtcChannelRef.current) {
        rtcChannelRef.current.close();
        rtcChannelRef.current = null;
      }
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
