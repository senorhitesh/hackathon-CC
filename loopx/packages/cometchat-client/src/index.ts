// ─── @repo/cometchat-client — Public API ────────────────────────────────────────
// Re-export all public helpers from the chat and calls sub-modules.

export {
  // Initialization
  initCometChat,
  isMockMode,
  // Auth
  loginUser,
  logoutUser,
  // Annotations (Custom Messages)
  sendAnnotation,
  resolveAnnotation,
  reopenAnnotation,
  // Real-time listeners & Messaging
  addAnnotationListener,
  addPresenceListener,
  sendCometChatMessage,
  sendCometChatMediaMessage,
  fetchCometChatMessageHistory,
  addCometChatMessageListener,
  // Real-time Collaboration & Presence Sync
  sendCollabSyncMessage,
  addCollabSyncListener,
  COLLAB_SYNC_CUSTOM_TYPE,
  // Group Management
  createCometChatGroup,
  getCometChatGroup,
  joinCometChatGroup,
  getOrCreateGroup,
  fetchOnlineGroupMembers,
  // User Management
  createOrGetUser,
  getLoggedInUser,
} from './chat';

export type { AnnotationListenerCallbacks, PresenceCallbacks } from './chat';

export {
  // Calls / Huddle
  initCometChatCalls,
  getCallsSDK,
  generateCallToken,
  startHuddle,
  leaveHuddle,
  toggleMute,
  toggleVideo,
} from './calls';

export type { HuddleOptions } from './calls';

export {
  // Mock utilities
  getMockCurrentUser,
  MOCK_USERS,
  initMockBroadcast,
  subscribeMockEvents,
  playAnnotationChime,
  getMockHuddleState,
} from './mock';

export type { MockBroadcastEvent, MockHuddleState } from './mock';

// Config helpers
export { getCometChatConfig, ANNOTATION_CUSTOM_TYPE } from './config';
