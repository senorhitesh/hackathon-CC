'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AdProofSession,
  PinAnnotation,
  CanvasElement,
  PlatformPreset,
  ActiveUser,
  HuddleParticipant,
} from '@repo/types';
import { PLATFORM_PRESETS } from '@repo/types';

// ─── State & Actions ──────────────────────────────────────────────────────────

type Action =
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
  | { type: 'SET_SELECTED_PIN'; id: string | null };

interface AppState extends AdProofSession {
  selectedElementId: string | null;
  pinModeActive: boolean;
  selectedPinId: string | null;
}

const DEFAULT_ROOM_ID = 'adproof-demo-room';

const initialState: AppState = {
  roomId: DEFAULT_ROOM_ID,
  sessionName: 'Summer Campaign 2026',
  currentUser: {
    uid: 'local_user',
    name: 'You',
    status: 'ONLINE',
  },
  activePreset: 'IG_SQUARE',
  canvasElements: [],
  annotations: [],
  activeUsers: [],
  huddleActive: false,
  huddleParticipants: [],
  selectedElementId: null,
  pinModeActive: false,
  selectedPinId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience actions
  addAnnotation: (annotation: Omit<PinAnnotation, 'id' | 'createdAt' | 'status' | 'index'>) => PinAnnotation;
  resolveAnnotation: (id: string) => void;
  reopenAnnotation: (id: string) => void;
  addCanvasElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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
      value={{ state, dispatch, addAnnotation, resolveAnnotation, reopenAnnotation, addCanvasElement }}
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
