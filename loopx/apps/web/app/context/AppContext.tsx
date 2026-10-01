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
import { supabase } from '../lib/supabaseClient';

// ─── Initial Data (Empty by Default — Real DB Driven) ─────────────────────────

const DEFAULT_BRAND_ASSETS: BrandAsset[] = [];
const DEFAULT_POSTS: BoardPost[] = [];

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
  | { type: 'SET_ROOMS'; rooms: BoardRoom[] }
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
  | { type: 'SET_PIN_MODE'; active: boolean }
  | { type: 'SET_SELECTED_PIN'; id: string | null }
  | { type: 'TOGGLE_MODAL'; modal: 'isLoginOpen' | 'isCreateRoomOpen' | 'isCreatePostOpen' | 'isShareOpen'; value?: boolean };

const DEFAULT_ROOM_ID = 'loopx-main-room';

const initialState: AppState = {
  roomId: DEFAULT_ROOM_ID,
  sessionName: 'Main Studio Board',
  currentUser: {
    uid: 'owner_lead',
    name: 'Kargul Studio Lead',
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
      name: 'Main Studio Board',
      shareUrl: typeof window !== 'undefined' ? `${window.location.origin}?room=${DEFAULT_ROOM_ID}&role=client` : `?room=${DEFAULT_ROOM_ID}&role=client`,
      ownerName: 'Kargul Studio',
      createdAt: Date.now(),
    },
  ],
  posts: DEFAULT_POSTS,
  activePostId: null,
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

    case 'SET_ROOMS':
      return { ...state, rooms: action.rooms };

    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [action.room, ...state.rooms.filter((r) => r.id !== action.room.id)],
        roomId: action.room.id,
        sessionName: action.room.name,
      };

    case 'SET_POSTS':
      return { ...state, posts: action.posts, activePostId: action.posts[0]?.id ?? null };

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

    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.annotations };

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

  // Synchronize Supabase Auth & DB Data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    if (urlRoom) {
      dispatch({ type: 'SET_ROOM_ID', roomId: urlRoom });
    }

    // Fetch Database Tables from Supabase with local fallback
    async function loadSupabaseData() {
      // 1. Fetch Rooms from Supabase
      try {
        const { data: dbRooms } = await supabase.from('rooms').select('*');
        if (dbRooms && dbRooms.length > 0) {
          const formattedRooms: BoardRoom[] = dbRooms.map((r: any) => ({
            id: r.id,
            name: r.name,
            shareUrl: r.share_url || `${window.location.origin}?room=${r.id}&role=client`,
            ownerName: r.owner_name || 'Kargul Studio',
            createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
          }));
          dispatch({ type: 'SET_ROOMS', rooms: formattedRooms });
        }
      } catch (_) {}

      // 2. Fetch Posts from Supabase DB
      try {
        const targetRoom = urlRoom || state.roomId;
        const { data: dbPosts } = await supabase.from('posts').select('*').eq('room_id', targetRoom);
        if (dbPosts && dbPosts.length > 0) {
          const formattedPosts: BoardPost[] = dbPosts.map((p: any) => ({
            id: p.id,
            roomId: p.room_id,
            title: p.title,
            description: p.description,
            mediaUrl: p.media_url,
            mediaType: p.media_type || 'image',
            preset: p.preset || 'IG_SQUARE',
            status: p.status || 'DRAFT',
            createdBy: p.created_by,
            createdByName: p.created_by_name || 'Studio Owner',
            createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            x: p.x,
            y: p.y,
          }));
          dispatch({ type: 'SET_POSTS', posts: formattedPosts });
        } else {
          const savedPosts = localStorage.getItem('loopx_posts');
          if (savedPosts) {
            const parsed = JSON.parse(savedPosts);
            if (Array.isArray(parsed)) dispatch({ type: 'SET_POSTS', posts: parsed });
          }
        }
      } catch (_) {}

      // 3. Fetch Brand Assets from Supabase DB
      try {
        const { data: dbAssets } = await supabase.from('brand_assets').select('*');
        if (dbAssets && dbAssets.length > 0) {
          const formattedAssets: BrandAsset[] = dbAssets.map((a: any) => ({
            id: a.id,
            name: a.name,
            category: a.category || 'brand',
            src: a.src,
          }));
          dispatch({ type: 'SET_BRAND_ASSETS', assets: formattedAssets });
        } else {
          const savedAssets = localStorage.getItem('loopx_brand_assets');
          if (savedAssets) {
            const parsed = JSON.parse(savedAssets);
            if (Array.isArray(parsed)) dispatch({ type: 'SET_BRAND_ASSETS', assets: parsed });
          }
        }
      } catch (_) {}
    }

    loadSupabaseData();
  }, []);

  // Save changes to LocalStorage as secondary cache
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

      // Save to Supabase Database
      (async () => {
        try {
          await supabase.from('rooms').insert({
            id: room.id,
            name: room.name,
            share_url: room.shareUrl,
            owner_name: room.ownerName,
          });
        } catch (_) {}
      })();

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

      // Save Post directly to Supabase DB
      (async () => {
        try {
          await supabase.from('posts').insert({
            id: post.id,
            room_id: post.roomId,
            title: post.title,
            description: post.description,
            media_url: post.mediaUrl,
            media_type: post.mediaType,
            preset: post.preset,
            status: post.status,
            created_by: post.createdBy,
            created_by_name: post.createdByName,
            x: post.x,
            y: post.y,
          });
        } catch (_) {}
      })();

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

      // Save Brand Asset to Supabase DB
      (async () => {
        try {
          await supabase.from('brand_assets').insert({
            id: asset.id,
            name: asset.name,
            category: asset.category,
            src: asset.src,
          });
        } catch (_) {}
      })();
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

      // Save Annotation to Supabase DB
      (async () => {
        try {
          await supabase.from('annotations').insert({
            id: full.id,
            preset: full.preset,
            normalized_x: full.normalizedX,
            normalized_y: full.normalizedY,
            author_id: full.authorId,
            author_name: full.authorName,
            comment: full.comment,
            status: full.status,
          });
        } catch (_) {}
      })();

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

      // Update Supabase DB
      (async () => {
        try {
          await supabase.from('annotations').update({ status: 'RESOLVED', resolved_by: state.currentUser.name }).eq('id', id);
        } catch (_) {}
      })();
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
