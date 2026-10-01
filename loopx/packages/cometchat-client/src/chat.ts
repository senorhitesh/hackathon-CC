// ─── CometChat Chat SDK Wrapper ──────────────────────────────────────────────
// Handles init, auth, custom message sending (annotations), and real-time listeners.
// Falls back to mock/sim mode when credentials are unavailable.

import type {
  PinAnnotation,
  CometChatCustomPayload,
  AnnotationAction,
} from '@repo/types';
import {
  getCometChatConfig,
  ANNOTATION_CUSTOM_TYPE,
} from './config';
import {
  broadcastMockEvent,
  playAnnotationChime,
  MOCK_USERS,
} from './mock';

// ─── SDK Lazy Load (browser-only) ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CometChat: any = null;
let _chatInitialized = false;

async function getSDK() {
  if (CometChat) return CometChat;
  // Dynamic import to avoid SSR issues
  const mod = await import('@cometchat/chat-sdk-javascript');
  CometChat = mod.CometChat;
  return CometChat;
}

// ─── Initialization ─────────────────────────────────────────────────────────────

let _isMockMode = false;

export function isMockMode(): boolean {
  return _isMockMode;
}

export async function initCometChat(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const config = getCometChatConfig();

  if (!config) {
    console.info(
      '[loopx] CometChat credentials not found — running in collaborative simulation mode.',
    );
    _isMockMode = true;
    _chatInitialized = true;
    return false;
  }

  try {
    const sdk = await getSDK();
    const appSettings = new sdk.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(config.region)
      .autoEstablishSocketConnection(true)
      .build();

    await sdk.init(config.appId, appSettings);
    _chatInitialized = true;
    _isMockMode = false;
    console.info('[loopx] CometChat initialized successfully.');
    return true;
  } catch (err) {
    console.error('[loopx] CometChat init failed, falling back to simulation mode:', err);
    _isMockMode = true;
    _chatInitialized = true;
    return false;
  }
}

// ─── Authentication ─────────────────────────────────────────────────────────────

export async function loginUser(uid: string): Promise<{ uid: string; name: string }> {
  if (_isMockMode) {
    const mockUser = MOCK_USERS.find((u) => u.uid === uid) ?? MOCK_USERS[0]!;
    return { uid: mockUser.uid, name: mockUser.name };
  }

  const config = getCometChatConfig();
  if (!config) throw new Error('CometChat config unavailable');

  const sdk = await getSDK();
  const user = await sdk.login(uid, config.authKey);
  return { uid: user.getUid(), name: user.getName() };
}

export async function logoutUser(): Promise<void> {
  if (_isMockMode) return;
  const sdk = await getSDK();
  await sdk.logout();
}

// ─── Send Annotation ────────────────────────────────────────────────────────────

export async function sendAnnotation(
  roomId: string,
  annotation: PinAnnotation,
  action: AnnotationAction = 'CREATE',
): Promise<void> {
  if (_isMockMode) {
    // Simulate cross-tab delivery
    if (action === 'CREATE') {
      broadcastMockEvent({ type: 'ANNOTATION_CREATED', annotation });
    } else if (action === 'RESOLVE') {
      broadcastMockEvent({
        type: 'ANNOTATION_RESOLVED',
        annotationId: annotation.id,
        resolvedBy: annotation.resolvedBy ?? annotation.authorId,
      });
    } else {
      broadcastMockEvent({ type: 'ANNOTATION_REOPENED', annotationId: annotation.id });
    }
    return;
  }

  const sdk = await getSDK();
  const customData: CometChatCustomPayload = {
    type: ANNOTATION_CUSTOM_TYPE,
    action,
    annotation,
  };

  const message = new sdk.CustomMessage(
    roomId,
    sdk.RECEIVER_TYPE.GROUP,
    ANNOTATION_CUSTOM_TYPE,
    customData,
  );
  message.setShouldUpdateConversation(false);

  await sdk.sendCustomMessage(message);
}

export async function resolveAnnotation(
  roomId: string,
  annotationId: string,
  resolvedBy: string,
  fullAnnotation: PinAnnotation,
): Promise<void> {
  const resolved: PinAnnotation = {
    ...fullAnnotation,
    status: 'RESOLVED',
    resolvedAt: Date.now(),
    resolvedBy,
  };
  return sendAnnotation(roomId, resolved, 'RESOLVE');
}

export async function reopenAnnotation(
  roomId: string,
  annotationId: string,
  fullAnnotation: PinAnnotation,
): Promise<void> {
  const reopened: PinAnnotation = {
    ...fullAnnotation,
    status: 'OPEN',
    resolvedAt: undefined,
    resolvedBy: undefined,
  };
  return sendAnnotation(roomId, reopened, 'REOPEN');
}

// ─── Message Listener ──────────────────────────────────────────────────────────

export interface AnnotationListenerCallbacks {
  onAnnotationCreated: (annotation: PinAnnotation) => void;
  onAnnotationResolved: (annotationId: string, resolvedBy: string, full: PinAnnotation) => void;
  onAnnotationReopened: (annotationId: string, full: PinAnnotation) => void;
}

export async function addAnnotationListener(
  listenerId: string,
  callbacks: AnnotationListenerCallbacks,
): Promise<() => void> {
  if (_isMockMode) {
    // In mock mode, subscribe to the BroadcastChannel
    const { subscribeMockEvents } = await import('./mock');
    const unsub = subscribeMockEvents((event) => {
      if (event.type === 'ANNOTATION_CREATED') {
        playAnnotationChime();
        callbacks.onAnnotationCreated(event.annotation);
      } else if (event.type === 'ANNOTATION_RESOLVED') {
        // Find the annotation in state via annotationId — caller handles merge
        callbacks.onAnnotationResolved(event.annotationId, event.resolvedBy, {
          id: event.annotationId,
        } as PinAnnotation);
      } else if (event.type === 'ANNOTATION_REOPENED') {
        callbacks.onAnnotationReopened(event.annotationId, { id: event.annotationId } as PinAnnotation);
      }
    });
    return unsub;
  }

  const sdk = await getSDK();

  const listener = new sdk.MessageListener(listenerId, {
    onCustomMessageReceived: (message: {
      getCustomData: () => CometChatCustomPayload;
    }) => {
      const payload = message.getCustomData() as CometChatCustomPayload;
      if (payload.type !== ANNOTATION_CUSTOM_TYPE) return;

      playAnnotationChime();

      if (payload.action === 'CREATE') {
        callbacks.onAnnotationCreated(payload.annotation);
      } else if (payload.action === 'RESOLVE') {
        callbacks.onAnnotationResolved(
          payload.annotation.id,
          payload.annotation.resolvedBy ?? '',
          payload.annotation,
        );
      } else if (payload.action === 'REOPEN') {
        callbacks.onAnnotationReopened(payload.annotation.id, payload.annotation);
      }
    },
  });

  sdk.addMessageListener(listenerId, listener);

  return () => {
    sdk.removeMessageListener(listenerId);
  };
}

// ─── Presence Listener ─────────────────────────────────────────────────────────

export interface PresenceCallbacks {
  onUserOnline: (uid: string, name: string) => void;
  onUserOffline: (uid: string) => void;
}

export async function addPresenceListener(
  listenerId: string,
  callbacks: PresenceCallbacks,
): Promise<() => void> {
  if (_isMockMode) return () => {};

  const sdk = await getSDK();

  const listener = new sdk.UserListener(listenerId, {
    onUserOnline: (user: { getUid: () => string; getName: () => string }) => {
      callbacks.onUserOnline(user.getUid(), user.getName());
    },
    onUserOffline: (user: { getUid: () => string }) => {
      callbacks.onUserOffline(user.getUid());
    },
  });

  sdk.addUserListener(listenerId, listener);
  return () => sdk.removeUserListener(listenerId);
}

// ─── Real CometChat Text Messaging ──────────────────────────────────────────────

export async function sendCometChatMessage(
  receiverId: string,
  text: string,
  receiverType: 'user' | 'group' = 'group',
): Promise<any> {
  if (_isMockMode) {
    console.info('[loopx] CometChat simulation mode: message logged locally.');
    return { id: `mock_${Date.now()}`, text, receiverId };
  }

  try {
    const sdk = await getSDK();
    const type = receiverType === 'group' ? sdk.RECEIVER_TYPE.GROUP : sdk.RECEIVER_TYPE.USER;
    const textMessage = new sdk.TextMessage(receiverId, text, type);
    const sentMsg = await sdk.sendMessage(textMessage);
    return sentMsg;
  } catch (err) {
    console.warn('[loopx] CometChat sendTextMessage warning:', err);
    return { id: `msg_${Date.now()}`, text, receiverId };
  }
}

export async function fetchCometChatMessageHistory(
  receiverId: string,
  limit: number = 30,
): Promise<any[]> {
  if (_isMockMode) return [];

  try {
    const sdk = await getSDK();
    const messagesRequest = new sdk.MessagesRequestBuilder()
      .setGUID(receiverId)
      .setLimit(limit)
      .build();

    const messages = await messagesRequest.fetchPrevious();
    return messages || [];
  } catch (err) {
    console.warn('[loopx] CometChat fetchMessageHistory warning:', err);
    return [];
  }
}

export async function addCometChatMessageListener(
  listenerId: string,
  onMessageReceived: (message: any) => void,
): Promise<() => void> {
  if (_isMockMode) return () => {};

  try {
    const sdk = await getSDK();
    const listener = new sdk.MessageListener(listenerId, {
      onTextMessageReceived: (textMessage: any) => {
        onMessageReceived(textMessage);
      },
      onCustomMessageReceived: (customMessage: any) => {
        onMessageReceived(customMessage);
      },
    });

    sdk.addMessageListener(listenerId, listener);
    return () => sdk.removeMessageListener(listenerId);
  } catch (err) {
    return () => {};
  }
}

