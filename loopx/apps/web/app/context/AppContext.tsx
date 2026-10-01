'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
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

// ─── Initial Demo Assets & Data ────────────────────────────────────────────────

const DEFAULT_BRAND_ASSETS: BrandAsset[] = [
  {
    id: 'asset_logo_1',
    name: 'loopx Minimal Logo',
    category: 'brand',
    src: '/loogx-logo&favicon.png',
  },
  {
    id: 'asset_prod_1',
    name: 'Summer Promo Hero',
    category: 'product',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'asset_badge_1',
    name: 'Verified Quality Badge',
    category: 'badge',
    src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
];

const DEFAULT_POSTS: BoardPost[] = [
  {
    id: 'post_1',
    roomId: 'loopx-demo-room',
    title: 'Summer Launch Campaign — IG 1:1',
    description: 'Hero promotional ad variation featuring the primary product showcase.',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    mediaType: 'image',
    preset: 'IG_SQUARE',
    status: 'IN_REVIEW',
    createdBy: 'owner_lead',
    createdByName: 'Kargul Studio (Owner)',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'post_2',
    roomId: 'loopx-demo-room',
    title: 'Story / Reel Teaser 9:16',
    description: 'Vertical video teaser format designed for Instagram Stories and TikTok.',
    mediaUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1080&q=80',
    mediaType: 'image',
    preset: 'REELS_STORY',
    status: 'DRAFT',
    createdBy: 'owner_lead',
    createdByName: 'Kargul Studio (Owner)',
    createdAt: Date.now() - 7200000,
  },
];

// ─── Actions & Reducer State ───────────────────────────────────────────────────

export interface AppState extends AdProofSession {
  currentUser: ActiveUser & { role: UserRole };
  rooms: BoardRoom[];
  posts: BoardPost[];
  activePostId: string | null;
  brandAssets: BrandAsset[];
  selectedElementId: string | null;
  pinModeActive: boolean;
  selectedPinId: string | null;
  // Modals state
  isLoginOpen: boolean;
  isCreateRoomOpen: boolean;
  isCreatePostOpen: boolean;
  isShareOpen: boolean;
}

type Action =
  | { type: 'SET_USER'; user: ActiveUser & { role: UserRole } }
  | { type: 'SET_ROOM_ID'; roomId: string; sessionName?: string }
  | { type: 'ADD_ROOM'; room: BoardRoom }
  | { type: 'SET_POSTS'; posts: BoardPost[] }
  | { type: 'ADD_POST'; post: BoardPost }
  | { type: 'UPDATE_POST_STATUS'; postId: string; status: BoardPost['status'] }
  | { type: 'UPDATE_POST_POSITION'; postId: string; x: number; y: number }
  | { type: 'SELECT_POST'; postId: string | null }
  | { type: 'SET_BRAND_ASSETS'; assets: BrandAsset[] }
  | { type: 'ADD_BRAND_ASSET'; asset: BrandAsset }
  | { type: 'SET_PRESET'; preset: PlatformPreset }
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; id: string; changes: Partial<CanvasElement> }
  | { type: 'REMOVE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENT'; id: string | null }
  | { type: 'ADD_ANNOTATION'; annotation: PinAnnotation }
  | { type: 'RESOLVE_ANNOTATION'; id: string; resolvedBy: string; resolvedAt: number }
  | { type: 'REOPEN_ANNOTATION'; id: string }
  | { type: 'SET_ACTIVE_USERS'; users: ActiveUser[] }
  | { type: 'USER_JOINED'; user: ActiveUser }
  | { type: 'USER_LEFT'; uid: string }
  | { type: 'SET_HUDDLE_ACTIVE'; active: boolean }
  | { type: 'HUDDLE_PARTICIPANT_JOINED'; participant: HuddleParticipant }
  | { type: 'HUDDLE_PARTICIPANT_LEFT'; uid: string }
  | { type: 'SET_PIN_MODE'; active: boolean }
  | { type: 'SET_SELECTED_PIN'; id: string | null }
  | { type: 'TOGGLE_MODAL'; modal: 'isLoginOpen' | 'isCreateRoomOpen' | 'isCreatePostOpen' | 'isShareOpen'; value?: boolean };

const DEFAULT_ROOM_ID = 'loopx-demo-room';

const initialState: AppState = {
  roomId: DEFAULT_ROOM_ID,
  sessionName: 'My Project / Board 1',
  currentUser: {
    uid: 'owner_lead',
    name: 'Kargul Lead',
    status: 'ONLINE',
    role: 'owner',
  },
  activePreset: 'IG_SQUARE',
  canvasElements: [],
  annotations: [],
  activeUsers: [],
  huddleActive: false,
  huddleParticipants: [],
  rooms: [
    {
      id: DEFAULT_ROOM_ID,
      name: 'My Project / Board 1',
      shareUrl: typeof window !== 'undefined' ? `${window.location.origin}?room=${DEFAULT_ROOM_ID}&role=client` : `?room=${DEFAULT_ROOM_ID}&role=client`,
      ownerName: 'Kargul Studio',
      createdAt: Date.now(),
    },
  ],
  posts: DEFAULT_POSTS,
  activePostId: 'post_1',
  brandAssets: DEFAULT_BRAND_ASSETS,
  selectedElementId: null,
  pinModeActive: false,
  selectedPinId: null,
  isLoginOpen: false,
  isCreateRoomOpen: false,
  isCreatePostOpen: false,
  isShareOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.user };

    case 'SET_ROOM_ID': {
      const existingRoom = state.rooms.find((r) => r.id === action.roomId);
      return {
        ...state,
        roomId: action.roomId,
        sessionName: action.sessionName ?? existingRoom?.name ?? 'Board 1',
      };
    }

    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [action.room, ...state.rooms],
        roomId: action.room.id,
        sessionName: action.room.name,
      };

    case 'SET_POSTS':
      return { ...state, posts: action.posts };

    case 'ADD_POST': {
      const posts = [action.post, ...state.posts];
      return { ...state, posts, activePostId: action.post.id };
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

    case 'ADD_ANNOTATION': {
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
          ? state.activeUsers
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

    case 'SET_PIN_MODE':
      return { ...state, pinModeActive: action.active, selectedElementId: null };

    case 'SET_SELECTED_PIN':
      return { ...state, selectedPinId: action.id };

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
  loginUser: (name: string, role: UserRole) => void;
  createRoom: (name: string) => BoardRoom;
  createPost: (postData: Omit<BoardPost, 'id' | 'createdAt' | 'roomId' | 'createdBy' | 'createdByName'>) => BoardPost;
  addBrandAsset: (name: string, category: BrandAsset['category'], src: string) => void;
  addAnnotation: (annotation: Omit<PinAnnotation, 'id' | 'createdAt' | 'status' | 'index'>) => PinAnnotation;
  resolveAnnotation: (id: string) => void;
  reopenAnnotation: (id: string) => void;
  addCanvasElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Synchronize LocalStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load URL params if any
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const urlRole = params.get('role') as UserRole | null;

    // LocalStorage user session
    const savedUser = localStorage.getItem('loopx_user_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', user: parsed });
      } catch (_) {}
    } else if (urlRole === 'client') {
      const clientUser: ActiveUser & { role: UserRole } = {
        uid: `client_${uuidv4().substring(0, 6)}`,
        name: 'Client Reviewer',
        status: 'ONLINE',
        role: 'client',
      };
      localStorage.setItem('loopx_user_session', JSON.stringify(clientUser));
      dispatch({ type: 'SET_USER', user: clientUser });
    }

    // Check Supabase Auth session for Admin
    import('../lib/supabaseClient').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const adminUser: ActiveUser & { role: UserRole } = {
            uid: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email || 'Studio Admin',
            status: 'ONLINE',
            role: 'owner',
          };
          dispatch({ type: 'SET_USER', user: adminUser });
        }
      });
    });

    // LocalStorage rooms
    const savedRooms = localStorage.getItem('loopx_rooms');
    if (savedRooms) {
      try {
        const parsed = JSON.parse(savedRooms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((r) => dispatch({ type: 'ADD_ROOM', room: r }));
        }
      } catch (_) {}
    }

    if (urlRoom) {
      dispatch({ type: 'SET_ROOM_ID', roomId: urlRoom });
    }

    // LocalStorage posts
    const savedPosts = localStorage.getItem('loopx_posts');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'SET_POSTS', posts: parsed });
        }
      } catch (_) {}
    }

    // LocalStorage brand assets
    const savedAssets = localStorage.getItem('loopx_brand_assets');
    if (savedAssets) {
      try {
        const parsed = JSON.parse(savedAssets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'SET_BRAND_ASSETS', assets: parsed });
        }
      } catch (_) {}
    }
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('loopx_posts', JSON.stringify(state.posts));
  }, [state.posts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('loopx_brand_assets', JSON.stringify(state.brandAssets));
  }, [state.brandAssets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('loopx_rooms', JSON.stringify(state.rooms));
  }, [state.rooms]);

  const loginUser = useCallback((name: string, role: UserRole) => {
    const user: ActiveUser & { role: UserRole } = {
      uid: `${role}_${uuidv4().substring(0, 6)}`,
      name: name || (role === 'owner' ? 'Kargul Lead' : 'Client Guest'),
      status: 'ONLINE',
      role,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('loopx_user_session', JSON.stringify(user));
    }
    dispatch({ type: 'SET_USER', user });
  }, []);

  const createRoom = useCallback(
    (name: string): BoardRoom => {
      const id = `room_${uuidv4().substring(0, 8)}`;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const room: BoardRoom = {
        id,
        name: name || 'Untitled Board',
        shareUrl: `${origin}?room=${id}&role=client`,
        ownerName: state.currentUser.name,
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_ROOM', room });
      return room;
    },
    [state.currentUser.name],
  );

  const createPost = useCallback(
    (postData: Omit<BoardPost, 'id' | 'createdAt' | 'roomId' | 'createdBy' | 'createdByName'>): BoardPost => {
      const post: BoardPost = {
        ...postData,
        id: `post_${uuidv4().substring(0, 8)}`,
        roomId: state.roomId,
        createdBy: state.currentUser.uid,
        createdByName: state.currentUser.name,
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_POST', post });
      return post;
    },
    [state.roomId, state.currentUser.uid, state.currentUser.name],
  );

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
      return full;
    },
    [],
  );

  const resolveAnnotation = useCallback(
    (id: string) => {
      dispatch({
        type: 'RESOLVE_ANNOTATION',
        id,
        resolvedBy: state.currentUser.name,
        resolvedAt: Date.now(),
      });
    },
    [state.currentUser.name],
  );

  const reopenAnnotation = useCallback((id: string) => {
    dispatch({ type: 'REOPEN_ANNOTATION', id });
  }, []);

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

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loginUser,
        createRoom,
        createPost,
        addBrandAsset,
        addAnnotation,
        resolveAnnotation,
        reopenAnnotation,
        addCanvasElement,
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
