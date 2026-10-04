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

  try {
    const sdk = await getSDK();
    const customData = {
      ...payload,
      _customType: COLLAB_SYNC_CUSTOM_TYPE,
      timestamp: Date.now(),
    };

    const message = new sdk.CustomMessage(
      roomId,
      sdk.RECEIVER_TYPE.GROUP,
      COLLAB_SYNC_CUSTOM_TYPE,
      customData,
    );
    message.setShouldUpdateConversation(false);

    await sdk.sendCustomMessage(message);
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
  if (_isMockMode) {
    console.info('[loopx] CometChat simulation mode: message logged locally.');
    return { id: `mock_${Date.now()}`, text, receiverId, metadata };
  }

  try {
    const sdk = await getSDK();
    const type = receiverType === 'group' ? sdk.RECEIVER_TYPE.GROUP : sdk.RECEIVER_TYPE.USER;
    const textMessage = new sdk.TextMessage(receiverId, text, type);
    if (metadata) {
      textMessage.setMetadata(metadata);
    }
    const sentMsg = await sdk.sendMessage(textMessage);
    return sentMsg;
  } catch (err) {
    console.warn('[loopx] CometChat sendTextMessage warning:', err);
    return { id: `msg_${Date.now()}`, text, receiverId, metadata };
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
  if (_isMockMode) {
    console.info('[loopx] CometChat simulation mode: media message simulated.');
    const preview = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
    return {
      id: `mock_media_${Date.now()}`,
      receiverId,
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

    const mediaMessage = new sdk.MediaMessage(receiverId, file, cometChatMediaType, type);
    if (caption) {
      mediaMessage.setCaption(caption);
    }
    if (metadata) {
      mediaMessage.setMetadata(metadata);
    }

    const sentMsg = await sdk.sendMediaMessage(mediaMessage);
    return sentMsg;
  } catch (err) {
    console.warn('[loopx] CometChat sendMediaMessage warning:', err);
    throw err;
  }
}

export async function fetchOnlineGroupMembers(groupId: string): Promise<{ uid: string; name: string; status: 'ONLINE' | 'OFFLINE' | 'AWAY' }[]> {
  if (_isMockMode) return [];
  try {
    const sdk = await getSDK();
    const groupMembersRequest = new sdk.GroupMembersRequestBuilder(groupId)
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
      onMediaMessageReceived: (mediaMessage: any) => {
        onMessageReceived(mediaMessage);
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
  if (_isMockMode) {
    console.info('[loopx] Mock mode: group creation simulated for', groupId);
    return { guid: groupId, name: groupName, type: groupType };
  }

  try {
    const sdk = await getSDK();
    const type =
      groupType === 'password'
        ? sdk.GROUP_TYPE.PASSWORD
        : groupType === 'private'
          ? sdk.GROUP_TYPE.PRIVATE
          : sdk.GROUP_TYPE.PUBLIC;

    const group = new sdk.Group(groupId, groupName, type);
    const created = await sdk.createGroup(group);
    console.info('[loopx] CometChat group created:', groupId);
    return created;
  } catch (err: any) {
    // ERR_GROUP_ALREADY_EXISTS — that's fine, just fetch it
    if (err?.code === 'ERR_GROUP_ALREADY_EXISTS' || err?.message?.includes('already exists')) {
      console.info('[loopx] Group already exists, fetching:', groupId);
      return getCometChatGroup(groupId);
    }
    console.warn('[loopx] CometChat createGroup warning:', err);
    return null;
  }
}

/**
 * Fetches an existing CometChat group by GUID.
 */
export async function getCometChatGroup(groupId: string): Promise<any> {
  if (_isMockMode) return { guid: groupId };

  try {
    const sdk = await getSDK();
    return await sdk.getGroup(groupId);
  } catch (err) {
    console.warn('[loopx] CometChat getGroup warning:', err);
    return null;
  }
}

/**
 * Joins a CometChat group. Handles "already joined" silently.
 */
export async function joinCometChatGroup(
  groupId: string,
  groupType: 'public' | 'password' | 'private' = 'public',
  password?: string,
): Promise<boolean> {
  if (_isMockMode) return true;

  try {
    const sdk = await getSDK();
    const type =
      groupType === 'password'
        ? sdk.GROUP_TYPE.PASSWORD
        : groupType === 'private'
          ? sdk.GROUP_TYPE.PRIVATE
          : sdk.GROUP_TYPE.PUBLIC;

    await sdk.joinGroup(groupId, type, password || '');
    console.info('[loopx] Joined CometChat group:', groupId);
    return true;
  } catch (err: any) {
    // ERR_ALREADY_JOINED — silently succeed
    if (err?.code === 'ERR_ALREADY_JOINED' || err?.message?.includes('already joined')) {
      return true;
    }
    console.warn('[loopx] CometChat joinGroup warning:', err);
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
  if (_isMockMode) {
    return { guid: groupId, name: groupName };
  }

  // Try to create (will return existing if already created)
  const group = await createCometChatGroup(groupId, groupName, 'public');

  // Join the group (will silently succeed if already a member)
  await joinCometChatGroup(groupId, 'public');

  return group;
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

  // Try to create user via REST API
  try {
    const user = new sdk.User(uid);
    user.setName(name);
    await sdk.createUser(user, config.authKey);
    console.info('[loopx] CometChat user created:', uid);
  } catch (err: any) {
    // User already exists — that's fine
    if (!err?.message?.includes('already exists') && err?.code !== 'ERR_UID_ALREADY_EXISTS') {
      console.warn('[loopx] CometChat createUser warning:', err);
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

