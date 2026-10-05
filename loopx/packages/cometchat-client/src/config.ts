// ─── CometChat SDK Configuration ───────────────────────────────────────────────
// Reads from NEXT_PUBLIC_ env vars (works in both Next.js server/client contexts)

declare const process: { env: Record<string, string | undefined> };

export interface CometChatConfig {
  appId: string;
  region: string;
  authKey: string;
}

/**
 * Loads CometChat config from environment variables.
 * Returns null if any required variable is missing (will trigger mock/sim mode).
 */
export function getCometChatConfig(): CometChatConfig | null {
  const appId = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID?.trim();
  const region = process.env.NEXT_PUBLIC_COMETCHAT_REGION?.trim();
  const authKey = process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY?.trim();

  if (!appId || !region || !authKey) {
    return null;
  }

  return { appId, region, authKey };
}

export const ANNOTATION_CUSTOM_TYPE = 'creative_annotation' as const;
export const DEFAULT_HUDDLE_ROOM_SUFFIX = '_huddle';
