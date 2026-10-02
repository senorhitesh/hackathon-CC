// ─── CometChat Calls SDK Wrapper ─────────────────────────────────────────────
// Wraps @cometchat/calls-sdk-javascript v5.x for 1-click voice/video huddles.
// Falls back to simulated huddle mode when credentials are absent.

import type { HuddleParticipant } from '@repo/types';
import { getCometChatConfig } from './config';
import {
  broadcastMockEvent,
  getMockCurrentUser,
  setMockHuddleState,
  getMockHuddleState,
} from './mock';
import { isMockMode } from './chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CometChatCalls: any = null;

export async function getCallsSDK() {
  if (CometChatCalls) return CometChatCalls;
  const mod = await import('@cometchat/calls-sdk-javascript');
  CometChatCalls = mod.CometChatCalls;
  return CometChatCalls;
}

export async function generateCallToken(sessionId: string): Promise<string> {
  const sdk = await getCallsSDK();
  const tokenResult = await sdk.generateToken(sessionId);
  return tokenResult.token;
}

let _callsInitialized = false;

// ─── Initialize Calls SDK ──────────────────────────────────────────────────────

export async function initCometChatCalls(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isMockMode()) return true; // Simulated mode handles its own state

  const config = getCometChatConfig();
  if (!config) return false;

  try {
    const sdk = await getCallsSDK();
    const callAppSettings = new sdk.CallAppSettingsBuilder()
      .setAppId(config.appId)
      .setRegion(config.region)
      .build();

    await sdk.init(callAppSettings);
    _callsInitialized = true;
    return true;
  } catch (err) {
    console.error('[loopx Calls] Init failed:', err);
    return false;
  }
}

// ─── Start / Join Voice Huddle (Audio Only) ───────────────────────────────────

export interface HuddleOptions {
  sessionId: string;
  isVideo?: boolean;
  container?: HTMLElement | null;
  onParticipantJoined?: (participant: HuddleParticipant) => void;
  onParticipantLeft?: (uid: string) => void;
  onHuddleEnded?: () => void;
}

export async function startHuddle(options: HuddleOptions): Promise<void> {
  const { sessionId, container, onParticipantJoined, onParticipantLeft, onHuddleEnded } = options;

  if (isMockMode()) {
    const currentUser = getMockCurrentUser();
    const participant: HuddleParticipant = {
      uid: currentUser.uid,
      name: currentUser.name,
      avatar: currentUser.avatar,
      isMuted: false,
      isVideoOff: true,
      isSpeaking: false,
    };
    setMockHuddleState({
      sessionId,
      participants: [participant],
      localMuted: false,
      localVideoOff: true,
    });
    broadcastMockEvent({ type: 'HUDDLE_STARTED', sessionId, participant });
    onParticipantJoined?.(participant);
    return;
  }

  const sdk = await getCallsSDK();
  const config = getCometChatConfig();
  if (!config) throw new Error('CometChat config unavailable');

  // Generate a session token
  const tokenResult = await sdk.generateToken(sessionId);
  const token: string = tokenResult.token;

  const targetContainer =
    container ||
    (typeof document !== 'undefined'
      ? document.getElementById('cometchat-audio-container') || document.body
      : null);

  const callSettings = new sdk.CallSettingsBuilder()
    .setSessionID(sessionId)
    .enableDefaultLayout(false) // Custom audio HUD
    .setIsAudioOnlyCall(true) // Voice only — strictly no video
    .build();

  await sdk.joinSession(
    token,
    targetContainer,
    callSettings,
    {
      onUserJoined: (user: { uid: string; name: string }) => {
        const participant: HuddleParticipant = {
          uid: user.uid,
          name: user.name,
          isMuted: false,
          isVideoOff: true,
          isSpeaking: false,
        };
        onParticipantJoined?.(participant);
      },
      onUserLeft: (user: { uid: string }) => {
        onParticipantLeft?.(user.uid);
      },
      onCallEnded: () => {
        onHuddleEnded?.();
      },
    },
  );
}

// ─── Leave Huddle ──────────────────────────────────────────────────────────────

export async function leaveHuddle(sessionId?: string): Promise<void> {
  if (isMockMode()) {
    const state = getMockHuddleState();
    if (!state) return;
    const currentUser = getMockCurrentUser();
    broadcastMockEvent({ type: 'HUDDLE_ENDED', sessionId: state.sessionId, uid: currentUser.uid });
    setMockHuddleState(null);
    return;
  }

  try {
    const sdk = await getCallsSDK();
    await sdk.endSession();
  } catch (err) {
    console.error('[loopx Calls] Leave huddle failed:', err);
  }
}

// ─── Toggle Mute ──────────────────────────────────────────────────────────────

export async function toggleMute(muted: boolean): Promise<void> {
  if (isMockMode()) {
    const state = getMockHuddleState();
    if (state) setMockHuddleState({ ...state, localMuted: muted });
    return;
  }

  try {
    const sdk = await getCallsSDK();
    if (muted) {
      sdk.muteAudio(true);
    } else {
      sdk.muteAudio(false);
    }
  } catch (_) {
    // no-op
  }
}

// ─── Toggle Video ──────────────────────────────────────────────────────────────

export async function toggleVideo(videoOff: boolean): Promise<void> {
  if (isMockMode()) {
    const state = getMockHuddleState();
    if (state) setMockHuddleState({ ...state, localVideoOff: videoOff });
    return;
  }

  try {
    const sdk = await getCallsSDK();
    sdk.pauseVideo(videoOff);
  } catch (_) {
    // no-op
  }
}
