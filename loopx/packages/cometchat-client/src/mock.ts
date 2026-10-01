// ─── Mock / Simulation Mode ─────────────────────────────────────────────────────
// When CometChat credentials are not provided, loopx operates in collaborative
// simulation mode — all real-time events are dispatched locally via a broadcast
// channel so two browser tabs still behave like two live collaborators.

import type { PinAnnotation, ActiveUser, HuddleParticipant, AnnotationAction } from '@repo/types';
import { ANNOTATION_CUSTOM_TYPE } from './config';

// ─── Simulated Users Pool ───────────────────────────────────────────────────────

export const MOCK_USERS: ActiveUser[] = [
  {
    uid: 'sarah_designer',
    name: 'Sarah Chen',
    avatar: undefined,
    status: 'ONLINE',
  },
  {
    uid: 'alex_artdir',
    name: 'Alex Rivera',
    avatar: undefined,
    status: 'ONLINE',
  },
  {
    uid: 'dev_marketing',
    name: 'Dev Kapoor',
    avatar: undefined,
    status: 'ONLINE',
  },
  {
    uid: 'priya_brand',
    name: 'Priya Nair',
    avatar: undefined,
    status: 'AWAY',
  },
];

// Pick a random mock user for the current session (stable per tab via sessionStorage)
export function getMockCurrentUser(): ActiveUser {
  if (typeof window === 'undefined') return MOCK_USERS[0]!;

  const stored = sessionStorage.getItem('loopx_mock_uid');
  if (stored) {
    return MOCK_USERS.find((u) => u.uid === stored) ?? MOCK_USERS[0]!;
  }
  // Assign a random user to this tab
  const pick = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]!;
  sessionStorage.setItem('loopx_mock_uid', pick.uid);
  return pick;
}

// ─── BroadcastChannel Event Bus ────────────────────────────────────────────────

const CHANNEL_NAME = 'loopx_mock_channel';

export type MockBroadcastEvent =
  | { type: 'ANNOTATION_CREATED'; annotation: PinAnnotation }
  | { type: 'ANNOTATION_RESOLVED'; annotationId: string; resolvedBy: string }
  | { type: 'ANNOTATION_REOPENED'; annotationId: string }
  | { type: 'HUDDLE_STARTED'; sessionId: string; participant: HuddleParticipant }
  | { type: 'HUDDLE_ENDED'; sessionId: string; uid: string }
  | { type: 'USER_JOINED'; user: ActiveUser }
  | { type: 'USER_LEFT'; uid: string };

let _channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return _channel;
}

type EventHandler = (event: MockBroadcastEvent) => void;
const _handlers: Set<EventHandler> = new Set();

export function initMockBroadcast(): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (e: MessageEvent<MockBroadcastEvent>) => {
    _handlers.forEach((h) => h(e.data));
  };
  ch.addEventListener('message', listener);

  return () => {
    ch.removeEventListener('message', listener);
  };
}

export function subscribeMockEvents(handler: EventHandler): () => void {
  _handlers.add(handler);
  return () => _handlers.delete(handler);
}

export function broadcastMockEvent(event: MockBroadcastEvent): void {
  getChannel()?.postMessage(event);
}

// ─── Simulated Huddle State ─────────────────────────────────────────────────────

export interface MockHuddleState {
  sessionId: string;
  participants: HuddleParticipant[];
  localMuted: boolean;
  localVideoOff: boolean;
}

let _huddleState: MockHuddleState | null = null;

export function getMockHuddleState(): MockHuddleState | null {
  return _huddleState;
}

export function setMockHuddleState(state: MockHuddleState | null): void {
  _huddleState = state;
}

// ─── Notification Sound ────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

export function playAnnotationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!_audioCtx) {
      _audioCtx = new AudioContext();
    }
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available (SSR, restricted env) — silent fail
  }
}

export { ANNOTATION_CUSTOM_TYPE };
