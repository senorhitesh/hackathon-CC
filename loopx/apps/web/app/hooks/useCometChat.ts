'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppContext, type ChatMessage } from '../context/AppContext';
import type { PinAnnotation } from '@repo/types';

/**
 * useCometChat — Complete production integration hook.
 *
 * Lifecycle:
 * 1. Initialize CometChat Chat SDK + Calls SDK
 * 2. Create or log in the current user
 * 3. Create or join the CometChat group for the current room
 * 4. Fetch message history and populate chat
 * 5. Register real-time listeners for messages, annotations, and presence
 *
 * Should be mounted once at the workspace level (/app page).
 */
export function useCometChat() {
  const { state, dispatch } = useAppContext();
  const initialized = useRef(false);
  const cleanupRef = useRef<(() => void)[]>([]);
  const currentRoomRef = useRef(state.roomId);

  // Keep room ref in sync
  useEffect(() => {
    currentRoomRef.current = state.roomId;
  }, [state.roomId]);

  // ─── Helper: Map CometChat SDK message → our ChatMessage ───────────────────
  const mapSdkMessage = useCallback(
    (msg: any): ChatMessage | null => {
      try {
        const msgType = (msg.getType?.() || msg.type || '').toLowerCase();
        // Text or media messages
        if (msgType === 'text' || msgType === 'image' || msgType === 'video' || msgType === 'file' || msgType === 'media') {
          const senderUid = msg.getSender?.()?.getUid?.() || msg.sender?.uid || msg.senderUid || '';
          const rawName = msg.getSender?.()?.getName?.() || msg.sender?.name || msg.senderName;
          const shortId = (senderUid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase() || '7F2A';
          const senderName = (rawName && rawName !== 'Collaborator' && rawName !== 'owner' && rawName !== 'client')
            ? rawName
            : `User #${shortId}`;
          const text = msg.getText?.() || msg.text || msg.data?.text || '';
          const id = msg.getId?.()?.toString() || msg.id?.toString() || `cc_${Date.now()}`;
          const sentAt = msg.getSentAt?.() || msg.sentAt || Date.now() / 1000;
          const receiverId = msg.getReceiverId?.() || msg.receiverId || '';

          // Read postId and media info from metadata if present
          let meta = msg.getMetadata?.() || msg.metadata || msg.data?.metadata;
          if (typeof meta === 'string') {
            try {
              meta = JSON.parse(meta);
            } catch (_) {}
          }
          const postId = meta?.postId || receiverId || 'general';
          const mediaUrl = meta?.mediaUrl || (typeof msg.getUrl === 'function' ? msg.getUrl() : msg.data?.url) || (msg.data?.attachments?.[0]?.url);
          const mediaName = meta?.mediaName || (typeof msg.getName === 'function' ? msg.getName() : msg.data?.name) || (msg.data?.attachments?.[0]?.name);
          const mediaType = meta?.mediaType || (msgType === 'video' ? 'video' : 'image');

          if (!text && !mediaUrl) return null;

          return {
            id: `cc_${id}`,
            postId,
            senderUid,
            senderName,
            senderRole: `ID: #${shortId}`,
            text,
            timestamp: typeof sentAt === 'number' && sentAt < 1e12 ? sentAt * 1000 : sentAt,
            mediaUrl,
            mediaName,
            mediaType,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    [state.currentUser.uid, state.currentUser.role],
  );

  // ─── Main Initialization Effect ────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      const {
        initCometChat,
        initCometChatCalls,
        createOrGetUser,
        getOrCreateGroup,
        fetchCometChatMessageHistory,
        fetchOnlineGroupMembers,
        addCometChatMessageListener,
        addAnnotationListener,
        addPresenceListener,
        isMockMode,
        getMockCurrentUser,
        initMockBroadcast,
      } = await import('@repo/cometchat-client');

      // ── Step 1: Init Chat SDK ──────────────────────────────────────────────
      const chatReady = await initCometChat();
      console.info('[loopx] CometChat SDK initialized. Live mode:', chatReady);

      // ── Step 2: Init Calls SDK ─────────────────────────────────────────────
      await initCometChatCalls();

      // ── Step 3: Login / Create User ────────────────────────────────────────
      let loggedInUser: { uid: string; name: string };

      if (isMockMode()) {
        const mockUser = getMockCurrentUser();
        loggedInUser = { uid: mockUser.uid, name: mockUser.name };
      } else {
        // Use current user from AppContext (set during login flow)
        const { uid, name } = state.currentUser;
        loggedInUser = await createOrGetUser(uid, name || 'Collaborator');
      }

      // Update state with authenticated user
      dispatch({
        type: 'SET_USER',
        user: {
          ...state.currentUser,
          uid: loggedInUser.uid,
          name: loggedInUser.name,
          status: 'ONLINE',
          isLoggedIn: true,
        },
      });

      dispatch({
        type: 'USER_JOINED',
        user: { uid: loggedInUser.uid, name: loggedInUser.name, status: 'ONLINE' },
      });

      // ── Step 4: Create/Join CometChat Group for Room ───────────────────────
      const roomId = currentRoomRef.current;
      const group = await getOrCreateGroup(roomId, state.sessionName || 'Creative Workspace');
      console.info('[loopx] CometChat group ready:', roomId, group ? '✓' : '✗');

      // Fetch online group members so collaborators are immediately detected
      if (!isMockMode()) {
        try {
          const members = await fetchOnlineGroupMembers(roomId);
          for (const m of members) {
            if (m.uid !== loggedInUser.uid) {
              dispatch({ type: 'USER_JOINED', user: m });
            }
          }
        } catch (_) {}
      }

      // ── Step 5: Fetch Message History ──────────────────────────────────────
      if (!isMockMode()) {
        try {
          const history = await fetchCometChatMessageHistory(roomId, 50);
          if (history && history.length > 0) {
            const mapped: ChatMessage[] = [];
            for (const msg of history) {
              const chatMsg = mapSdkMessage(msg);
              if (
                chatMsg &&
                !chatMsg.text.toLowerCase().includes('testing cometchat integration live message') &&
                !chatMsg.text.toLowerCase().includes('voice review confirmed. 🎙️ voice review confirmed')
              ) {
                mapped.push(chatMsg);
              }
            }
            if (mapped.length > 0) {
              dispatch({ type: 'SET_CHAT_MESSAGES', messages: mapped });
              console.info(`[loopx] Loaded ${mapped.length} messages from CometChat history.`);
            }
          }
        } catch (err) {
          console.warn('[loopx] Failed to fetch message history:', err);
        }
      }

      // ── Step 6: Real-time Message Listener ─────────────────────────────────
      const messageListenerId = `loopx_chat_${roomId}`;
      const cleanupMessages = await addCometChatMessageListener(
        messageListenerId,
        (message: any) => {
          // Skip our own messages (already dispatched locally)
          const senderUid = message.getSender?.()?.getUid?.() || message.sender?.uid || '';
          if (senderUid === loggedInUser.uid) return;

          const chatMsg = mapSdkMessage(message);
          if (chatMsg) {
            dispatch({ type: 'ADD_CHAT_MESSAGE', message: chatMsg });
          }
        },
      );
      cleanupRef.current.push(cleanupMessages);

      // ── Step 7: Annotation Listener ────────────────────────────────────────
      const annotationListenerId = `loopx_annotations_${roomId}`;
      const cleanupAnnotations = await addAnnotationListener(annotationListenerId, {
        onAnnotationCreated: (annotation: PinAnnotation) => {
          dispatch({ type: 'ADD_ANNOTATION', annotation });
        },
        onAnnotationResolved: (id: string, resolvedBy: string) => {
          dispatch({
            type: 'RESOLVE_ANNOTATION',
            id,
            resolvedBy,
            resolvedAt: Date.now(),
          });
        },
        onAnnotationReopened: (id: string) => {
          dispatch({ type: 'REOPEN_ANNOTATION', id });
        },
      });
      cleanupRef.current.push(cleanupAnnotations);

      // ── Step 8: Presence Listener ──────────────────────────────────────────
      if (isMockMode()) {
        const cleanupMock = initMockBroadcast();
        cleanupRef.current.push(cleanupMock);
      } else {
        const cleanupPresence = await addPresenceListener(`presence_${roomId}`, {
          onUserOnline: (uid, name) => {
            dispatch({ type: 'USER_JOINED', user: { uid, name, status: 'ONLINE' } });
          },
          onUserOffline: (uid) => {
            dispatch({ type: 'USER_LEFT', uid });
          },
        });
        cleanupRef.current.push(cleanupPresence);
      }

      console.info('[loopx] All CometChat listeners registered. Ready for real-time collaboration.');
    }

    init().catch((err) => {
      console.error('[loopx] CometChat initialization failed:', err);
    });

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Send Chat Message via CometChat & BroadcastChannel ───────────────────
  const sendMessage = useCallback(
    async (
      text: string,
      targetPostId?: string,
      media?: { url: string; name?: string; type?: 'image' | 'video' | 'file' }
    ) => {
      if (!text.trim() && !media?.url) return;

      const { sendCometChatMessage, isMockMode } = await import('@repo/cometchat-client');
      const roomId = currentRoomRef.current;
      const effectivePostId = targetPostId || state.activePostId || roomId;

      const shortId = (state.currentUser.uid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '').slice(-4).toUpperCase() || '7F2A';
      const cleanSenderName = (state.currentUser.name && state.currentUser.name !== 'Collaborator' && state.currentUser.name !== 'owner')
        ? state.currentUser.name
        : `User #${shortId}`;

      // Optimistically dispatch locally
      const localMsg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        postId: effectivePostId,
        senderUid: state.currentUser.uid,
        senderName: cleanSenderName,
        senderRole: `ID: #${shortId}`,
        text: text.trim(),
        timestamp: Date.now(),
        mediaUrl: media?.url,
        mediaName: media?.name,
        mediaType: media?.type,
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', message: localMsg });

      // Cross-tab real-time sync
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(`canvas_collab_${roomId}`);
        bc.postMessage({
          type: 'canvas_sync',
          event: 'CHAT_MESSAGE',
          senderUid: state.currentUser.uid,
          message: localMsg,
        });
        bc.close();
      }

      // Send via CometChat SDK (network real-time sync with metadata)
      if (!isMockMode()) {
        try {
          await sendCometChatMessage(roomId, text.trim() || 'Shared media attachment', 'group', {
            postId: effectivePostId,
            mediaUrl: media?.url,
            mediaName: media?.name,
            mediaType: media?.type,
          });
        } catch (err) {
          console.warn('[loopx] Failed to send CometChat message:', err);
        }
      }
    },
    [state.currentUser.uid, state.currentUser.name, state.currentUser.role, state.activePostId, dispatch],
  );

  return { sendMessage };
}
