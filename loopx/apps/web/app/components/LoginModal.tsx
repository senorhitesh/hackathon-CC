'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import type { UserRole } from '@repo/types';

export function LoginModal() {
  const { state, dispatch, loginUser } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');

  if (!state.isLoginOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginUser(username.trim() || (role === 'owner' ? 'Kargul Studio Lead' : 'Client Reviewer'), role);
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isLoginOpen', value: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
        {/* Branding Header matching KARGUL STUDIO style */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            KARGUL STUDIO
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">
            Live Guidelines System
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your live creative workspace
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'owner'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Studio Owner</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'client'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Client / Guest</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {role === 'owner' ? 'Studio Lead Name' : 'Your Full Name'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === 'owner' ? 'e.g. Alex Rivera' : 'e.g. Client Partner'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Access Password / PIN
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2 group mt-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Powered by <strong className="text-slate-700">loopx & CometChat</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
