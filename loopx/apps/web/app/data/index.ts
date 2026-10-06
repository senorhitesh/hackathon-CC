/**
 * Excalidraw Zero-Knowledge Collaboration & Encryption Module
 * 
 * Implements browser-native 128-bit AES-GCM encryption key generation,
 * room ID generation, URL hash format (#room=<roomId>,<roomKey>),
 * and zero-knowledge end-to-end encryption relays.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const ROOM_ID_BYTES = 10;
export const IV_LENGTH_BYTES = 12; // 96-bit standard IV for AES-GCM
export const DELETED_ELEMENT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const FILE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024; // 2MB

export const WS_SUBTYPES = {
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  INIT: 'INIT',
  UPDATE: 'UPDATE',
  MOUSE_LOCATION: 'MOUSE_LOCATION',
  USER_VISIBLE_SCENE_BOUNDS: 'USER_VISIBLE_SCENE_BOUNDS',
  IDLE_STATUS: 'IDLE_STATUS',
} as const;

export type WSSubtype = (typeof WS_SUBTYPES)[keyof typeof WS_SUBTYPES];

// ─── Binary & String Converters ──────────────────────────────────────────────

export const bytesToHexString = (buffer: Uint8Array): string => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hexStringToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

export const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const base64UrlToBytes = (base64url: string): Uint8Array => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ─── Web Crypto API (AES-GCM 128-bit) ─────────────────────────────────────────

export type EncryptedData = {
  data: ArrayBuffer;
  iv: Uint8Array;
};

export const generateRoomId = async (): Promise<string> => {
  const buffer = new Uint8Array(ROOM_ID_BYTES);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < ROOM_ID_BYTES; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHexString(buffer);
};

export const generateEncryptionKey = async <
  T extends 'string' | 'cryptoKey' = 'string',
>(
  returnFormat: T = 'string' as T,
): Promise<T extends 'cryptoKey' ? CryptoKey : string> => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for SSR or non-subtle environments
    const randomBytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) randomBytes[i] = Math.floor(Math.random() * 256);
    return bytesToBase64Url(randomBytes) as any;
  }

  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 128,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  if (returnFormat === 'cryptoKey') {
    return key as any;
  }

  const rawKey = await window.crypto.subtle.exportKey('raw', key);
  return bytesToBase64Url(new Uint8Array(rawKey)) as any;
};

export const importEncryptionKey = async (
  keyString: string,
  usage: 'encrypt' | 'decrypt' = 'decrypt',
): Promise<CryptoKey> => {
  const keyBytes = base64UrlToBytes(keyString);
  return window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 128 },
    false,
    [usage],
  );
};

export const encryptData = async (
  key: string | CryptoKey,
  data: Uint8Array | ArrayBuffer | string,
): Promise<EncryptedData> => {
  const cryptoKey =
    typeof key === 'string' ? await importEncryptionKey(key, 'encrypt') : key;

  const iv = new Uint8Array(IV_LENGTH_BYTES);
  window.crypto.getRandomValues(iv);

  const encodedData =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    encodedData as unknown as BufferSource,
  );

  return {
    data: encrypted,
    iv,
  };
};

export const decryptData = async (
  iv: Uint8Array,
  encrypted: ArrayBuffer,
  decryptionKey: string | CryptoKey,
): Promise<ArrayBuffer> => {
  const cryptoKey =
    typeof decryptionKey === 'string'
      ? await importEncryptionKey(decryptionKey, 'decrypt')
      : decryptionKey;

  return window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    encrypted,
  );
};

// ─── Link Generation & Parsing ───────────────────────────────────────────────

const RE_COLLAB_LINK = /^#room=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/;

export const isCollaborationLink = (link: string): boolean => {
  try {
    const url = new URL(
      link,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    return RE_COLLAB_LINK.test(url.hash);
  } catch {
    return false;
  }
};

export const getCollaborationLinkData = (
  link: string,
): { roomId: string; roomKey: string } | null => {
  try {
    const url = new URL(
      link,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    const hash = url.hash;
    const match = hash.match(RE_COLLAB_LINK);
    if (!match) return null;

    const roomId = match[1]!;
    const roomKey = match[2]!;

    // 128-bit key represented in base64url must be exactly 22 chars
    if (roomKey.length !== 22) {
      console.warn('Invalid encryption key length: expected 22 chars, received:', roomKey.length);
      return null;
    }

    return { roomId, roomKey };
  } catch {
    return null;
  }
};

export const generateCollaborationLinkData = async (): Promise<{
  roomId: string;
  roomKey: string;
}> => {
  const roomId = await generateRoomId();
  const roomKey = await generateEncryptionKey('string');

  if (!roomKey) {
    throw new Error("Couldn't generate room key");
  }

  return { roomId, roomKey };
};

export const getCollaborationLink = (data: {
  roomId: string;
  roomKey: string;
}): string => {
  if (typeof window !== 'undefined') {
    const basePath = window.location.pathname.startsWith('/app')
      ? window.location.pathname
      : '/app';
    return `${window.location.origin}${basePath}#room=${data.roomId},${data.roomKey}`;
  }
  return `/app#room=${data.roomId},${data.roomKey}`;
};

// ─── Collaboration Socket & Sync Types ──────────────────────────────────────

export type SyncableExcalidrawElement = any & {
  isDeleted?: boolean;
  updated?: number;
};

export const isSyncableElement = (
  element: SyncableExcalidrawElement,
): boolean => {
  if (element.isDeleted) {
    if (element.updated && element.updated > Date.now() - DELETED_ELEMENT_TIMEOUT) {
      return true;
    }
    return false;
  }
  return true;
};

export const getSyncableElements = (
  elements: readonly SyncableExcalidrawElement[],
): SyncableExcalidrawElement[] =>
  elements.filter((element) => isSyncableElement(element));

export type SocketUpdateDataSource = {
  INVALID_RESPONSE: {
    type: typeof WS_SUBTYPES.INVALID_RESPONSE;
  };
  SCENE_INIT: {
    type: typeof WS_SUBTYPES.INIT;
    payload: {
      elements: readonly any[];
    };
  };
  SCENE_UPDATE: {
    type: typeof WS_SUBTYPES.UPDATE;
    payload: {
      elements: readonly any[];
    };
  };
  MOUSE_LOCATION: {
    type: typeof WS_SUBTYPES.MOUSE_LOCATION;
    payload: {
      socketId: string;
      pointer: { x: number; y: number; tool: 'pointer' | 'laser' };
      button: 'down' | 'up';
      selectedElementIds?: Record<string, boolean>;
      username: string;
    };
  };
  USER_VISIBLE_SCENE_BOUNDS: {
    type: typeof WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS;
    payload: {
      socketId: string;
      username: string;
      sceneBounds: any;
    };
  };
  IDLE_STATUS: {
    type: typeof WS_SUBTYPES.IDLE_STATUS;
    payload: {
      socketId: string;
      userState: 'active' | 'idle' | 'away';
      username: string;
    };
  };
};

export type SocketUpdateDataIncoming =
  SocketUpdateDataSource[keyof SocketUpdateDataSource];

export type SocketUpdateData =
  SocketUpdateDataSource[keyof SocketUpdateDataSource] & {
    _brand: 'socketUpdateData';
  };

// ─── Conflict Resolution (Deterministic Reconcile Without Server) ───────────

export interface VersionedElement {
  id: string;
  version?: number;
  versionNonce?: number;
  [key: string]: any;
}

export const shouldDiscardRemoteElement = <
  TLocal extends VersionedElement = VersionedElement,
  TRemote extends VersionedElement = VersionedElement,
>(
  localAppState: { editingElementId?: string | null; draggingElementId?: string | null } = {},
  local: TLocal | undefined,
  remote: TRemote,
): boolean => {
  if (!local) return false;

  // Local element is actively being edited or dragged
  if (
    (localAppState.editingElementId && local.id === localAppState.editingElementId) ||
    (localAppState.draggingElementId && local.id === localAppState.draggingElementId)
  ) {
    return true;
  }

  const localVersion = local.version ?? 0;
  const remoteVersion = remote.version ?? 0;

  // Local element is newer
  if (localVersion > remoteVersion) {
    return true;
  }

  // Resolve conflicting edits deterministically by taking the one with the lowest versionNonce
  if (localVersion === remoteVersion) {
    const localNonce = local.versionNonce ?? 0;
    const remoteNonce = remote.versionNonce ?? 0;
    if (localNonce <= remoteNonce) {
      return true;
    }
  }

  return false;
};

export const reconcileElements = <T extends VersionedElement>(
  localElements: readonly T[],
  remoteElements: readonly T[],
  localAppState: { editingElementId?: string | null; draggingElementId?: string | null } = {},
): T[] => {
  const localMap = new Map<string, T>(localElements.map((el) => [el.id, el]));
  const reconciled: T[] = [];
  const added = new Set<string>();

  // Process remote elements
  for (const remoteElement of remoteElements) {
    if (!added.has(remoteElement.id)) {
      const localElement = localMap.get(remoteElement.id);
      const discard = shouldDiscardRemoteElement(localAppState, localElement, remoteElement);

      if (localElement && discard) {
        reconciled.push(localElement);
        added.add(localElement.id);
      } else {
        reconciled.push(remoteElement);
        added.add(remoteElement.id);
      }
    }
  }

  // Process remaining local elements
  for (const localElement of localElements) {
    if (!added.has(localElement.id)) {
      reconciled.push(localElement);
      added.add(localElement.id);
    }
  }

  return reconciled;
};

// ─── Network Relay (Portal / Encrypted Broadcast) ───────────────────────────

export interface CollabTransport {
  send: (payload: { encryptedBuffer: ArrayBuffer; iv: Uint8Array; roomId: string }) => void | Promise<void>;
  onReceive?: (callback: (encryptedBuffer: ArrayBuffer, iv: Uint8Array) => void) => void;
  close?: () => void;
}

export class Portal {
  roomId: string | null = null;
  roomKey: string | null = null;
  socketInitialized: boolean = false;
  broadcastedElementVersions: Map<string, number> = new Map();
  transport: CollabTransport | null = null;

  open(roomId: string, roomKey: string, transport?: CollabTransport) {
    this.roomId = roomId;
    this.roomKey = roomKey;
    this.socketInitialized = true;
    this.transport = transport || null;

    if (this.transport && this.transport.onReceive) {
      this.transport.onReceive(async (encryptedBuffer, iv) => {
        if (!this.roomKey) return;
        try {
          return await this.decryptPayload(iv, encryptedBuffer, this.roomKey);
        } catch (err) {
          console.error('[Portal] Failed to decrypt incoming payload:', err);
        }
      });
    }

    return this;
  }

  close() {
    if (this.transport?.close) {
      this.transport.close();
    }
    this.transport = null;
    this.roomId = null;
    this.roomKey = null;
    this.socketInitialized = false;
    this.broadcastedElementVersions.clear();
  }

  isOpen(): boolean {
    return Boolean(this.socketInitialized && this.roomId && this.roomKey);
  }

  async encryptPayload(
    data: SocketUpdateDataSource[keyof SocketUpdateDataSource],
  ): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> {
    if (!this.roomKey) {
      throw new Error('Cannot encrypt payload: roomKey is not set');
    }
    const json = JSON.stringify(data);
    const { data: encryptedBuffer, iv } = await encryptData(this.roomKey, json);
    return { encryptedBuffer, iv };
  }

  async decryptPayload(
    iv: Uint8Array,
    encryptedBuffer: ArrayBuffer,
    roomKey?: string,
  ): Promise<SocketUpdateDataIncoming> {
    const key = roomKey || this.roomKey;
    if (!key) {
      throw new Error('Cannot decrypt payload: roomKey is not set');
    }
    const decryptedBuffer = await decryptData(iv, encryptedBuffer, key);
    const decodedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decodedString) as SocketUpdateDataIncoming;
  }

  async broadcastSocketData(
    data: SocketUpdateDataSource[keyof SocketUpdateDataSource],
    _volatile: boolean = false,
  ): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array } | null> {
    if (!this.isOpen() || !this.roomKey || !this.roomId) {
      return null;
    }

    const { encryptedBuffer, iv } = await this.encryptPayload(data);

    if (this.transport) {
      await this.transport.send({
        encryptedBuffer,
        iv,
        roomId: this.roomId,
      });
    }

    return { encryptedBuffer, iv };
  }

  async broadcastScene(
    updateType: typeof WS_SUBTYPES.INIT | typeof WS_SUBTYPES.UPDATE,
    elements: readonly VersionedElement[],
    syncAll: boolean = false,
  ) {
    const syncableElements = elements.reduce((acc, el) => {
      const version = el.version ?? 0;
      if (
        syncAll ||
        !this.broadcastedElementVersions.has(el.id) ||
        version > (this.broadcastedElementVersions.get(el.id) ?? -1)
      ) {
        acc.push(el);
      }
      return acc;
    }, [] as VersionedElement[]);

    for (const el of syncableElements) {
      this.broadcastedElementVersions.set(el.id, el.version ?? 0);
    }

    const data = {
      type: updateType,
      payload: {
        elements: syncableElements,
      },
    };

    return this.broadcastSocketData(data as any);
  }

  async broadcastMouseLocation(payload: {
    socketId: string;
    pointer: { x: number; y: number; tool?: 'pointer' | 'laser' };
    button?: 'down' | 'up';
    username: string;
    selectedElementIds?: Record<string, boolean>;
  }) {
    const data = {
      type: WS_SUBTYPES.MOUSE_LOCATION,
      payload: {
        socketId: payload.socketId,
        pointer: {
          x: payload.pointer.x,
          y: payload.pointer.y,
          tool: payload.pointer.tool || 'pointer',
        },
        button: payload.button || 'up',
        username: payload.username,
        selectedElementIds: payload.selectedElementIds,
      },
    };

    return this.broadcastSocketData(data as any, true);
  }

  async broadcastIdleChange(payload: {
    socketId: string;
    userState: 'active' | 'idle' | 'away';
    username: string;
  }) {
    const data = {
      type: WS_SUBTYPES.IDLE_STATUS,
      payload: {
        socketId: payload.socketId,
        userState: payload.userState,
        username: payload.username,
      },
    };

    return this.broadcastSocketData(data as any, true);
  }
}
