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
          const postId = meta?.postId || receiverId || 'general';

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
        sendCollabSyncMessage,
        addCollabSyncListener,
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
        // Use current user from AppContext or generate fresh tab user
        let userUid = state.currentUser.uid;
        let userName = state.currentUser.name;
        if (!userUid || userUid === 'usr_init' || userUid.toLowerCase().includes('7f2a') || userName?.toUpperCase().includes('7F2A')) {
          const freshShortId = Math.random().toString(36).substring(2, 6).toUpperCase();
          userUid = `usr_${freshShortId.toLowerCase()}`;
          userName = `User #${freshShortId}`;
        }
        loggedInUser = await createOrGetUser(userUid, userName);
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

      // Note: CometChat group members are historical participants; real-time presence
      // is managed dynamically via CometChat UserListener (addPresenceListener) and BroadcastChannel
      // to ensure closed/inactive tabs are not shown as active collaborators.

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
      // Connects normal tabs, incognito tabs, and remote collaborators across the internet
      const collabListenerId = `loopx_collab_${roomId}`;
      const cleanupCollab = await addCollabSyncListener(collabListenerId, (payload: any) => {
        if (!payload) return;
        const myUid = loggedInUser.uid;
        const sender = payload._senderUid || payload.user?.uid || payload.uid || payload.senderUid;
        if (sender === myUid) return;

        // Discard any legacy 7f2a spam
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
          // Reply with our presence over CometChat so the joining incognito/normal tab immediately registers us!
          sendCollabSyncMessage(roomId, {
            type: 'presence_ack',
            user: {
              uid: loggedInUser.uid,
              name: loggedInUser.name,
              role: state.currentUser.role,
              status: 'ONLINE',
            },
          }).catch(() => {});
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
          }
        }
      });
      cleanupRef.current.push(cleanupCollab);

      // Immediately announce presence to all tabs/peers (including incognito) via CometChat
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
      media?: { file?: File | Blob; url: string; name?: string; type?: 'image' | 'video' | 'file' | 'audio'; audioDuration?: number }
    ) => {
      if (!text.trim() && !media?.url) return;

      const { sendCometChatMessage, sendCometChatMediaMessage, isMockMode } = await import('@repo/cometchat-client');
      const roomId = currentRoomRef.current;
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
          if (media?.file) {
            // Upload file directly to CometChat Cloud S3 media storage
            const sentMedia = await sendCometChatMediaMessage(
              roomId,
              media.file,
              media.type || 'image',
              'group',
              text.trim(),
              {
                postId: effectivePostId,
                mediaName: media.name || ('name' in media.file ? (media.file as File).name : 'media-attachment'),
                mediaType: media.type,
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
            await sendCometChatMessage(roomId, text.trim() || 'Shared media attachment', 'group', {
              postId: effectivePostId,
              mediaUrl: media?.url,
              mediaName: media?.name,
              mediaType: media?.type,
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
