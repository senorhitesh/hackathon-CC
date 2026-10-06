'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AdProofSession,
  PinAnnotation,
  CanvasElement,
  PlatformPreset,
  ActiveUser,
  HuddleParticipant,
  BoardPost,
  BoardRoom,
  BrandAsset,
  UserRole,
} from '@repo/types';
import {
  getCollaborationLink,
  getCollaborationLinkData,
  generateCollaborationLinkData,
  reconcileElements,
  shouldDiscardRemoteElement,
  Portal,
} from '../data';

// ─── Initial Data ─────────────────────────────────────────────────────────────
// No mock data — localStorage is the sole source of truth.

export interface CollaboratorCursor {
  uid: string;
  name: string;
  role: UserRole;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  postId: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  mediaUrl?: string;
  mediaName?: string;
  mediaType?: 'image' | 'video' | 'file' | 'audio';
  audioDuration?: number;
}

export interface AppState extends AdProofSession {
  currentUser: ActiveUser & { role: UserRole; email?: string; isLoggedIn?: boolean };
  rooms: BoardRoom[];
  posts: BoardPost[];
  activePostId: string | null;
  brandAssets: BrandAsset[];
  selectedElementId: string | null;
  pinModeActive: boolean;
  selectedPinId: string | null;
  collaborators: Record<string, CollaboratorCursor>;
  chatMessages: ChatMessage[];
  customAliases: Record<string, string>;
  roomKey: string | null;
  // Modals state
  isLoginOpen: boolean;
  isCreateRoomOpen: boolean;
  isCreatePostOpen: boolean;
  isShareOpen: boolean;
}

type Action =
  | { type: 'SET_USER'; user: ActiveUser & { role: UserRole; email?: string; isLoggedIn?: boolean } }
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SET_USER_ALIAS'; uid: string; alias: string }
  | { type: 'SET_USER_ALIASES'; aliases: Record<string, string> }
  | { type: 'SET_ROOM_ID'; roomId: string; sessionName?: string; roomKey?: string | null }
  | { type: 'SET_ROOMS'; rooms: BoardRoom[] }
  | { type: 'ADD_ROOM'; room: BoardRoom }
  | { type: 'REMOVE_ROOM'; roomId: string }
  | { type: 'SET_POSTS'; posts: BoardPost[] }
  | { type: 'ADD_POST'; post: BoardPost }
  | { type: 'REMOVE_POST'; postId: string }
  | { type: 'UPDATE_POST_STATUS'; postId: string; status: BoardPost['status'] }
  | { type: 'UPDATE_POST_POSITION'; postId: string; x: number; y: number }
  | { type: 'TOGGLE_POST_HIGHLIGHT'; postId: string }
  | { type: 'SELECT_POST'; postId: string | null }
  | { type: 'SET_BRAND_ASSETS'; assets: BrandAsset[] }
  | { type: 'ADD_BRAND_ASSET'; asset: BrandAsset }
  | { type: 'SET_PRESET'; preset: PlatformPreset }
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; id: string; changes: Partial<CanvasElement> }
  | { type: 'REMOVE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENT'; id: string | null }
  | { type: 'SET_ANNOTATIONS'; annotations: PinAnnotation[] }
  | { type: 'ADD_ANNOTATION'; annotation: PinAnnotation }
  | { type: 'RESOLVE_ANNOTATION'; id: string; resolvedBy: string; resolvedAt: number }
  | { type: 'REOPEN_ANNOTATION'; id: string }
  | { type: 'SET_ACTIVE_USERS'; users: ActiveUser[] }
  | { type: 'USER_JOINED'; user: ActiveUser }
  | { type: 'USER_LEFT'; uid: string }
  | { type: 'SET_HUDDLE_ACTIVE'; active: boolean }
  | { type: 'HUDDLE_PARTICIPANT_JOINED'; participant: HuddleParticipant }
  | { type: 'HUDDLE_PARTICIPANT_LEFT'; uid: string }
  | { type: 'UPDATE_COLLABORATOR_CURSOR'; cursor: CollaboratorCursor }
  | { type: 'REMOVE_COLLABORATOR'; uid: string }
  | { type: 'CLEAR_INACTIVE_COLLABORATORS' }
  | { type: 'SET_PIN_MODE'; active: boolean }
  | { type: 'SET_SELECTED_PIN'; id: string | null }
  | { type: 'SET_CHAT_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'CLEAR_CHAT_MESSAGES'; postId?: string }
  | { type: 'TOGGLE_MODAL'; modal: 'isLoginOpen' | 'isCreateRoomOpen' | 'isCreatePostOpen' | 'isShareOpen'; value?: boolean };

// Helper to extract clean 4-character ID from uid
export function getCleanShortId(uid?: string): string {
  if (!uid) return Math.random().toString(36).substring(2, 6).toUpperCase();
  const clean = uid.replace(/^(user_|usr_|collab_|client_|owner_)/i, '');
  if (!clean || clean.toLowerCase().includes('7f2a') || clean.toLowerCase().includes('init')) {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) hash = (hash << 5) - hash + uid.charCodeAt(i);
    return Math.abs(hash).toString(16).slice(-4).toUpperCase().padStart(4, '9');
  }
  return clean.slice(-4).toUpperCase();
}

// Convert generic or legacy names like 'Collaborator' or 'owner' into professional ID-based user handles
export function formatUserDisplayName(name?: string, uid?: string): string {
  const shortId = getCleanShortId(uid);
  if (!name || name === 'Collaborator' || name === 'owner' || name === 'client' || name === 'User' || name.toUpperCase().includes('7F2A')) {
    return `User #${shortId}`;
  }
  return name;
}

// Check if a message is an old test or mock artifact
export function isLegacyMockMessage(msg: { text?: string }): boolean {
  if (!msg || !msg.text) return true;
  const lower = String(msg.text).toLowerCase().trim();
  return (
    lower.includes('testing cometchat integration live message') ||
    lower.includes('voice review confirmed. 🎙️ voice review confirmed') ||
    lower.includes('voice review confirmed. voice review confirmed')
  );
}

const DEFAULT_ROOM_ID = 'main-studio-workspace';

const CURSOR_COLORS = [
  '#000000',
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#dc2626',
  '#0891b2',
];

function getRandomColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length] || '#2563eb';
}

const initialState: AppState = {
  roomId: DEFAULT_ROOM_ID,
  sessionName: 'Creative Workspace',
  currentUser: {
    uid: 'usr_init',
    name: 'User',
    status: 'ONLINE',
    role: 'owner',
    isLoggedIn: false,
  },
  activePreset: 'IG_SQUARE',
  canvasElements: [],
  annotations: [],
  activeUsers: [],
  huddleActive: false,
  huddleParticipants: [],
  collaborators: {},
  rooms: [
    {
      id: DEFAULT_ROOM_ID,
      name: 'Creative Workspace',
      shareUrl: '',
      ownerName: '',
      createdAt: 1700000000000,
    },
  ],
  posts: [],
  activePostId: null,
  selectedPinId: null,
  brandAssets: [],
  selectedElementId: null,
  pinModeActive: false,
  chatMessages: [],
  customAliases: {},
  roomKey: null,
  isLoginOpen: false,
  isCreateRoomOpen: false,
  isCreatePostOpen: false,
  isShareOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.user };

    case 'SET_USER_NAME':
      return {
        ...state,
        currentUser: { ...state.currentUser, name: action.name },
        activeUsers: state.activeUsers.map((u) =>
          u.uid === state.currentUser.uid ? { ...u, name: action.name } : u
        ),
      };

    case 'SET_USER_ALIAS':
      return {
        ...state,
        customAliases: {
          ...state.customAliases,
          [action.uid]: action.alias,
        },
      };

    case 'SET_USER_ALIASES':
      return {
        ...state,
        customAliases: action.aliases,
      };

    case 'SET_ROOM_ID': {
      const existingRoom = state.rooms.find((r) => r.id === action.roomId);
      return {
        ...state,
        roomId: action.roomId,
        sessionName: action.sessionName ?? existingRoom?.name ?? 'Workspace',
        roomKey: action.roomKey !== undefined ? action.roomKey : state.roomKey,
      };
    }

    case 'SET_ROOMS':
      return { ...state, rooms: action.rooms };

    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [action.room, ...state.rooms.filter((r) => r.id !== action.room.id)],
        roomId: action.room.id,
        sessionName: action.room.name,
      };

    case 'REMOVE_ROOM':
      return {
        ...state,
        rooms: state.rooms.filter((r) => r.id !== action.roomId),
      };

    case 'SET_POSTS':
      return { ...state, posts: action.posts, activePostId: action.posts[0]?.id ?? null };

    case 'ADD_POST': {
      if (state.posts.some((p) => p.id === action.post.id)) {
        return state;
      }
      const posts = [action.post, ...state.posts];
      return { ...state, posts, activePostId: action.post.id };
    }

    case 'REMOVE_POST': {
      const posts = state.posts.filter((p) => p.id !== action.postId);
      return {
        ...state,
        posts,
        activePostId: state.activePostId === action.postId ? posts[0]?.id ?? null : state.activePostId,
      };
    }

    case 'UPDATE_POST_STATUS':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId ? { ...p, status: action.status } : p,
        ),
      };

    case 'UPDATE_POST_POSITION':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId ? { ...p, x: action.x, y: action.y } : p,
        ),
      };

    case 'TOGGLE_POST_HIGHLIGHT':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId ? { ...p, isHighlighted: !p.isHighlighted } : p,
        ),
      };

    case 'SELECT_POST':
      return { ...state, activePostId: action.postId };

    case 'SET_BRAND_ASSETS':
      return { ...state, brandAssets: action.assets };

    case 'ADD_BRAND_ASSET':
      return { ...state, brandAssets: [action.asset, ...state.brandAssets] };

    case 'SET_PRESET':
      return { ...state, activePreset: action.preset };

    case 'ADD_ELEMENT':
      return {
        ...state,
        canvasElements: [...state.canvasElements, action.element],
        selectedElementId: action.element.id,
      };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        canvasElements: state.canvasElements.map((el) =>
          el.id === action.id ? { ...el, ...action.changes } : el,
        ),
      };

    case 'REMOVE_ELEMENT':
      return {
        ...state,
        canvasElements: state.canvasElements.filter((el) => el.id !== action.id),
        selectedElementId:
          state.selectedElementId === action.id ? null : state.selectedElementId,
      };

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.id };

    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.annotations };

    case 'ADD_ANNOTATION': {
      if (state.annotations.some((a) => a.id === action.annotation.id)) return state;
      const annotation = {
        ...action.annotation,
        index: state.annotations.length + 1,
      };
      return { ...state, annotations: [...state.annotations, annotation] };
    }

    case 'RESOLVE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map((ann) =>
          ann.id === action.id
            ? {
                ...ann,
                status: 'RESOLVED',
                resolvedBy: action.resolvedBy,
                resolvedAt: action.resolvedAt,
              }
            : ann,
        ),
      };

    case 'REOPEN_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map((ann) =>
          ann.id === action.id
            ? { ...ann, status: 'OPEN', resolvedBy: undefined, resolvedAt: undefined }
            : ann,
        ),
      };

    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.users };

    case 'USER_JOINED':
      return {
        ...state,
        activeUsers: state.activeUsers.some((u) => u.uid === action.user.uid)
          ? state.activeUsers.map((u) => (u.uid === action.user.uid ? { ...u, ...action.user } : u))
          : [...state.activeUsers, action.user],
      };

    case 'USER_LEFT':
      return {
        ...state,
        activeUsers: state.activeUsers.filter((u) => u.uid !== action.uid),
      };

    case 'SET_HUDDLE_ACTIVE':
      return {
        ...state,
        huddleActive: action.active,
        huddleParticipants: action.active ? state.huddleParticipants : [],
      };

    case 'HUDDLE_PARTICIPANT_JOINED':
      return {
        ...state,
        huddleParticipants: state.huddleParticipants.some(
          (p) => p.uid === action.participant.uid,
        )
          ? state.huddleParticipants
          : [...state.huddleParticipants, action.participant],
      };

    case 'HUDDLE_PARTICIPANT_LEFT':
      return {
        ...state,
        huddleParticipants: state.huddleParticipants.filter(
          (p) => p.uid !== action.uid,
        ),
      };

    case 'UPDATE_COLLABORATOR_CURSOR':
      return {
        ...state,
        collaborators: {
          ...state.collaborators,
          [action.cursor.uid]: action.cursor,
        },
      };

    case 'REMOVE_COLLABORATOR': {
      const next = { ...state.collaborators };
      delete next[action.uid];
      return {
        ...state,
        collaborators: next,
        activeUsers: state.activeUsers.filter((u) => u.uid !== action.uid),
      };
    }

    case 'CLEAR_INACTIVE_COLLABORATORS': {
      const cutoff = Date.now() - 6000;
      let changed = false;
      const nextCollabs = { ...state.collaborators };
      const activeUids = new Set<string>();
      activeUids.add(state.currentUser.uid);

      Object.entries(state.collaborators).forEach(([uid, c]) => {
        const isStale = (c.lastSeen || 0) <= cutoff;
        const isBannedLegacy = uid.toLowerCase().includes('7f2a') || c.name?.toUpperCase().includes('7F2A') || uid === 'usr_init';
        if (!isStale && !isBannedLegacy) {
          activeUids.add(uid);
        } else {
          delete nextCollabs[uid];
          changed = true;
        }
      });

      const nextActiveUsers = state.activeUsers.filter((u) => activeUids.has(u.uid) && !u.uid.toLowerCase().includes('7f2a') && !u.name?.toUpperCase().includes('7F2A'));
      if (nextActiveUsers.length !== state.activeUsers.length) {
        changed = true;
      }

      if (!changed) return state;
      return {
        ...state,
        collaborators: nextCollabs,
        activeUsers: nextActiveUsers,
      };
    }

    case 'SET_PIN_MODE':
      return { ...state, pinModeActive: action.active, selectedElementId: null };

    case 'SET_SELECTED_PIN':
      return { ...state, selectedPinId: action.id };

    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.messages };

    case 'ADD_CHAT_MESSAGE':
      if (
        state.chatMessages.some(
          (m) =>
            m.id === action.message.id ||
            (m.senderUid?.toLowerCase() === action.message.senderUid?.toLowerCase() &&
              m.text === action.message.text &&
              Math.abs(m.timestamp - action.message.timestamp) < 4000)
        )
      ) {
        return state;
      }
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    case 'CLEAR_CHAT_MESSAGES':
      if (action.postId) {
        if (action.postId === 'general') {
          return {
            ...state,
            chatMessages: state.chatMessages.filter(
              (m) => m.postId !== 'general' && m.postId !== state.roomId && Boolean(m.postId)
            ),
          };
        }
        return {
          ...state,
          chatMessages: state.chatMessages.filter((m) => m.postId !== action.postId),
        };
      }
      return { ...state, chatMessages: [] };

    case 'TOGGLE_MODAL':
      return {
        ...state,
        [action.modal]: action.value !== undefined ? action.value : !state[action.modal],
      };

    default:
      return state;
  }
}

// ─── Context & Provider ────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loginUser: (name: string, role: UserRole, email?: string) => void;
  logoutUser: () => Promise<void>;
  createRoom: (name: string) => BoardRoom;
  deleteRoom: (id: string) => Promise<void>;
  createPost: (postData: Omit<BoardPost, 'id' | 'createdAt' | 'roomId' | 'createdBy' | 'createdByName'>) => BoardPost;
  deletePost: (postId: string) => Promise<void>;
  updatePostPosition: (postId: string, x: number, y: number) => void;
  updatePostStatus: (postId: string, status: BoardPost['status']) => void;
  togglePostHighlight: (postId: string) => void;
  addBrandAsset: (name: string, category: BrandAsset['category'], src: string) => void;
  addAnnotation: (annotation: Omit<PinAnnotation, 'id' | 'createdAt' | 'status' | 'index'>) => PinAnnotation;
  resolveAnnotation: (id: string) => void;
  reopenAnnotation: (id: string) => void;
  addCanvasElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  broadcastCursor: (x: number, y: number) => void;
  getShareUrl: (roomId?: string, roomKey?: string) => string;
  startCollaborationSession: (customRoomId?: string | null) => Promise<{ roomId: string; roomKey: string }>;
  stopCollaborationSession: () => void;
  sendRealtimeChatMessage: (postId: string, text: string) => ChatMessage | void;
  clearChatMessages: (postId?: string) => void;
  updateUserName: (name: string) => void;
  setUserAlias: (uid: string, alias: string) => void;
  getEffectiveUserName: (uid?: string, rawName?: string) => string;
  removeCollaborator: (uid: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function getInitialState(): AppState {
  return {
    ...initialState,
    rooms: [{ ...initialState.rooms[0]! }],
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const currentUserRef = useRef(state.currentUser);
  currentUserRef.current = state.currentUser;
  const channelRef = useRef<any>(null);
  const cursorThrottleRef = useRef<number>(0);
  const networkCursorThrottleRef = useRef<number>(0);

  // Helper to construct permanent shareable URL like Excalidraw (#room=roomId,roomKey)
  const getShareUrl = useCallback(
    (roomId?: string, roomKey?: string) => {
      const rId = roomId || state.roomId;
      const rKey = roomKey || state.roomKey;
      if (rKey) {
        return getCollaborationLink({ roomId: rId, roomKey: rKey });
      }
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/app?room=${encodeURIComponent(rId)}`;
      }
      return `/app?room=${encodeURIComponent(rId)}`;
    },
    [state.roomId, state.roomKey]
  );

  const startCollaborationSession = useCallback(
    async (customRoomId?: string | null) => {
      const collabData = await generateCollaborationLinkData();
      const finalRoomId = customRoomId || collabData.roomId;
      const roomKey = collabData.roomKey;
      const sessionName = `${state.currentUser.name || 'User'}'s Session`;

      // 1. Preserve current canvas posts for the newly created room ID so peers see them
      if (typeof window !== 'undefined' && state.posts && state.posts.length > 0) {
        try {
          localStorage.setItem(`loopx_posts_${finalRoomId}`, JSON.stringify(state.posts));
        } catch (_) {}

        // Broadcast current posts to the SSE relay cache for new connecting browsers
        fetch('/api/collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: finalRoomId,
            senderUid: state.currentUser.uid,
            payload: {
              type: 'canvas_initial_sync',
              posts: state.posts,
            },
          }),
        }).catch(() => {});
      }

      if (typeof window !== 'undefined') {
        const collabUrl = getCollaborationLink({ roomId: finalRoomId, roomKey });
        window.history.pushState(null, '', collabUrl);
      }

      dispatch({
        type: 'SET_ROOM_ID',
        roomId: finalRoomId,
        sessionName,
        roomKey,
      });

      return { roomId: finalRoomId, roomKey };
    },
    [state.currentUser.name, state.currentUser.uid, state.posts]
  );

  const stopCollaborationSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
    }
    dispatch({
      type: 'SET_ROOM_ID',
      roomId: DEFAULT_ROOM_ID,
      sessionName: 'Creative Workspace',
      roomKey: null,
    });
  }, []);

  // Load saved session & room from query params or Excalidraw zero-knowledge hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Purge legacy 7F2A storage keys
    try {
      const pref = localStorage.getItem('loopx_preferred_name');
      if (pref && (pref.toUpperCase().includes('7F2A') || pref === 'User' || pref === 'Collaborator')) {
        localStorage.removeItem('loopx_preferred_name');
      }
      const sess = localStorage.getItem('loopx_user_session');
      if (sess && sess.toLowerCase().includes('7f2a')) {
        localStorage.removeItem('loopx_user_session');
      }
      const rawTab = sessionStorage.getItem('loopx_tab_user');
      if (rawTab && (rawTab.toLowerCase().includes('7f2a') || rawTab.toLowerCase().includes('usr_init'))) {
        sessionStorage.removeItem('loopx_tab_user');
      }
    } catch (_) {}

    // Ensure valid non-init, non-7f2a user is active in state
    if (
      state.currentUser.uid === 'usr_init' ||
      state.currentUser.uid.toLowerCase().includes('7f2a') ||
      state.currentUser.name.toUpperCase().includes('7F2A')
    ) {
      let activeUser: any = null;
      try {
        const stored = sessionStorage.getItem('loopx_tab_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.uid && !parsed.uid.toLowerCase().includes('7f2a') && parsed.uid !== 'usr_init') {
            activeUser = parsed;
          }
        }
      } catch (_) {}

      if (!activeUser) {
        const freshShort = Math.random().toString(36).substring(2, 6).toUpperCase();
        activeUser = {
          uid: `usr_${freshShort.toLowerCase()}`,
          name: `User #${freshShort}`,
          status: 'ONLINE' as const,
          role: 'owner' as UserRole,
          isLoggedIn: true,
        };
        try {
          sessionStorage.setItem('loopx_tab_user', JSON.stringify(activeUser));
        } catch (_) {}
      }
      dispatch({ type: 'SET_USER', user: activeUser });
    }

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');

    const savedAliases = localStorage.getItem('loopx_user_aliases');
    if (savedAliases) {
      try {
        dispatch({ type: 'SET_USER_ALIASES', aliases: JSON.parse(savedAliases) });
      } catch (_) {}
    }

    // 1. Check for Excalidraw zero-knowledge hash link: #room=<roomId>,<roomKey> or plain hash
    const applyUrlRoom = () => {
      const collabData = getCollaborationLinkData(window.location.href);
      if (collabData) {
        dispatch({
          type: 'SET_ROOM_ID',
          roomId: collabData.roomId,
          roomKey: collabData.roomKey,
          sessionName: 'Encrypted Collab Session',
        });
        return;
      }

      const hashMatch = window.location.hash.match(/^#room=([a-zA-Z0-9_-]+)$/);
      if (hashMatch && hashMatch[1]) {
        dispatch({
          type: 'SET_ROOM_ID',
          roomId: hashMatch[1],
          roomKey: null,
          sessionName: 'Workspace Session',
        });
        return;
      }

      if (urlRoom) {
        const cleanUrlRoom = urlRoom.replace(/^#room=/i, '').split(',')[0]!;
        dispatch({ type: 'SET_ROOM_ID', roomId: cleanUrlRoom });
      }
    };

    applyUrlRoom();

    // 2. Listen to browser hash changes
    const handleHashChange = () => {
      applyUrlRoom();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Fetch local data for current room whenever roomId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedRooms = localStorage.getItem('loopx_rooms');
    if (savedRooms) {
      try {
        dispatch({ type: 'SET_ROOMS', rooms: JSON.parse(savedRooms) });
      } catch (_) {}
    }

    const savedPosts = localStorage.getItem(`loopx_posts_${state.roomId}`);
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        dispatch({ type: 'SET_POSTS', posts: Array.isArray(parsed) ? parsed : [] });
      } catch (_) {
        dispatch({ type: 'SET_POSTS', posts: [] });
      }
    } else {
      dispatch({ type: 'SET_POSTS', posts: [] });
    }

    const savedAnnotations = localStorage.getItem(`loopx_annotations_${state.roomId}`);
    if (savedAnnotations) {
      try {
        const parsed = JSON.parse(savedAnnotations);
        dispatch({ type: 'SET_ANNOTATIONS', annotations: Array.isArray(parsed) ? parsed : [] });
      } catch (_) {
        dispatch({ type: 'SET_ANNOTATIONS', annotations: [] });
      }
    } else {
      dispatch({ type: 'SET_ANNOTATIONS', annotations: [] });
    }

    // Start chat messages completely fresh for active session (user requested fresh chat)
    dispatch({ type: 'SET_CHAT_MESSAGES', messages: [] });
    try {
      localStorage.removeItem(`loopx_chat_${state.roomId}`);
    } catch (_) {}

    const savedAssets = localStorage.getItem(`loopx_assets_${state.roomId}`);
    if (savedAssets) {
      try {
        const parsed = JSON.parse(savedAssets);
        dispatch({ type: 'SET_BRAND_ASSETS', assets: Array.isArray(parsed) ? parsed : [] });
      } catch (_) {
        dispatch({ type: 'SET_BRAND_ASSETS', assets: [] });
      }
    }
  }, [state.roomId]);

  // Save chat to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`loopx_chat_${state.roomId}`, JSON.stringify(state.chatMessages));
  }, [state.roomId, state.chatMessages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`loopx_annotations_${state.roomId}`, JSON.stringify(state.annotations));
  }, [state.roomId, state.annotations]);

  // Save changes to LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`loopx_posts_${state.roomId}`, JSON.stringify(state.posts));
  }, [state.posts, state.roomId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('loopx_rooms', JSON.stringify(state.rooms));
  }, [state.rooms]);

  // Save brand assets to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`loopx_assets_${state.roomId}`, JSON.stringify(state.brandAssets));
  }, [state.brandAssets, state.roomId]);

  // ─── Realtime Collaboration Channel (Local & Multi-Tab Broadcast) ───────────
  useEffect(() => {
    if (typeof window === 'undefined' || !state.roomId) return;

    // Keep Excalidraw zero-knowledge hash fragment intact
    if (state.roomKey && state.roomId) {
      const expectedHash = `#room=${state.roomId},${state.roomKey}`;
      if (window.location.hash !== expectedHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${expectedHash}`);
      }
    } else if (!state.roomKey && window.location.search.includes('room=main-studio-workspace')) {
      // Clean up legacy query parameter when working locally
      window.history.replaceState(null, '', window.location.pathname);
    }

    // ── Cross-Browser Real-Time Relay (SSE) ──────────────────────────────────
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/collab?roomId=${encodeURIComponent(state.roomId)}`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload) return;
          const myUid = currentUserRef.current.uid;
          if (payload._senderUid && payload._senderUid.toLowerCase() === myUid.toLowerCase()) {
            return;
          }

          if (payload.type === 'canvas_initial_sync' && Array.isArray(payload.posts) && payload.posts.length > 0) {
            const merged = reconcileElements(state.posts || [], payload.posts);
            dispatch({ type: 'SET_POSTS', posts: merged });
            return;
          }

          if (payload.type === 'chat_initial_sync' && Array.isArray(payload.messages) && payload.messages.length > 0) {
            payload.messages.forEach((msg: any) => {
              if (msg && !isLegacyMockMessage(msg)) {
                dispatch({ type: 'ADD_CHAT_MESSAGE', message: msg });
              }
            });
            return;
          }

          if (payload.type === 'cursor_move') {
            if (payload.uid === myUid) return;
            dispatch({
              type: 'UPDATE_COLLABORATOR_CURSOR',
              cursor: {
                uid: payload.uid,
                name: payload.name || 'Collaborator',
                role: payload.role || 'client',
                color: payload.color || getRandomColor(payload.uid),
                x: payload.x,
                y: payload.y,
                lastSeen: Date.now(),
              },
            });
            dispatch({
              type: 'USER_JOINED',
              user: { uid: payload.uid, name: payload.name || 'Collaborator', status: 'ONLINE' },
            });
            return;
          }

          if (payload.type === 'presence_join' || payload.type === 'presence_ping') {
            if (payload.user?.uid && payload.user.uid !== myUid) {
              dispatch({ type: 'USER_JOINED', user: payload.user });
              if (state.posts && state.posts.length > 0) {
                fetch('/api/collab', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roomId: state.roomId,
                    senderUid: myUid,
                    payload: {
                      type: 'canvas_initial_sync',
                      posts: state.posts,
                    },
                  }),
                }).catch(() => {});
              }
            }
            return;
          }

          if (payload.type === 'canvas_sync') {
            switch (payload.event) {
              case 'POST_MOVED': {
                const localPost = state.posts.find((p) => p.id === payload.postId);
                if (
                  localPost &&
                  shouldDiscardRemoteElement(
                    { draggingElementId: state.activePostId },
                    localPost,
                    { id: payload.postId, version: payload.version, versionNonce: payload.versionNonce }
                  )
                ) {
                  break;
                }
                dispatch({
                  type: 'UPDATE_POST_POSITION',
                  postId: payload.postId,
                  x: payload.x,
                  y: payload.y,
                });
                break;
              }
              case 'POST_CREATED':
                dispatch({ type: 'ADD_POST', post: payload.post });
                break;
              case 'POST_STATUS':
                dispatch({ type: 'UPDATE_POST_STATUS', postId: payload.postId, status: payload.status });
                break;
              case 'POST_HIGHLIGHTED':
                dispatch({ type: 'TOGGLE_POST_HIGHLIGHT', postId: payload.postId });
                break;
              case 'POST_DELETED':
                dispatch({ type: 'REMOVE_POST', postId: payload.postId });
                break;
              case 'ANNOTATION_ADDED':
                dispatch({ type: 'ADD_ANNOTATION', annotation: payload.annotation });
                break;
              case 'ANNOTATION_RESOLVED':
                dispatch({
                  type: 'RESOLVE_ANNOTATION',
                  id: payload.id,
                  resolvedBy: payload.resolvedBy,
                  resolvedAt: payload.resolvedAt,
                });
                break;
              case 'CHAT_MESSAGE':
                if (payload.message && !isLegacyMockMessage(payload.message)) {
                  dispatch({ type: 'ADD_CHAT_MESSAGE', message: payload.message });
                }
                break;
            }
          }
        } catch (_) {}
      };
    } catch (_) {}

    if (typeof BroadcastChannel === 'undefined') return;

    const channelName = `canvas_collab_${state.roomId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    // Immediately announce presence to other tabs/collaborators
    channel.postMessage({
      type: 'presence_join',
      user: {
        uid: currentUserRef.current.uid,
        name: currentUserRef.current.name,
        role: currentUserRef.current.role,
        status: 'ONLINE',
      },
    });

    // Also send a ping so any already open tabs immediately report back
    channel.postMessage({
      type: 'presence_ping',
      uid: currentUserRef.current.uid,
    });

    // Heartbeat every 2.5s so other tabs know this tab is actively open
    const heartbeatInterval = setInterval(() => {
      const myUser = {
        uid: currentUserRef.current.uid,
        name: currentUserRef.current.name,
        role: currentUserRef.current.role,
        status: 'ONLINE' as const,
      };

      if (channelRef.current && myUser.uid) {
        try {
          channelRef.current.postMessage({
            type: 'presence_heartbeat',
            user: myUser,
          });
        } catch (_) {}
      }

      // Also broadcast over CometChat network (connects incognito tabs & remote peers)
      if (myUser.uid && state.roomId) {
        import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
          sendCollabSyncMessage(state.roomId, {
            type: 'presence_heartbeat',
            user: myUser,
          }).catch(() => {});
        }).catch(() => {});
      }
    }, 2500);

    // Auto-reaper: clean up any tab that closed or hasn't heartbeated in > 6s
    const reaperInterval = setInterval(() => {
      dispatch({ type: 'CLEAR_INACTIVE_COLLABORATORS' });
    }, 2000);

    const handleBeforeUnload = () => {
      const leaveUid = currentUserRef.current.uid;
      try {
        channel.postMessage({
          type: 'presence_leave',
          uid: leaveUid,
        });
      } catch (_) {}

      if (leaveUid && state.roomId) {
        import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
          sendCollabSyncMessage(state.roomId, {
            type: 'presence_leave',
            uid: leaveUid,
          }).catch(() => {});
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    channel.onmessage = (event) => {
      const payload = event.data;
      if (!payload) return;

      const myUid = currentUserRef.current.uid;
      const myName = currentUserRef.current.name;
      const myRole = currentUserRef.current.role;

      // Discard any incoming 7F2A / init legacy spam
      const incomingUid = payload.user?.uid || payload.uid || payload.senderUid || '';
      if (incomingUid.toLowerCase().includes('7f2a') || incomingUid === 'usr_init' || payload.user?.name?.toUpperCase().includes('7F2A')) {
        return;
      }

      // Check for duplicate tab UID collision (e.g. if tab was duplicated in Chrome)
      if (payload.type === 'presence_join' || payload.type === 'presence_heartbeat' || payload.type === 'presence_ping') {
        if (incomingUid === myUid) {
          // Both tabs have the exact same UID! Regenerate our tab's UID immediately
          const newShortId = Math.random().toString(36).substring(2, 6).toUpperCase();
          const regeneratedUser = {
            ...currentUserRef.current,
            uid: `usr_${newShortId.toLowerCase()}`,
            name: `User #${newShortId}`,
          };
          currentUserRef.current = regeneratedUser;
          try {
            sessionStorage.setItem('loopx_tab_user', JSON.stringify(regeneratedUser));
          } catch (_) {}
          dispatch({ type: 'SET_USER', user: regeneratedUser });
          channel.postMessage({
            type: 'presence_join',
            user: regeneratedUser,
          });
          return;
        }
      }

      if (payload.type === 'cursor_move') {
        if (payload.uid === myUid) return;
        dispatch({
          type: 'UPDATE_COLLABORATOR_CURSOR',
          cursor: {
            uid: payload.uid,
            name: payload.name || 'Collaborator',
            role: payload.role || 'client',
            color: payload.color || getRandomColor(payload.uid),
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
        if (incomingUid === myUid) return;
        if (payload.user?.uid) {
          dispatch({ type: 'USER_JOINED', user: payload.user });
          dispatch({
            type: 'UPDATE_COLLABORATOR_CURSOR',
            cursor: {
              uid: payload.user.uid,
              name: payload.user.name || 'Collaborator',
              role: payload.user.role || 'client',
              color: getRandomColor(payload.user.uid),
              x: state.collaborators[payload.user.uid]?.x ?? 0,
              y: state.collaborators[payload.user.uid]?.y ?? 0,
              lastSeen: Date.now(),
            },
          });
        }
        // Reply with our presence so the joining/pinging tab immediately registers us
        channel.postMessage({
          type: 'presence_ack',
          user: {
            uid: myUid,
            name: myName,
            role: myRole,
            status: 'ONLINE',
          },
        });
      } else if (payload.type === 'presence_ack' || payload.type === 'presence_heartbeat') {
        if (incomingUid === myUid) return;
        if (payload.user?.uid) {
          dispatch({ type: 'USER_JOINED', user: payload.user });
          dispatch({
            type: 'UPDATE_COLLABORATOR_CURSOR',
            cursor: {
              uid: payload.user.uid,
              name: payload.user.name || 'Collaborator',
              role: payload.user.role || 'client',
              color: getRandomColor(payload.user.uid),
              x: state.collaborators[payload.user.uid]?.x ?? 0,
              y: state.collaborators[payload.user.uid]?.y ?? 0,
              lastSeen: Date.now(),
            },
          });
        }
      } else if (payload.type === 'user_name_changed') {
        if (payload.uid === myUid) return;
        dispatch({
          type: 'USER_JOINED',
          user: {
            uid: payload.uid,
            name: payload.name,
            status: 'ONLINE',
          },
        });
        dispatch({
          type: 'UPDATE_COLLABORATOR_CURSOR',
          cursor: {
            uid: payload.uid,
            role: state.collaborators[payload.uid]?.role || 'client',
            color: state.collaborators[payload.uid]?.color || getRandomColor(payload.uid || 'usr') || '#2563eb',
            x: state.collaborators[payload.uid]?.x ?? 0,
            y: state.collaborators[payload.uid]?.y ?? 0,
            lastSeen: Date.now(),
            name: payload.name || 'Collaborator',
          },
        });
      } else if (payload.type === 'presence_leave') {
        if (payload.uid === myUid) return;
        dispatch({ type: 'USER_LEFT', uid: payload.uid });
        dispatch({ type: 'REMOVE_COLLABORATOR', uid: payload.uid });
      } else if (payload.type === 'canvas_sync') {
        if (payload.senderUid === myUid) return;
        switch (payload.event) {
          case 'POST_MOVED': {
            const localPost = state.posts.find((p) => p.id === payload.postId);
            if (
              localPost &&
              shouldDiscardRemoteElement(
                { draggingElementId: state.activePostId },
                localPost,
                {
                  id: payload.postId,
                  version: payload.version,
                  versionNonce: payload.versionNonce,
                }
              )
            ) {
              break;
            }
            dispatch({
              type: 'UPDATE_POST_POSITION',
              postId: payload.postId,
              x: payload.x,
              y: payload.y,
            });
            break;
          }
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
          case 'ANNOTATION_ADDED':
            dispatch({
              type: 'ADD_ANNOTATION',
              annotation: payload.annotation,
            });
            break;
          case 'ANNOTATION_RESOLVED':
            dispatch({
              type: 'RESOLVE_ANNOTATION',
              id: payload.id,
              resolvedBy: payload.resolvedBy,
              resolvedAt: payload.resolvedAt,
            });
            break;
          case 'CHAT_MESSAGE':
            if (payload.message && !isLegacyMockMessage(payload.message)) {
              dispatch({
                type: 'ADD_CHAT_MESSAGE',
                message: payload.message,
              });
            }
            break;
        }
      }
    };

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(reaperInterval);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      channel.close();
      channelRef.current = null;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [state.roomId]);

  // Broadcast cursor with throttle (max 30fps)
  const broadcastCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - cursorThrottleRef.current < 32) return;
    cursorThrottleRef.current = now;

    const myUid = currentUserRef.current.uid;
    if (!myUid) return;

    const cursorPayload = {
      type: 'cursor_move',
      uid: myUid,
      name: currentUserRef.current.name,
      role: currentUserRef.current.role,
      color: getRandomColor(myUid),
      x,
      y,
    };

    if (channelRef.current) {
      try {
        channelRef.current.postMessage(cursorPayload);
      } catch (_) {}
    }

    // Network cursor over SSE Relay and CometChat (throttled to ~80ms)
    if (now - networkCursorThrottleRef.current > 80 && state.roomId) {
      networkCursorThrottleRef.current = now;

      fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: state.roomId,
          senderUid: myUid,
          payload: cursorPayload,
        }),
      }).catch(() => {});

      import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
        sendCollabSyncMessage(state.roomId, cursorPayload).catch(() => {});
      }).catch(() => {});
    }
  }, [state.roomId]);

  // Update own user display name and broadcast across tabs/collaborators
  const updateUserName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      dispatch({ type: 'SET_USER_NAME', name: trimmed });
      const updatedUser = { ...currentUserRef.current, name: trimmed };
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('loopx_tab_user', JSON.stringify(updatedUser));
          localStorage.setItem('loopx_preferred_name', trimmed);
        } catch (_) {}
      }
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'user_name_changed',
            uid: currentUserRef.current.uid,
            name: trimmed,
          });
        } catch (_) {}
      }
    },
    [],
  );

  // Give a custom alias/name to a particular collaborator UID
  const setUserAlias = useCallback((uid: string, alias: string) => {
    const trimmed = alias.trim();
    dispatch({ type: 'SET_USER_ALIAS', uid, alias: trimmed });
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('loopx_user_aliases');
        const map = raw ? JSON.parse(raw) : {};
        if (trimmed) {
          map[uid] = trimmed;
        } else {
          delete map[uid];
        }
        localStorage.setItem('loopx_user_aliases', JSON.stringify(map));
      } catch (_) {}
    }
  }, []);

  // Compute effective display name checking custom alias first, then custom name, then fallback
  const getEffectiveUserName = useCallback(
    (targetUid?: string, rawName?: string) => {
      if (!targetUid) return rawName || 'User';
      if (state.customAliases && state.customAliases[targetUid]) {
        return state.customAliases[targetUid];
      }
      return formatUserDisplayName(rawName, targetUid);
    },
    [state.customAliases],
  );

  const removeCollaborator = useCallback((uid: string) => {
    dispatch({ type: 'REMOVE_COLLABORATOR', uid });
    dispatch({ type: 'USER_LEFT', uid });
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'presence_leave', uid });
      } catch (_) {}
    }
  }, []);

  const loginUser = useCallback((name: string, role: UserRole, email?: string) => {
    const user: ActiveUser & { role: UserRole; email?: string; isLoggedIn?: boolean } = {
      uid: `${role}_${uuidv4().substring(0, 6)}`,
      name: name || 'Studio User',
      email,
      status: 'ONLINE',
      role,
      isLoggedIn: true,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('loopx_user_session', JSON.stringify(user));
      sessionStorage.setItem('loopx_tab_user', JSON.stringify(user));
    }
    dispatch({ type: 'SET_USER', user });
  }, []);

  const logoutUser = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loopx_user_session');
    }
    const guestUser = {
      uid: `user_${uuidv4().substring(0, 6)}`,
      name: 'Collaborator',
      status: 'ONLINE' as const,
      role: 'owner' as const,
      isLoggedIn: true,
    };
    dispatch({ type: 'SET_USER', user: guestUser });
  }, []);

  const createRoom = useCallback(
    (name: string): BoardRoom => {
      const id = `workspace-${uuidv4().substring(0, 8)}`;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const room: BoardRoom = {
        id,
        name: name || 'Untitled Workspace',
        shareUrl: `${origin}/app?room=${encodeURIComponent(id)}`,
        ownerName: state.currentUser.name,
        createdAt: Date.now(),
      };

      dispatch({ type: 'ADD_ROOM', room });

      // Create corresponding CometChat group (fire & forget)
      import('@repo/cometchat-client')
        .then(({ getOrCreateGroup }) => getOrCreateGroup(id, name || 'Untitled Workspace'))
        .catch(() => {});

      return room;
    },
    [state.currentUser.name],
  );

  const deleteRoom = useCallback(async (roomId: string) => {
    dispatch({ type: 'REMOVE_ROOM', roomId });
  }, []);

  const broadcastSyncPayload = useCallback((payload: any) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(payload);
      } catch (_) {}
    }

    if (state.roomId) {
      fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: state.roomId,
          senderUid: currentUserRef.current.uid,
          payload,
        }),
      }).catch(() => {});

      import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
        sendCollabSyncMessage(state.roomId, payload).catch(() => {});
      }).catch(() => {});
    }
  }, [state.roomId]);

  const createPost = useCallback(
    (postData: Omit<BoardPost, 'id' | 'createdAt' | 'roomId' | 'createdBy' | 'createdByName'>): BoardPost => {
      const post: BoardPost = {
        ...postData,
        id: `post_${uuidv4().substring(0, 8)}`,
        roomId: state.roomId,
        createdBy: state.currentUser.uid,
        createdByName: state.currentUser.name,
        createdAt: Date.now(),
        x: postData.x ?? 120,
        y: postData.y ?? 120,
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000000),
      };

      dispatch({ type: 'ADD_POST', post });

      broadcastSyncPayload({
        type: 'canvas_sync',
        event: 'POST_CREATED',
        post,
        senderUid: state.currentUser.uid,
      });

      return post;
    },
    [state.roomId, state.currentUser.uid, state.currentUser.name, broadcastSyncPayload],
  );

  const deletePost = useCallback(async (postId: string) => {
    dispatch({ type: 'REMOVE_POST', postId });

    broadcastSyncPayload({
      type: 'canvas_sync',
      event: 'POST_DELETED',
      postId,
      senderUid: state.currentUser.uid,
    });
  }, [state.currentUser.uid, broadcastSyncPayload]);

  const updatePostPosition = useCallback((postId: string, x: number, y: number) => {
    dispatch({ type: 'UPDATE_POST_POSITION', postId, x, y });

    const localPost = state.posts.find((p) => p.id === postId);
    const version = (localPost?.version ?? 0) + 1;
    const versionNonce = Math.floor(Math.random() * 1000000000);

    broadcastSyncPayload({
      type: 'canvas_sync',
      event: 'POST_MOVED',
      postId,
      x,
      y,
      version,
      versionNonce,
      senderUid: state.currentUser.uid,
    });
  }, [state.currentUser.uid, state.posts, broadcastSyncPayload]);

  const updatePostStatus = useCallback((postId: string, status: BoardPost['status']) => {
    dispatch({ type: 'UPDATE_POST_STATUS', postId, status });

    broadcastSyncPayload({
      type: 'canvas_sync',
      event: 'POST_STATUS',
      postId,
      status,
      senderUid: state.currentUser.uid,
    });
  }, [state.currentUser.uid, broadcastSyncPayload]);

  const togglePostHighlight = useCallback((postId: string) => {
    dispatch({ type: 'TOGGLE_POST_HIGHLIGHT', postId });

    broadcastSyncPayload({
      type: 'canvas_sync',
      event: 'POST_HIGHLIGHTED',
      postId,
      senderUid: state.currentUser.uid,
    });
  }, [state.currentUser.uid, broadcastSyncPayload]);

  const addBrandAsset = useCallback(
    (name: string, category: BrandAsset['category'], src: string) => {
      const asset: BrandAsset = {
        id: `asset_${uuidv4().substring(0, 8)}`,
        name: name || 'Uploaded Asset',
        category,
        src,
      };

      dispatch({ type: 'ADD_BRAND_ASSET', asset });
    },
    [],
  );

  const addAnnotation = useCallback(
    (annotation: Omit<PinAnnotation, 'id' | 'createdAt' | 'status' | 'index'>): PinAnnotation => {
      const full: PinAnnotation = {
        ...annotation,
        id: uuidv4(),
        createdAt: Date.now(),
        status: 'OPEN',
      };

      dispatch({ type: 'ADD_ANNOTATION', annotation: full });

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'canvas_sync',
            event: 'ANNOTATION_ADDED',
            annotation: full,
            senderUid: state.currentUser.uid,
          });
        } catch (_) {}
      }

      if (state.roomId) {
        import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
          sendCollabSyncMessage(state.roomId, {
            type: 'canvas_sync',
            event: 'ANNOTATION_ADDED',
            annotation: full,
            senderUid: state.currentUser.uid,
          }).catch(() => {});
        }).catch(() => {});
      }

      return full;
    },
    [state.currentUser.uid, state.roomId],
  );

  const resolveAnnotation = useCallback(
    (id: string) => {
      dispatch({
        type: 'RESOLVE_ANNOTATION',
        id,
        resolvedBy: state.currentUser.name,
        resolvedAt: Date.now(),
      });

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'canvas_sync',
            event: 'ANNOTATION_RESOLVED',
            id,
            resolvedBy: state.currentUser.name,
            resolvedAt: Date.now(),
            senderUid: state.currentUser.uid,
          });
        } catch (_) {}
      }

      if (state.roomId) {
        import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
          sendCollabSyncMessage(state.roomId, {
            type: 'canvas_sync',
            event: 'ANNOTATION_RESOLVED',
            id,
            resolvedBy: state.currentUser.name,
            resolvedAt: Date.now(),
            senderUid: state.currentUser.uid,
          }).catch(() => {});
        }).catch(() => {});
      }
    },
    [state.currentUser.name, state.currentUser.uid, state.roomId],
  );

  const reopenAnnotation = useCallback((id: string) => {
    dispatch({ type: 'REOPEN_ANNOTATION', id });

    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'canvas_sync',
          event: 'ANNOTATION_REOPENED',
          id,
          senderUid: state.currentUser.uid,
        });
      } catch (_) {}
    }

    if (state.roomId) {
      import('@repo/cometchat-client').then(({ sendCollabSyncMessage }) => {
        sendCollabSyncMessage(state.roomId, {
          type: 'canvas_sync',
          event: 'ANNOTATION_REOPENED',
          id,
          senderUid: state.currentUser.uid,
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [state.roomId, state.currentUser.uid]);

  const addCanvasElement = useCallback(
    (element: Omit<CanvasElement, 'id' | 'zIndex'>) => {
      const el: CanvasElement = {
        ...element,
        id: uuidv4(),
        zIndex: state.canvasElements.length + 1,
      };
      dispatch({ type: 'ADD_ELEMENT', element: el });
    },
    [state.canvasElements.length],
  );

  const sendRealtimeChatMessage = useCallback(
    (postId: string, text: string) => {
      if (!text.trim()) return;

      const newMsg: ChatMessage = {
        id: `msg_${uuidv4().substring(0, 8)}`,
        postId: postId || 'general',
        senderUid: state.currentUser.uid,
        senderName: state.currentUser.name || 'Collaborator',
        senderRole: state.currentUser.role || 'client',
        senderAvatar: state.currentUser.avatar,
        text: text.trim(),
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', message: newMsg });

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'canvas_sync',
            event: 'CHAT_MESSAGE',
            message: newMsg,
            senderUid: state.currentUser.uid,
          });
        } catch (_) {}
      }

      return newMsg;
    },
    [state.currentUser],
  );

  const clearChatMessages = useCallback(
    (postId?: string) => {
      dispatch({ type: 'CLEAR_CHAT_MESSAGES', postId });
      if (typeof window !== 'undefined') {
        try {
          const key = `loopx_chat_${state.roomId}`;
          if (!postId) {
            localStorage.removeItem(key);
          } else if (postId === 'general') {
            const remaining = state.chatMessages.filter(
              (m) => m.postId !== 'general' && m.postId !== state.roomId && Boolean(m.postId)
            );
            localStorage.setItem(key, JSON.stringify(remaining));
          } else {
            const remaining = state.chatMessages.filter((m) => m.postId !== postId);
            localStorage.setItem(key, JSON.stringify(remaining));
          }
        } catch (_) {}
      }
    },
    [state.roomId, state.chatMessages],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loginUser,
        logoutUser,
        createRoom,
        deleteRoom,
        createPost,
        deletePost,
        updatePostPosition,
        updatePostStatus,
        togglePostHighlight,
        addBrandAsset,
        addAnnotation,
        resolveAnnotation,
        reopenAnnotation,
        addCanvasElement,
        broadcastCursor,
        getShareUrl,
        startCollaborationSession,
        stopCollaborationSession,
        sendRealtimeChatMessage,
        clearChatMessages,
        updateUserName,
        setUserAlias,
        getEffectiveUserName,
        removeCollaborator,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
