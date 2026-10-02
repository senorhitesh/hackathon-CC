'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import type { UserRole } from '@repo/types';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // loginUser from AppContext saves to localStorage + dispatches SET_USER
      loginUser(name.trim(), role, email.trim() || undefined);

      // Navigate to workspace — CometChat init happens in useCometChat hook
      router.push('/app');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 text-neutral-900 font-sans selection:bg-black selection:text-white">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-neutral-200/30 via-neutral-100/10 to-transparent pointer-events-none -z-10 blur-3xl" />

      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-neutral-200 shadow-xs">
            <svg
              className="w-5 h-5 fill-black"
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal tracking-tight text-neutral-950">
              Welcome to loopx
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-sans">
              Collaborative ad proofing canvas powered by CometChat
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CometChat Real-Time Engine Connected</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all font-sans"
              />
            </div>

            {/* Email Input (optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                Email <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@agency.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all font-sans"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'owner'
                      ? 'border-black bg-neutral-900 text-white shadow-md'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <p className="text-xs font-semibold">Creative Owner</p>
                  <span className={`text-[10px] mt-0.5 block ${role === 'owner' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Upload & manage creatives
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'client'
                      ? 'border-black bg-neutral-900 text-white shadow-md'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <p className="text-xs font-semibold">Client Reviewer</p>
                  <span className={`text-[10px] mt-0.5 block ${role === 'client' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Review & approve assets
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                name.trim() && !isLoading
                  ? 'bg-black hover:bg-neutral-800 text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                  <span>Connecting to CometChat...</span>
                </>
              ) : (
                <>
                  <span>Enter Workspace</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-neutral-400 font-mono">
          Real-time collaboration powered by CometChat SDK
        </p>
      </div>
    </div>
  );
}
