import { NextRequest, NextResponse } from 'next/server';

// ─── Cross-Browser Real-Time Collaboration Relay ──────────────────────────────
// Relays encrypted scene changes, cursor positions, and initial sync between
// different browsers (e.g. Chrome, Brave, Safari, Mobile) connected to the same roomId.

type ClientController = ReadableStreamDefaultController<Uint8Array>;

// In-memory room state and active SSE subscribers
const roomSubscribers = new Map<string, Set<ClientController>>();
const roomStateCache = new Map<string, { posts?: any[]; messages?: any[]; lastSeen?: number }>();

function sendSSE(controller: ClientController, data: any) {
  try {
    const encoder = new TextEncoder();
    const text = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(text));
  } catch (_) {
    // Controller may be closed
  }
}

// ─── GET: Server-Sent Events (SSE) Stream ────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') || 'default';

  let currentController: ClientController | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      currentController = controller;

      if (!roomSubscribers.has(roomId)) {
        roomSubscribers.set(roomId, new Set());
      }
      roomSubscribers.get(roomId)!.add(controller);

      // Send initial connection ACK
      sendSSE(controller, {
        type: 'connected',
        roomId,
        timestamp: Date.now(),
      });

      // If we have cached posts for this room, send them immediately to the new peer!
      const cached = roomStateCache.get(roomId);
      if (cached?.posts && cached.posts.length > 0) {
        sendSSE(controller, {
          type: 'canvas_initial_sync',
          posts: cached.posts,
          fromCache: true,
        });
      }
      if (cached?.messages && cached.messages.length > 0) {
        sendSSE(controller, {
          type: 'chat_initial_sync',
          messages: cached.messages,
          fromCache: true,
        });
      }
    },
    cancel() {
      if (currentController && roomSubscribers.has(roomId)) {
        roomSubscribers.get(roomId)!.delete(currentController);
        if (roomSubscribers.get(roomId)!.size === 0) {
          roomSubscribers.delete(roomId);
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

// ─── POST: Broadcast Action to all Subscribers ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, payload, senderUid } = body;

    if (!roomId || !payload) {
      return NextResponse.json({ error: 'Missing roomId or payload' }, { status: 400 });
    }

    // Cache posts and chat messages
    const currentEntry = roomStateCache.get(roomId) || {};
    if (payload.type === 'canvas_initial_sync' && Array.isArray(payload.posts)) {
      roomStateCache.set(roomId, { ...currentEntry, posts: payload.posts, lastSeen: Date.now() });
    } else if (payload.type === 'canvas_sync' && payload.event === 'POST_CREATED' && payload.post) {
      const current = currentEntry.posts || [];
      const updated = [...current.filter((p) => p.id !== payload.post.id), payload.post];
      roomStateCache.set(roomId, { ...currentEntry, posts: updated, lastSeen: Date.now() });
    } else if (payload.type === 'canvas_sync' && payload.event === 'POST_MOVED' && payload.postId) {
      const current = currentEntry.posts || [];
      const updated = current.map((p) =>
        p.id === payload.postId ? { ...p, x: payload.x, y: payload.y } : p
      );
      roomStateCache.set(roomId, { ...currentEntry, posts: updated, lastSeen: Date.now() });
    } else if (payload.type === 'canvas_sync' && payload.event === 'POST_DELETED' && payload.postId) {
      const current = currentEntry.posts || [];
      const updated = current.filter((p) => p.id !== payload.postId);
      roomStateCache.set(roomId, { ...currentEntry, posts: updated, lastSeen: Date.now() });
    } else if (payload.type === 'canvas_sync' && payload.event === 'CHAT_MESSAGE' && payload.message) {
      const currentMsgs = currentEntry.messages || [];
      if (!currentMsgs.some((m: any) => m.id === payload.message.id)) {
        const updatedMsgs = [...currentMsgs, payload.message].slice(-60);
        roomStateCache.set(roomId, { ...currentEntry, messages: updatedMsgs, lastSeen: Date.now() });
      }
    }

    // Broadcast to all active subscribers for this room (except sender if specified)
    const subscribers = roomSubscribers.get(roomId);
    if (subscribers && subscribers.size > 0) {
      const eventData = {
        ...payload,
        _senderUid: senderUid,
        _serverTimestamp: Date.now(),
      };

      for (const controller of subscribers) {
        sendSSE(controller, eventData);
      }
    }

    return NextResponse.json({ success: true, subscriberCount: subscribers?.size ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
