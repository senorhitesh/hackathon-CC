'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import type { PinAnnotation, ActiveUser } from '@repo/types';

/**
 * useCometChat — initializes the CometChat SDK (or mock mode) and registers
 * real-time listeners for annotation messages and user presence.
 * Should be mounted once at the app root level.
 */
export function useCometChat() {
  const { state, dispatch, addAnnotation } = useAppContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let cleanupAnnotationListener: (() => void) | undefined;
    let cleanupMockBroadcast: (() => void) | undefined;
    let cleanupPresence: (() => void) | undefined;

    async function init() {
      const {
        initCometChat,
        initCometChatCalls,
        loginUser,
        addAnnotationListener,
        addPresenceListener,
        getMockCurrentUser,
        initMockBroadcast,
        isMockMode,
        MOCK_USERS,
      } = await import('@repo/cometchat-client');

      // Step 1: Init Chat SDK
      await initCometChat();

      // Step 2: Init Calls SDK
      await initCometChatCalls();

      // Step 3: Determine current user
      const mockUser = getMockCurrentUser();
      const loggedIn = await loginUser(mockUser.uid);

      // Update state with current user
      dispatch({
        type: 'SET_ACTIVE_USERS',
        users: [
          {
            uid: loggedIn.uid,
            name: loggedIn.name,
            status: 'ONLINE',
          },
        ],
      });

      // Update current user name in state
      dispatch({
        type: 'USER_JOINED',
        user: { uid: loggedIn.uid, name: loggedIn.name, status: 'ONLINE' },
      });

      // Step 4: In mock mode, init BroadcastChannel for cross-tab events
      if (isMockMode()) {
        // Show simulated active users
        const otherUsers: ActiveUser[] = MOCK_USERS
          .filter((u) => u.uid !== loggedIn.uid)
          .map((u) => ({ ...u, status: 'ONLINE' as const }))
          .slice(0, 2);

        otherUsers.forEach((u) => dispatch({ type: 'USER_JOINED', user: u }));

        cleanupMockBroadcast = initMockBroadcast();
      }

      // Step 5: Add annotation listener
      const listenerId = `adproof_annotations_${state.roomId}`;
      cleanupAnnotationListener = await addAnnotationListener(listenerId, {
        onAnnotationCreated: (annotation: PinAnnotation) => {
          // Only add if not already in state (prevents duplicating own sends)
          dispatch({ type: 'ADD_ANNOTATION', annotation });
        },
        onAnnotationResolved: (id: string, resolvedBy: string, full: PinAnnotation) => {
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

      // Step 6: Add presence listener (real mode only)
      if (!isMockMode()) {
        cleanupPresence = await addPresenceListener(`presence_${state.roomId}`, {
          onUserOnline: (uid, name) => {
            dispatch({ type: 'USER_JOINED', user: { uid, name, status: 'ONLINE' } });
          },
          onUserOffline: (uid) => {
            dispatch({ type: 'USER_LEFT', uid });
          },
        });
      }
    }

    init().catch(console.error);

    return () => {
      cleanupAnnotationListener?.();
      cleanupMockBroadcast?.();
      cleanupPresence?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
