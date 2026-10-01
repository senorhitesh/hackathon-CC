// ─── Platform Presets ──────────────────────────────────────────────────────────

export type PlatformPreset = 'IG_SQUARE' | 'REELS_STORY' | 'X_BANNER' | 'LINKEDIN_POST';

export interface PlatformPresetDimensions {
  width: number;
  height: number;
  label: string;
  shortLabel: string;
  aspectRatio: string;
}

export const PLATFORM_PRESETS: Record<PlatformPreset, PlatformPresetDimensions> = {
  IG_SQUARE: {
    width: 1080,
    height: 1080,
    label: 'Instagram Square',
    shortLabel: 'IG 1:1',
    aspectRatio: '1 / 1',
  },
  REELS_STORY: {
    width: 1080,
    height: 1920,
    label: 'Reels / Story',
    shortLabel: 'Story 9:16',
    aspectRatio: '9 / 16',
  },
  X_BANNER: {
    width: 1200,
    height: 675,
    label: 'X / Twitter Banner',
    shortLabel: 'X 16:9',
    aspectRatio: '16 / 9',
  },
  LINKEDIN_POST: {
    width: 1200,
    height: 628,
    label: 'LinkedIn Post',
    shortLabel: 'LinkedIn',
    aspectRatio: '1200 / 628',
  },
};

// ─── Canvas Element Types ───────────────────────────────────────────────────────

export type CanvasElementType = 'image' | 'text' | 'badge';

export interface CanvasElementStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  background?: string;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  fontFamily?: string;
  opacity?: number;
  border?: string;
  padding?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  /** x position in pixels relative to artboard origin (top-left) */
  x: number;
  /** y position in pixels relative to artboard origin (top-left) */
  y: number;
  width: number;
  height: number;
  /** For text elements: the text content. For image elements: the image URL or data URI. */
  content: string;
  rotation: number;
  zIndex: number;
  style?: CanvasElementStyle;
  locked?: boolean;
  name?: string;
}

// ─── Pin Annotation ─────────────────────────────────────────────────────────────

export type AnnotationStatus = 'OPEN' | 'RESOLVED';

export interface PinAnnotation {
  /** Unique identifier — UUID or CometChat message ID */
  id: string;
  /** Which platform preset the annotation was placed on */
  preset: PlatformPreset;
  /**
   * Normalized X position (0.0 → 1.0) relative to canvas width.
   * This ensures pin accuracy across different viewport sizes and display scales.
   * Absolute pixel position = normalizedX * canvasRenderedWidth
   */
  normalizedX: number;
  /**
   * Normalized Y position (0.0 → 1.0) relative to canvas height.
   * Absolute pixel position = normalizedY * canvasRenderedHeight
   */
  normalizedY: number;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  comment: string;
  status: AnnotationStatus;
  /** Unix timestamp (ms) */
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  /** Sequential display index (1, 2, 3…) for the numbered pin marker */
  index?: number;
}

// ─── CometChat Custom Message Payloads ─────────────────────────────────────────

export type AnnotationAction = 'CREATE' | 'RESOLVE' | 'REOPEN';

export interface CometChatCustomPayload {
  type: 'creative_annotation';
  action: AnnotationAction;
  annotation: PinAnnotation;
}

// ─── Presence & Huddle ─────────────────────────────────────────────────────────

export type UserPresenceStatus = 'ONLINE' | 'OFFLINE' | 'AWAY';

export interface ActiveUser {
  uid: string;
  name: string;
  avatar?: string;
  status: UserPresenceStatus;
  /** Which preset they are currently viewing */
  activePreset?: PlatformPreset;
}

export interface HuddleParticipant {
  uid: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
}

// ─── Sidebar Asset Definitions ──────────────────────────────────────────────────

export type AssetCategory = 'brand' | 'product' | 'badge' | 'background' | 'text';

export interface BrandAsset {
  id: string;
  name: string;
  category: AssetCategory;
  /** URL or data URI */
  src: string;
  thumbnailSrc?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

// ─── App State Contracts ───────────────────────────────────────────────────────

export type UserRole = 'owner' | 'client';

export interface BoardPost {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  preset: PlatformPreset;
  status: 'DRAFT' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
  createdBy: string;
  createdByName: string;
  createdAt: number;
  x?: number;
  y?: number;
}

export interface BoardRoom {
  id: string;
  name: string;
  shareUrl: string;
  ownerName: string;
  createdAt: number;
}

export interface AdProofSession {
  roomId: string;
  sessionName: string;
  currentUser: ActiveUser & { role?: UserRole };
  activePreset: PlatformPreset;
  canvasElements: CanvasElement[];
  annotations: PinAnnotation[];
  activeUsers: ActiveUser[];
  huddleActive: boolean;
  huddleParticipants: HuddleParticipant[];
  posts?: BoardPost[];
  activePostId?: string | null;
  rooms?: BoardRoom[];
}

export type LoopXSession = AdProofSession;
