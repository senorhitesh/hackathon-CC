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

export async function getSDK() {
  if (CometChat) return CometChat;
  // Dynamic import to avoid SSR issues
  const mod = await import('@cometchat/chat-sdk-javascript');
  CometChat = mod.CometChat;
  return CometChat;
}

// ─── GUID Sanitization ────────────────────────────────────────────────────────

/**
 * Sanitizes an arbitrary room/workspace identifier into a strictly valid CometChat GUID.
 * CometChat rules:
 * - Up to 100 characters.
 * - Alphanumeric (a-z, A-Z, 0-9), hyphens (-), underscores (_).
 * - No commas, no hashes (#), no question marks, no spaces, no slashes.
 */
export function sanitizeCometChatGuid(rawId?: string | null): string {
  if (!rawId) return 'main-studio-workspace';
  let clean = String(rawId).trim();
  // Strip URL paths / protocols if full URL was passed
  if (clean.includes('#room=')) {
    clean = clean.split('#room=')[1]!;
  }
  if (clean.includes('?room=')) {
    clean = clean.split('?room=')[1]!;
  }
  clean = clean.replace(/^[#?]/, '');
  // If in format roomId,roomKey, take only roomId
  if (clean.includes(',')) {
    clean = clean.split(',')[0]!;
  }
  clean = clean.replace(/^room=/i, '');
  // Replace invalid characters with hyphens
  clean = clean.replace(/[^a-zA-Z0-9_-]/g, '-');
  // Collapse multiple consecutive hyphens/underscores
  clean = clean.replace(/[-_]{2,}/g, '-');
  // Trim leading and trailing hyphens/underscores
  clean = clean.replace(/^[-_]+|[-_]+$/g, '');
  // Limit to 90 characters
  clean = clean.slice(0, 90);
  if (!clean || clean.length < 1) {
    return 'main-studio-workspace';
  }
  return clean;
}

// ─── Initialization ─────────────────────────────────────────────────────────────

let _isMockMode = false;
let _initPromise: Promise<boolean> | null = null;

export function isMockMode(): boolean {
  return _isMockMode;
}

export async function initCometChat(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (_chatInitialized) return !_isMockMode;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
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
  })();

  return _initPromise;
}

// ─── Authentication ─────────────────────────────────────────────────────────────

let _activeLoginPromise: Promise<{ uid: string; name: string }> | null = null;
let _activeLoginUid: string | null = null;

export async function loginUser(uid: string): Promise<{ uid: string; name: string }> {
  if (_isMockMode) {
    const mockUser = MOCK_USERS.find((u) => u.uid === uid) ?? MOCK_USERS[0]!;
    return { uid: mockUser.uid, name: mockUser.name };
  }

  const config = getCometChatConfig();
  if (!config) throw new Error('CometChat config unavailable');

  const sdk = await getSDK();

  // Deduplicate concurrent login requests for the exact same UID
  if (_activeLoginPromise && _activeLoginUid?.toLowerCase() === uid.toLowerCase()) {
    console.info('[loopx] Returning active in-flight login promise for:', uid);
    return _activeLoginPromise;
  }

  _activeLoginUid = uid;
  _activeLoginPromise = (async () => {
    try {
      // 1. Check if user is already authenticated in CometChat SDK
      try {
        const current = await sdk.getLoggedinUser();
        if (current) {
          if (current.getUid()?.toLowerCase() === uid.toLowerCase()) {
            console.info('[loopx] Current user already authenticated in CometChat:', uid);
            return { uid: current.getUid(), name: current.getName() };
          }
          console.info('[loopx] Logging out previous session:', current.getUid());
          try {
            await sdk.logout();
            await new Promise((r) => setTimeout(r, 150));
          } catch (_) {}
        }
      } catch (_) {}

      // 2. Perform login with retry logic for concurrent or locked sessions
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const user = await sdk.login(uid, config.authKey);
          console.info('[loopx] 🟢 CometChat login SUCCESS for UID:', user.getUid(), 'Name:', user.getName());
          return { uid: user.getUid(), name: user.getName() };
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          const isPending = msg.includes('wait until the previous login request ends') || err?.code === -1 || err?.code === '-1';
          if (isPending) {
            console.warn(`[loopx] Concurrent login in progress (attempt ${attempt + 1}/4), waiting 450ms...`);
            await new Promise((r) => setTimeout(r, 450));
            try {
              const current = await sdk.getLoggedinUser();
              if (current && current.getUid()?.toLowerCase() === uid.toLowerCase()) {
                console.info('[loopx] Concurrent login resolved successfully for:', uid);
                return { uid: current.getUid(), name: current.getName() };
              }
            } catch (_) {}
            continue;
          }
          console.error('[loopx] ❌ CometChat login failed:', err?.code, err?.message, err?.details);
          throw err;
        }
      }
      throw new Error(`Failed to log in as ${uid} after retries`);
    } finally {
      _activeLoginPromise = null;
      _activeLoginUid = null;
    }
  })();

  return _activeLoginPromise;
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
    // @ts-ignore
    const { subscribeMockEvents } = await import('./mock');
    const unsub = subscribeMockEvents((event: any) => {
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

// ─── Real-Time Collaboration & Presence Sync (Multi-tab, Incognito & Remote) ─

export const COLLAB_SYNC_CUSTOM_TYPE = 'canvas_collab_sync';

export async function sendCollabSyncMessage(
  roomId: string,
  payload: Record<string, any>,
): Promise<void> {
  if (_isMockMode) return;

  const cleanRoomId = sanitizeCometChatGuid(roomId);

  try {
    const sdk = await getSDK();
    const customData = {
      ...payload,
      _customType: COLLAB_SYNC_CUSTOM_TYPE,
      timestamp: Date.now(),
    };

    const message = new sdk.CustomMessage(
      cleanRoomId,
      sdk.RECEIVER_TYPE.GROUP,
      COLLAB_SYNC_CUSTOM_TYPE,
      customData,
    );
    message.setShouldUpdateConversation(false);

    try {
      await sdk.sendCustomMessage(message);
    } catch (_) {
      try {
        await joinCometChatGroup(cleanRoomId, 'public');
        await sdk.sendCustomMessage(message);
      } catch (_) {}
    }
  } catch (_) {
    // Non-critical: ignore rate limits or network blips
  }
}

export async function addCollabSyncListener(
  listenerId: string,
  onSync: (payload: any) => void,
): Promise<() => void> {
  if (_isMockMode) return () => {};

  try {
    const sdk = await getSDK();
    const listener = new sdk.MessageListener(listenerId, {
      onCustomMessageReceived: (message: any) => {
        try {
          const type = message.getType?.() || message.type;
          if (type === COLLAB_SYNC_CUSTOM_TYPE) {
            const data = message.getCustomData?.() || message.customData || message.data?.customData;
            if (data) {
              const sender = message.getSender?.()?.getUid?.() || message.sender?.uid;
              onSync({ ...data, _senderUid: sender });
            }
          }
        } catch (_) {}
      },
    });

    sdk.addMessageListener(listenerId, listener);
    return () => {
      try {
        sdk.removeMessageListener(listenerId);
      } catch (_) {}
    };
  } catch (err) {
    return () => {};
  }
}

// ─── Connection Listener & Status ────────────────────────────────────────────

export interface ConnectionCallbacks {
  inConnecting?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onFeatureThrottled?: () => void;
  onConnectionError?: (e: any) => void;
}

export async function addConnectionListener(
  listenerId: string,
  callbacks: ConnectionCallbacks,
): Promise<() => void> {
  if (_isMockMode) return () => {};

  try {
    const sdk = await getSDK();
    try {
      sdk.removeConnectionListener(listenerId);
    } catch (_) {}

    const listener = new sdk.ConnectionListener({
      inConnecting: () => callbacks.inConnecting?.(),
      onConnected: () => callbacks.onConnected?.(),
      onDisconnected: () => callbacks.onDisconnected?.(),
      onFeatureThrottled: () => callbacks.onFeatureThrottled?.(),
      onConnectionError: (e: any) => callbacks.onConnectionError?.(e),
    });

    sdk.addConnectionListener(listenerId, listener);
    return () => {
      try {
        sdk.removeConnectionListener(listenerId);
      } catch (_) {}
    };
  } catch (err) {
    return () => {};
  }
}

export async function getConnectionStatus(): Promise<string> {
  if (_isMockMode) return 'connected';
  try {
    const sdk = await getSDK();
    return sdk.getConnectionStatus?.() || 'unknown';
  } catch {
    return 'unknown';
  }
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
  metadata?: Record<string, any>,
): Promise<any> {
  const effectiveReceiverId = receiverType === 'group' ? sanitizeCometChatGuid(receiverId) : receiverId;
  if (_isMockMode) {
    console.info('[loopx] CometChat simulation mode: message logged locally.');
    return { id: `mock_${Date.now()}`, text, receiverId: effectiveReceiverId, metadata };
  }

  try {
    const sdk = await getSDK();
    const type = receiverType === 'group' ? sdk.RECEIVER_TYPE.GROUP : sdk.RECEIVER_TYPE.USER;
    const textMessage = new sdk.TextMessage(effectiveReceiverId, text, type);
    if (metadata) {
      textMessage.setMetadata(metadata);
    }
    try {
      return await sdk.sendMessage(textMessage);
    } catch (innerErr: any) {
      if (receiverType === 'group') {
        await joinCometChatGroup(effectiveReceiverId, 'public');
        return await sdk.sendMessage(textMessage);
      }
      throw innerErr;
    }
  } catch (err: any) {
    console.warn('[loopx] CometChat sendTextMessage warning:', effectiveReceiverId, err?.code, err?.message);
    return { id: `msg_${Date.now()}`, text, receiverId: effectiveReceiverId, metadata };
  }
}

// ─── Real CometChat Media Messaging (Cloud S3 Hosted) ──────────────────────────

export async function sendCometChatMediaMessage(
  receiverId: string,
  file: File | Blob,
  mediaType: 'image' | 'video' | 'file' | 'audio' = 'image',
  receiverType: 'user' | 'group' = 'group',
  caption?: string,
  metadata?: Record<string, any>,
): Promise<any> {
  const effectiveReceiverId = receiverType === 'group' ? sanitizeCometChatGuid(receiverId) : receiverId;
  if (_isMockMode) {
    console.info('[loopx] CometChat simulation mode: media message simulated.');
    const preview = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
    return {
      id: `mock_media_${Date.now()}`,
      receiverId: effectiveReceiverId,
      metadata,
      caption,
      data: {
        url: preview,
        name: (file as File).name || 'media-asset',
        type: mediaType,
      },
    };
  }

  try {
    const sdk = await getSDK();
    const type = receiverType === 'group' ? sdk.RECEIVER_TYPE.GROUP : sdk.RECEIVER_TYPE.USER;

    let cometChatMediaType = sdk.MESSAGE_TYPE.IMAGE;
    if (mediaType === 'video') cometChatMediaType = sdk.MESSAGE_TYPE.VIDEO;
    else if (mediaType === 'file') cometChatMediaType = sdk.MESSAGE_TYPE.FILE;
    else if (mediaType === 'audio') cometChatMediaType = sdk.MESSAGE_TYPE.AUDIO;

    // Ensure we pass a proper File object with name & mime type
    const uploadFile =
      file instanceof File
        ? file
        : new File([file], metadata?.mediaName || `voice-${Date.now()}.webm`, {
            type: file.type || (mediaType === 'audio' ? 'audio/webm' : 'application/octet-stream'),
          });

    const mediaMessage = new sdk.MediaMessage(effectiveReceiverId, uploadFile, cometChatMediaType, type);
    if (caption) {
      mediaMessage.setCaption(caption);
    }
    if (metadata) {
      mediaMessage.setMetadata(metadata);
    }

    const sentMsg = await sdk.sendMediaMessage(mediaMessage);
    return sentMsg;
  } catch (err: any) {
    console.warn('[loopx] CometChat sendMediaMessage warning:', effectiveReceiverId, err?.code, err?.message);
    // If audio media upload fails, fall back to sending via custom metadata / text message
    if (mediaType === 'audio') {
      try {
        console.info('[loopx] Falling back to text message for voice memo...');
        return await sendCometChatMessage(
          effectiveReceiverId,
          caption || '🎙️ Voice memo',
          receiverType,
          {
            ...metadata,
            mediaType: 'audio',
          },
        );
      } catch (fallbackErr) {
        console.warn('[loopx] Voice memo fallback failed:', fallbackErr);
      }
    }
    throw err;
  }
}

export async function fetchOnlineGroupMembers(groupId: string): Promise<{ uid: string; name: string; status: 'ONLINE' | 'OFFLINE' | 'AWAY' }[]> {
  const cleanGroupId = sanitizeCometChatGuid(groupId);
  if (_isMockMode) return [];
  try {
    const sdk = await getSDK();
    const groupMembersRequest = new sdk.GroupMembersRequestBuilder(cleanGroupId)
      .setLimit(30)
      .build();
    const members = await groupMembersRequest.fetchNext();
    if (!members) return [];
    return members
      .filter((m: any) => {
        const rawStatus = (m.getStatus?.() || m.status || '').toLowerCase();
        return rawStatus === 'online';
      })
      .map((m: any) => ({
        uid: m.getUid?.() || m.uid,
        name: m.getName?.() || m.name || 'Collaborator',
        status: 'ONLINE' as const,
      }));
  } catch (err) {
    return [];
  }
}

export async function fetchCometChatMessageHistory(
  receiverId: string,
  limit: number = 30,
): Promise<any[]> {
  const cleanReceiverId = sanitizeCometChatGuid(receiverId);
  if (_isMockMode) return [];

  try {
    const sdk = await getSDK();
    const messagesRequest = new sdk.MessagesRequestBuilder()
      .setGUID(cleanReceiverId)
      .setLimit(limit)
      .build();

    const messages = await messagesRequest.fetchPrevious();
    return messages || [];
  } catch (err: any) {
    console.warn('[loopx] CometChat fetchMessageHistory warning:', cleanReceiverId, err?.code, err?.message);
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
    try {
      sdk.removeMessageListener(listenerId);
    } catch (_) {}

    const listener = new sdk.MessageListener(listenerId, {
      onTextMessageReceived: (textMessage: any) => {
        console.log(
          '[loopx] 📩 CometChat onTextMessageReceived:',
          textMessage?.getText?.() || textMessage?.text,
          'from:',
          textMessage?.getSender?.()?.getUid?.() || textMessage?.sender?.uid,
        );
        onMessageReceived(textMessage);
      },
      onMediaMessageReceived: (mediaMessage: any) => {
        console.log(
          '[loopx] 📩 CometChat onMediaMessageReceived from:',
          mediaMessage?.getSender?.()?.getUid?.() || mediaMessage?.sender?.uid,
        );
        onMessageReceived(mediaMessage);
      },
      onCustomMessageReceived: (customMessage: any) => {
        onMessageReceived(customMessage);
      },
    });

    sdk.addMessageListener(listenerId, listener);
    return () => {
      try {
        sdk.removeMessageListener(listenerId);
      } catch (_) {}
    };
  } catch (err) {
    return () => {};
  }
}

// ─── CometChat Group Management ──────────────────────────────────────────────

/**
 * Creates a CometChat group for a workspace/room.
 * Returns the group object or null on failure.
 */
export async function createCometChatGroup(
  groupId: string,
  groupName: string,
  groupType: 'public' | 'password' | 'private' = 'public',
): Promise<any> {
  const cleanGuid = sanitizeCometChatGuid(groupId);
  if (_isMockMode) {
    console.info('[loopx] Mock mode: group creation simulated for', cleanGuid);
    return { guid: cleanGuid, name: groupName, type: groupType };
  }

  try {
    const sdk = await getSDK();
    const type =
      groupType === 'password'
        ? sdk.GROUP_TYPE.PASSWORD
        : groupType === 'private'
          ? sdk.GROUP_TYPE.PRIVATE
          : sdk.GROUP_TYPE.PUBLIC;

    const group = new sdk.Group(cleanGuid, groupName || 'Creative Workspace', type);
    const created = await sdk.createGroup(group);
    console.info('[loopx] CometChat group created:', cleanGuid);
    return created;
  } catch (err: any) {
    // ERR_GROUP_ALREADY_EXISTS — that's fine, just fetch it
    const code = (err?.code || '').toLowerCase();
    const msg = (err?.message || '').toLowerCase();
    if (code === 'err_group_already_exists' || msg.includes('already exists')) {
      console.info('[loopx] Group already exists, fetching:', cleanGuid);
      return getCometChatGroup(cleanGuid);
    }
    console.warn('[loopx] CometChat createGroup warning:', cleanGuid, err?.code, err?.message);
    return null;
  }
}

/**
 * Fetches an existing CometChat group by GUID.
 */
export async function getCometChatGroup(groupId: string): Promise<any> {
  const cleanGuid = sanitizeCometChatGuid(groupId);
  if (_isMockMode) return { guid: cleanGuid };

  try {
    const sdk = await getSDK();
    return await sdk.getGroup(cleanGuid);
  } catch (err: any) {
    console.warn('[loopx] CometChat getGroup warning:', cleanGuid, err?.code, err?.message);
    return null;
  }
}

/**
 * Joins a CometChat group with retry loop. Handles "already joined" silently.
 */
export async function joinCometChatGroup(
  groupId: string,
  groupType: 'public' | 'password' | 'private' = 'public',
  password?: string,
): Promise<boolean> {
  const cleanGuid = sanitizeCometChatGuid(groupId);
  if (_isMockMode) return true;

  try {
    const sdk = await getSDK();
    const type =
      groupType === 'password'
        ? sdk.GROUP_TYPE.PASSWORD
        : groupType === 'private'
          ? sdk.GROUP_TYPE.PRIVATE
          : sdk.GROUP_TYPE.PUBLIC;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await sdk.joinGroup(cleanGuid, type, password || '');
        console.info('[loopx] Joined CometChat group successfully:', cleanGuid);
        return true;
      } catch (err: any) {
        const code = (err?.code || '').toLowerCase();
        const msg = (err?.message || '').toLowerCase();
        const details = JSON.stringify(err?.details || '').toLowerCase();
        if (
          code === 'err_already_joined' ||
          msg.includes('already joined') ||
          msg.includes('already a member') ||
          msg.includes('already_joined') ||
          details.includes('already joined') ||
          details.includes('already a member')
        ) {
          console.info('[loopx] User already member of CometChat group:', cleanGuid);
          return true;
        }
        if (code === 'err_group_not_found' || code === 'err_guid_not_found' || msg.includes('not found')) {
          console.warn(`[loopx] Group ${cleanGuid} not found yet (attempt ${attempt + 1}/5), retrying in 1.2s...`);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        console.warn('[loopx] CometChat joinGroup warning:', cleanGuid, err?.code, err?.message);
        break;
      }
    }
    return false;
  } catch (err: any) {
    console.warn('[loopx] CometChat joinGroup outer error:', cleanGuid, err);
    return false;
  }
}

/**
 * Creates a group if it doesn't exist, then joins the current user to it.
 */
export async function getOrCreateGroup(
  groupId: string,
  groupName: string,
): Promise<any> {
  const cleanGuid = sanitizeCometChatGuid(groupId);
  if (_isMockMode) {
    return { guid: cleanGuid, name: groupName };
  }

  const sdk = await getSDK();
  // Verify user is logged in first!
  const current = await sdk.getLoggedinUser();
  if (!current) {
    console.error('[loopx] ❌ Cannot getOrCreateGroup: No user is logged in to CometChat!');
    return null;
  }

  // Try to create (will return existing if already created)
  const group = await createCometChatGroup(cleanGuid, groupName, 'public');

  // Join the group (will silently succeed if already a member or owner)
  await joinCometChatGroup(cleanGuid, 'public');

  // Fetch verified group object with real hasJoined status
  try {
    const verifiedGroup = await sdk.getGroup(cleanGuid);
    return verifiedGroup || group;
  } catch (err: any) {
    console.warn('[loopx] ⚠️ getGroup verification fallback:', cleanGuid, err?.code, err?.message);
    return group;
  }
}

// ─── CometChat User Management ──────────────────────────────────────────────

/**
 * Creates a CometChat user if they don't exist, then logs them in.
 * Returns { uid, name } on success.
 */
export async function createOrGetUser(
  uid: string,
  name: string,
): Promise<{ uid: string; name: string }> {
  if (_isMockMode) {
    return { uid, name };
  }

  const config = getCometChatConfig();
  if (!config) throw new Error('CometChat config unavailable');

  const sdk = await getSDK();

  // Try to create user via SDK
  try {
    const user = new sdk.User(uid);
    user.setName(name);
    await sdk.createUser(user, config.authKey);
    console.info('[loopx] CometChat user created successfully:', uid);
  } catch (err: any) {
    const code = (err?.code || '').toLowerCase();
    const msg = (err?.message || '').toLowerCase();
    const details = JSON.stringify(err?.details || '').toLowerCase();
    if (
      code === 'err_uid_already_exists' ||
      msg.includes('already exists') ||
      details.includes('already exists') ||
      msg.includes('already_exists')
    ) {
      console.info('[loopx] User already exists in CometChat:', uid);
    } else {
      console.warn('[loopx] ⚠️ CometChat createUser returned warning:', err?.code, err?.message);
    }
  }

  // Now login
  return loginUser(uid);
}

/**
 * Gets the currently logged-in CometChat user, or null if not logged in.
 */
export async function getLoggedInUser(): Promise<{ uid: string; name: string } | null> {
  if (_isMockMode) {
    const mockUser = MOCK_USERS[0]!;
    return { uid: mockUser.uid, name: mockUser.name };
  }

  try {
    const sdk = await getSDK();
    const user = await sdk.getLoggedinUser();
    if (user) {
      return { uid: user.getUid(), name: user.getName() };
    }
    return null;
  } catch {
    return null;
  }
}

