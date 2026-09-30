'use client';

import React from 'react';
import type { ActiveUser } from '@repo/types';
import { useAppContext } from '../context/AppContext';

function UserBadge({ user, isCurrentUser }: { user: ActiveUser; isCurrentUser: boolean }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-indigo-600',
    'bg-violet-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-sky-600',
  ];
  const colorIdx = user.uid.charCodeAt(0) % colors.length;

  return (
    <div
      className="relative flex-shrink-0"
      title={`${user.name}${isCurrentUser ? ' (You)' : ''} — ${user.status.toLowerCase()}`}
    >
      <div
        className={`
          w-7 h-7 rounded-full flex items-center justify-center
          text-xs font-semibold text-white
          ring-2 ring-canvas-bg
          ${colors[colorIdx]}
          ${isCurrentUser ? 'ring-accent' : ''}
        `}
      >
        {initials}
      </div>
      {/* Presence dot */}
      <span
        className={`
          absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
          ring-1 ring-canvas-bg
          ${user.status === 'ONLINE' ? 'bg-green-500' : user.status === 'AWAY' ? 'bg-amber-400' : 'bg-canvas-hover'}
        `}
      />
    </div>
  );
}

export function PresenceBar() {
  const { state } = useAppContext();
  const { activeUsers, currentUser } = state;

  const displayUsers = activeUsers.slice(0, 5);
  const overflow = Math.max(0, activeUsers.length - 5);

  return (
    <div className="flex items-center gap-1" title="Active collaborators">
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <UserBadge
            key={user.uid}
            user={user}
            isCurrentUser={user.uid === currentUser.uid}
          />
        ))}
        {overflow > 0 && (
          <div className="w-7 h-7 rounded-full bg-canvas-hover flex items-center justify-center text-xs text-canvas-muted ring-2 ring-canvas-bg">
            +{overflow}
          </div>
        )}
      </div>
      {activeUsers.length > 0 && (
        <span className="text-xs text-canvas-muted ml-2 hidden md:block">
          {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} here
        </span>
      )}
    </div>
  );
}
