'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppContext, type ChatMessage } from '../context/AppContext';
import { reconcileElements } from '../data';
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
  const postsRef = useRef(state.posts);

  // Keep room and posts refs in sync
  useEffect(() => {
    currentRoomRef.current = state.roomId;
    postsRef.current = state.posts;
  }, [state.roomId, state.posts]);

  // ─── Helper: Map CometChat SDK message → our ChatMessage ───────────────────
  const mapSdkMessage = useCallback(
    (msg: any): ChatMessage | null => {
      try {
        const msgType = (msg.getType?.() || msg.type || '').toLowerCase();
        // Text, media or audio messages
        if (msgType === 'text' || msgType === 'image' || msgType === 'video' || msgType === 'file' || msgType === 'media' || msgType === 'audio') {
          const senderUid = msg.getSender?.()?.getUid?.() || msg.sender?.uid || msg.senderUid || '';
          const rawName = msg.getSender?.()?.getName?.() || msg.sender?.name || msg.senderName;
          const cleanSender = (senderUid || '').replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
          const shortId = cleanSender && !cleanSender.toLowerCase().includes('7f2a') && !cleanSender.toLowerCase().includes('init')
            ? cleanSender.slice(-4).toUpperCase()
            : Math.random().toString(36).substring(2, 6).toUpperCase();
          const senderName = (rawName && rawName !== 'Collaborator' && rawName !== 'owner' && rawName !== 'client' && !rawName.toUpperCase().includes('7F2A'))
            ? rawName
            : `User #${shortId}`;
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
          const postId = meta?.postId || (receiverId === currentRoomRef.current ? 'general' : receiverId) || 'general';

          // Extract media cloud URL and attachment metadata
          const rawUrl =
            (typeof msg.getAttachment === 'function' ? msg.getAttachment()?.getFileUrl?.() : null) ||
            msg.data?.attachments?.[0]?.url ||
            meta?.mediaUrl ||
            (typeof msg.getUrl === 'function' ? msg.getUrl() : msg.data?.url);

          const rawFileName =
            (typeof msg.getAttachment === 'function' ? msg.getAttachment()?.getFileName?.() : null) ||
            msg.data?.attachments?.[0]?.name ||
            meta?.mediaName ||
            (typeof msg.getName === 'function' ? msg.getName() : msg.data?.name);

          const rawCaption =
            (typeof msg.getCaption === 'function' ? msg.getCaption() : null) ||
            msg.data?.caption ||
            (typeof msg.getText === 'function' ? msg.getText() : msg.text) ||
            msg.data?.text ||
            '';

          const text = rawCaption || '';
          const mediaUrl = rawUrl;
          const mediaName = rawFileName;
          const mediaType = meta?.mediaType || (msgType === 'video' ? 'video' : msgType === 'audio' ? 'audio' : 'image');
          const audioDuration = meta?.audioDuration || meta?.duration;

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
            audioDuration,
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
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const activeEffectIdRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const effectId = Math.random().toString(36).substring(2, 8);
    activeEffectIdRef.current = effectId;
    let isCurrent = true;

    async function init() {
      if (isInitializingRef.current) {
        console.info('[loopx] Init already in progress, awaiting resolution...');
      }
      isInitializingRef.current = true;

      // Clean up previous listeners if any exist
      cleanupRef.current.forEach((fn) => {
        try { fn(); } catch (_) {}
      });
      cleanupRef.current = [];

      const {
        initCometChat,
        initCometChatCalls,
        addConnectionListener,
        getConnectionStatus,
        createOrGetUser,
        sanitizeCometChatGuid,
        getOrCreateGroup,
        fetchCometChatMessageHistory,
        fetchOnlineGroupMembers,
        addCometChatMessageListener,
        addAnnotationListener,
        addPresenceListener,
        sendCollabSyncMessage,
        addCollabSyncListener,
        isMockMode,
        getMockCurrentUser,
        initMockBroadcast,
      } = await import('@repo/cometchat-client');

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

      // ── Step 1: Init Chat SDK ──────────────────────────────────────────────
      const chatReady = await initCometChat();
      console.info('[loopx] CometChat SDK initialized. Live mode:', chatReady);

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

      // ── Step 1.5: Connection Listener for live visibility ──────────────────
      const connCleanup = await addConnectionListener(`loopx_conn_${currentRoomRef.current}_${effectId}`, {
        inConnecting: () => console.log('[loopx] 🔌 CometChat Socket: CONNECTING...'),
        onConnected: () => console.log('[loopx] 🟢 CometChat Socket: CONNECTED ✓'),
        onDisconnected: () => console.warn('[loopx] 🔴 CometChat Socket: DISCONNECTED ✗'),
        onConnectionError: (e: any) => console.error('[loopx] ⚠️ CometChat Socket: ERROR', e),
      });
      cleanupRef.current.push(connCleanup);

      const currentStatus = await getConnectionStatus();
      console.info('[loopx] CometChat connection status:', currentStatus);

      // ── Step 2: Init Calls SDK ─────────────────────────────────────────────
      await initCometChatCalls();

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

      // ── Step 3: Login / Create User ────────────────────────────────────────
      let loggedInUser: { uid: string; name: string };

      if (isMockMode()) {
        const mockUser = getMockCurrentUser();
        loggedInUser = { uid: mockUser.uid, name: mockUser.name };
      } else {
        // Use current user from AppContext or generate fresh tab user
        let userUid = state.currentUser.uid;
        let userName = state.currentUser.name;
        if (!userUid || userUid === 'usr_init' || userUid.toLowerCase().includes('7f2a') || userName?.toUpperCase().includes('7F2A')) {
          const freshShortId = Math.random().toString(36).substring(2, 6).toUpperCase();
          userUid = `usr_${freshShortId.toLowerCase()}`;
          userName = `User ${freshShortId}`;
        }
        // Sanitize UID (letters, numbers, underscores only) and clean userName (no hash)
        userUid = userUid.replace(/[^a-zA-Z0-9_-]/g, '_');
        userName = (userName || 'Studio User').replace(/[#]/g, '').trim() || 'Studio User';

        try {
          loggedInUser = await createOrGetUser(userUid, userName);
        } catch (authErr: any) {
          console.error(
            '[loopx] ❌ CometChat createOrGetUser failed:',
            authErr?.code,
            authErr?.message,
            JSON.stringify(authErr?.details || authErr),
          );
          dispatch({
            type: 'SET_USER',
            user: {
              ...state.currentUser,
              uid: userUid,
              name: userName,
              status: 'ONLINE',
              isLoggedIn: true,
            },
          });
          isInitializingRef.current = false;
          return;
        }
      }

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

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
      const rawRoomId = state.roomId || currentRoomRef.current || 'main-studio-workspace';
      const roomId = sanitizeCometChatGuid(rawRoomId);
      const group = await getOrCreateGroup(roomId, state.sessionName || 'Creative Workspace');
      console.info(
        '[loopx] 🟢 CometChat group joined & ready:',
        roomId,
        'group:',
        group?.getGuid?.() || group?.name || roomId,
      );

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

      // ── Step 5: Fetch Previous Message History from CometChat ───────────────
      try {
        const history = await fetchCometChatMessageHistory(roomId, 40);
        if (Array.isArray(history) && history.length > 0) {
          history.forEach((m: any) => {
            const chatMsg = mapSdkMessage(m);
            if (chatMsg) {
              dispatch({ type: 'ADD_CHAT_MESSAGE', message: chatMsg });
            }
          });
        }
      } catch (histErr) {
        console.warn('[loopx] Failed to fetch message history:', histErr);
      }

      if (!isCurrent || activeEffectIdRef.current !== effectId) return;

      // ── Step 6: Real-time Message Listener ─────────────────────────────────
      const messageListenerId = `loopx_chat_${roomId}_${effectId}`;
      const cleanupMessages = await addCometChatMessageListener(
        messageListenerId,
        (message: any) => {
          // Skip our own messages (already dispatched locally)
          const senderUid = message.getSender?.()?.getUid?.() || message.sender?.uid || '';
          if (senderUid && senderUid.toLowerCase() === loggedInUser.uid.toLowerCase()) {
            return;
          }

          const chatMsg = mapSdkMessage(message);
          if (chatMsg) {
            console.log('[loopx] 📩 Incoming CometChat message received:', chatMsg.text, 'from:', chatMsg.senderName);
            dispatch({ type: 'ADD_CHAT_MESSAGE', message: chatMsg });
          }
        },
      );
      cleanupRef.current.push(cleanupMessages);

      // ── Step 7: Annotation Listener ────────────────────────────────────────
      const annotationListenerId = `loopx_annotations_${roomId}_${effectId}`;
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
        const presenceListenerId = `presence_${roomId}_${effectId}`;
        const cleanupPresence = await addPresenceListener(presenceListenerId, {
          onUserOnline: (uid, name) => {
            if (uid.toLowerCase().includes('7f2a') || uid === 'usr_init' || name?.toUpperCase().includes('7F2A')) return;
            dispatch({ type: 'USER_JOINED', user: { uid, name, status: 'ONLINE' } });
            dispatch({
              type: 'UPDATE_COLLABORATOR_CURSOR',
              cursor: {
                uid,
                name: (name && name !== 'Collaborator' && name !== 'owner') ? name : `User #${uid.slice(-4).toUpperCase()}`,
                role: 'client',
                color: '#2563eb',
                x: 0,
                y: 0,
                lastSeen: Date.now(),
              },
            });
          },
          onUserOffline: (uid) => {
            dispatch({ type: 'USER_LEFT', uid });
            dispatch({ type: 'REMOVE_COLLABORATOR', uid });
          },
        });
        cleanupRef.current.push(cleanupPresence);
      }

      // ── Step 9: CometChat Real-Time Presence & Canvas Collaboration Bridge ─
      // Connects normal tabs, incognito tabs, and remote collaborators across different browsers/devices
      const collabListenerId = `loopx_collab_${roomId}_${effectId}`;
      const cleanupCollab = await addCollabSyncListener(collabListenerId, (payload: any) => {
        if (!payload) return;
        const myUid = loggedInUser.uid;
        const sender = payload._senderUid || payload.user?.uid || payload.uid || payload.senderUid;
        if (sender && sender.toLowerCase() === myUid.toLowerCase()) return;

        // Discard legacy spam
        if (sender?.toLowerCase().includes('7f2a') || payload.user?.name?.toUpperCase().includes('7F2A')) return;

        if (payload.type === 'cursor_move') {
          dispatch({
            type: 'UPDATE_COLLABORATOR_CURSOR',
            cursor: {
              uid: payload.uid,
              name: payload.name || 'Collaborator',
              role: payload.role || 'client',
              color: payload.color || '#2563eb',
              x: payload.x,
              y: payload.y,
              lastSeen: Date.now(),
            },
          });
          dispatch({
            type: 'USER_JOINED',
            user: {
              uid: payload.uid,
              name: payload.name || 'Collaborator',
              status: 'ONLINE',
            },
          });
        } else if (payload.type === 'presence_join' || payload.type === 'presence_ping') {
          if (payload.user?.uid) {
            dispatch({ type: 'USER_JOINED', user: payload.user });
            dispatch({
              type: 'UPDATE_COLLABORATOR_CURSOR',
              cursor: {
                uid: payload.user.uid,
                name: payload.user.name || 'Collaborator',
                role: payload.user.role || 'client',
                color: payload.user.color || '#2563eb',
                x: 0,
                y: 0,
                lastSeen: Date.now(),
              },
            });
          }
          // Reply with our presence over CometChat so the joining incognito/remote tab immediately registers us!
          sendCollabSyncMessage(roomId, {
            type: 'presence_ack',
            user: {
              uid: loggedInUser.uid,
              name: loggedInUser.name,
              role: state.currentUser.role,
              status: 'ONLINE',
            },
          }).catch(() => {});

          // If we have posts/frames, sync them to the joining peer (e.g. incognito tab / Brave browser)
          if (postsRef.current && postsRef.current.length > 0) {
            sendCollabSyncMessage(roomId, {
              type: 'canvas_initial_sync',
              posts: postsRef.current,
              targetUid: payload.user?.uid || payload.uid,
            }).catch(() => {});
          }
        } else if (payload.type === 'canvas_initial_sync') {
          if (payload.posts && Array.isArray(payload.posts) && payload.posts.length > 0) {
            // Reconcile frames using Excalidraw deterministic conflict resolution algorithm
            const merged = reconcileElements(postsRef.current || [], payload.posts);
            dispatch({ type: 'SET_POSTS', posts: merged });
          }
        } else if (payload.type === 'presence_ack' || payload.type === 'presence_heartbeat') {
          if (payload.user?.uid) {
            dispatch({ type: 'USER_JOINED', user: payload.user });
            dispatch({
              type: 'UPDATE_COLLABORATOR_CURSOR',
              cursor: {
                uid: payload.user.uid,
                name: payload.user.name || 'Collaborator',
                role: payload.user.role || 'client',
                color: payload.user.color || '#2563eb',
                x: 0,
                y: 0,
                lastSeen: Date.now(),
              },
            });
          }
        } else if (payload.type === 'presence_leave') {
          if (payload.uid) {
            dispatch({ type: 'USER_LEFT', uid: payload.uid });
            dispatch({ type: 'REMOVE_COLLABORATOR', uid: payload.uid });
          }
        } else if (payload.type === 'canvas_sync') {
          switch (payload.event) {
            case 'POST_MOVED':
              dispatch({
                type: 'UPDATE_POST_POSITION',
                postId: payload.postId,
                x: payload.x,
                y: payload.y,
              });
              break;
            case 'POST_CREATED':
              dispatch({
                type: 'ADD_POST',
                post: payload.post,
              });
              break;
            case 'POST_STATUS':
              dispatch({
                type: 'UPDATE_POST_STATUS',
                postId: payload.postId,
                status: payload.status,
              });
              break;
            case 'POST_HIGHLIGHTED':
              dispatch({
                type: 'TOGGLE_POST_HIGHLIGHT',
                postId: payload.postId,
              });
              break;
            case 'POST_DELETED':
              dispatch({
                type: 'REMOVE_POST',
                postId: payload.postId,
              });
              break;
            case 'CHAT_MESSAGE':
              if (payload.message && payload.message.id) {
                dispatch({
                  type: 'ADD_CHAT_MESSAGE',
                  message: payload.message,
                });
              }
              break;
            case 'ANNOTATION_ADDED':
              if (payload.annotation) {
                dispatch({
                  type: 'ADD_ANNOTATION',
                  annotation: payload.annotation,
                });
              }
              break;
            case 'ANNOTATION_RESOLVED':
              if (payload.id) {
                dispatch({
                  type: 'RESOLVE_ANNOTATION',
                  id: payload.id,
                  resolvedBy: payload.resolvedBy,
                  resolvedAt: payload.resolvedAt,
                });
              }
              break;
            case 'ANNOTATION_REOPENED':
              if (payload.id) {
                dispatch({
                  type: 'REOPEN_ANNOTATION',
                  id: payload.id,
                });
              }
              break;
            case 'CHAT_NODE_TOGGLED':
            case 'CHAT_NODE_MOVED':
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('loopx_canvas_sync', { detail: payload }));
              }
              break;
          }
        }
      });
      cleanupRef.current.push(cleanupCollab);

      // Immediately announce presence to all tabs/peers (including incognito & different browsers) via CometChat
      sendCollabSyncMessage(roomId, {
        type: 'presence_join',
        user: {
          uid: loggedInUser.uid,
          name: loggedInUser.name,
          role: state.currentUser.role,
          status: 'ONLINE',
        },
      }).catch(() => {});

      // Send ping so any already open tabs immediately report back via CometChat
      sendCollabSyncMessage(roomId, {
        type: 'presence_ping',
        uid: loggedInUser.uid,
      }).catch(() => {});

      console.info('[loopx] 🟢 All CometChat listeners registered. Ready for cross-browser real-time collaboration.');
      isInitializingRef.current = false;
    }

    init().catch((err) => {
      console.error('[loopx] CometChat initialization error:', err);
      isInitializingRef.current = false;
    });

    return () => {
      isCurrent = false;
      if (activeEffectIdRef.current === effectId) {
        activeEffectIdRef.current = null;
        isInitializingRef.current = false;
        cleanupRef.current.forEach((fn) => {
          try { fn(); } catch (_) {}
        });
        cleanupRef.current = [];
      }
    };
  }, [state.roomId]);

  // ─── Send Chat Message via CometChat & BroadcastChannel ───────────────────
  const sendMessage = useCallback(
    async (
      text: string,
      targetPostId?: string,
      media?: { file?: File | Blob; url: string; name?: string; type?: 'image' | 'video' | 'file' | 'audio'; audioDuration?: number }
    ) => {
      if (!text.trim() && !media?.url) return;

      const { sendCometChatMessage, sendCometChatMediaMessage, isMockMode, sanitizeCometChatGuid } = await import('@repo/cometchat-client');
      const roomId = sanitizeCometChatGuid(state.roomId || currentRoomRef.current || 'main-studio-workspace');
      const effectivePostId = targetPostId || state.activePostId || roomId;

      const rawUid = state.currentUser.uid || '';
      const cleanUid = rawUid.replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
      const shortId = cleanUid && !cleanUid.toLowerCase().includes('7f2a') && !cleanUid.toLowerCase().includes('init')
        ? cleanUid.slice(-4).toUpperCase()
        : 'USER';
      const cleanSenderName = (state.currentUser.name && state.currentUser.name !== 'Collaborator' && state.currentUser.name !== 'owner' && !state.currentUser.name.toUpperCase().includes('7F2A'))
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
        audioDuration: media?.audioDuration,
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', message: localMsg });

      // Cross-Browser HTTP/SSE Relay (instant sync across normal tabs, incognito tabs, remote browsers)
      fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: state.roomId,
          senderUid: state.currentUser.uid,
          payload: {
            type: 'canvas_sync',
            event: 'CHAT_MESSAGE',
            senderUid: state.currentUser.uid,
            message: localMsg,
          },
        }),
      }).catch(() => {});

      // Cross-tab real-time sync (same profile)
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
          // Broadcast over CometChat Collab Sync for instant multi-tab & incognito real-time delivery
          const { sendCollabSyncMessage } = await import('@repo/cometchat-client');
          sendCollabSyncMessage(roomId, {
            type: 'canvas_sync',
            event: 'CHAT_MESSAGE',
            senderUid: state.currentUser.uid,
            message: localMsg,
          }).catch(() => {});

          if (media?.file) {
            // Upload file directly to CometChat Cloud S3 media storage
            const sentMedia = await sendCometChatMediaMessage(
              roomId,
              media.file,
              media.type || 'image',
              'group',
              text.trim() || (media.type === 'audio' ? '🎙️ Voice memo' : ''),
              {
                postId: effectivePostId,
                mediaUrl: media.url,
                mediaName: media.name || ('name' in media.file ? (media.file as File).name : 'media-attachment'),
                mediaType: media.type,
                audioDuration: media.audioDuration,
              },
            );

            // If CometChat returns the uploaded cloud S3 URL, update local & broadcast
            const cloudUrl =
              (typeof sentMedia?.getAttachment === 'function' ? sentMedia.getAttachment()?.getFileUrl?.() : null) ||
              sentMedia?.data?.attachments?.[0]?.url ||
              sentMedia?.data?.url;

            if (cloudUrl && cloudUrl !== localMsg.mediaUrl) {
              localMsg.mediaUrl = cloudUrl;
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
            }
          } else {
            await sendCometChatMessage(roomId, text.trim() || (media?.type === 'audio' ? '🎙️ Voice memo' : 'Shared media attachment'), 'group', {
              postId: effectivePostId,
              mediaUrl: media?.url,
              mediaName: media?.name,
              mediaType: media?.type,
              audioDuration: media?.audioDuration,
            });
          }
        } catch (err) {
          console.warn('[loopx] Failed to send CometChat message:', err);
        }
      }
    },
    [state.currentUser.uid, state.currentUser.name, state.currentUser.role, state.activePostId, dispatch],
  );

  return { sendMessage };
}
