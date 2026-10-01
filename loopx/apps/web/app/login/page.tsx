'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import {
  ShieldCheck,
  ArrowRight,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { UserRole } from '@repo/types';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAppContext();

  const [role, setRole] = useState<UserRole>('owner');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Admin Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');

  // Client Form State
  const [clientName, setClientName] = useState('');

  // Status & Error state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleAdminAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: adminName.trim() || 'Studio Admin',
              role: 'owner',
            },
          },
        });

        if (error) throw error;

        const displayName = adminName.trim() || data.user?.email || 'Studio Admin';
        loginUser(displayName, 'owner');
        setSuccessMsg('Admin Account Created! Redirecting to Dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        const displayName =
          data.user?.user_metadata?.full_name || data.user?.email || 'Studio Admin';
        loginUser(displayName, 'owner');
        setSuccessMsg('Authenticated via Supabase! Redirecting to Dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleClientJoin(e: React.FormEvent) {
    e.preventDefault();
    const name = clientName.trim() || 'Client Reviewer';
    loginUser(name, 'client');
    router.push('/app');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-slate-900 font-sans selection:bg-indigo-500/20">
      {/* Header Branding */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <img
            src="/loogx-logo&favicon.png"
            alt="loopx logo"
            className="w-10 h-10 object-contain rounded-xl border border-slate-200 shadow-sm"
          />
          <span className="font-black text-2xl tracking-tight text-slate-900">
            loopx
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-medium">
          Studio Campaign Workspace & n8n Node Node Graph
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
        {/* Role Sub-tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setRole('owner');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              role === 'owner'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Admin Auth (Supabase)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('client');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              role === 'client'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>Client (Guest Access)</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {role === 'owner' ? (
          <div>
            {/* Sign In vs Sign Up Tabs */}
            <div className="flex items-center justify-center gap-6 border-b border-slate-100 pb-3 mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex items-center gap-1.5 transition-colors ${
                  authMode === 'signin'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1 -mb-3'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex items-center gap-1.5 transition-colors ${
                  authMode === 'signup'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1 -mb-3'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Admin Account</span>
              </button>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Studio Lead
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <span>
                  {loading
                    ? 'Authenticating...'
                    : authMode === 'signup'
                    ? 'Register & Open Admin Dashboard'
                    : 'Sign In to Admin Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleClientJoin} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 leading-relaxed">
              <strong>No signup required for clients!</strong> Enter your name below to jump straight into the studio review canvas.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name / Company Title
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp Lead"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <span>Join Studio Canvas as Client</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600 underline transition-colors">
          ← Return to Landing Page
        </Link>
      </div>
    </div>
  );
}
