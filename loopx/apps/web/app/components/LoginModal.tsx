'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { User, ShieldCheck, ArrowRight, KeyRound, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserRole } from '@repo/types';

export function LoginModal() {
  const { state, dispatch, loginUser } = useAppContext();
  const [role, setRole] = useState<UserRole>('owner');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Admin Supabase Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  
  // Client Display Name
  const [clientName, setClientName] = useState('');

  // Status & Error handling
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!state.isLoginOpen) return null;

  async function handleAdminAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // Supabase Admin Signup
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

        setSuccessMsg('Admin Account Created! Logging in...');
        const displayName = adminName.trim() || data.user?.email || 'Studio Admin';
        loginUser(displayName, 'owner');
        setTimeout(() => {
          dispatch({ type: 'TOGGLE_MODAL', modal: 'isLoginOpen', value: false });
        }, 1000);
      } else {
        // Supabase Admin Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        const displayName = data.user?.user_metadata?.full_name || data.user?.email || 'Studio Admin';
        setSuccessMsg('Authenticated via Supabase!');
        loginUser(displayName, 'owner');
        setTimeout(() => {
          dispatch({ type: 'TOGGLE_MODAL', modal: 'isLoginOpen', value: false });
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
    dispatch({ type: 'TOGGLE_MODAL', modal: 'isLoginOpen', value: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            KARGUL STUDIO
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">
            Live Guidelines System
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'owner' ? 'Supabase Authentication for Admin' : 'Instant Guest Join for Clients'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('owner');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'owner'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin / Owner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('client');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'client'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Client (No Login)</span>
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {role === 'owner' ? (
          /* ── ADMIN SUPABASE AUTH FORM (Login & Signup) ── */
          <div>
            {/* Sign In vs Sign Up Sub-tabs */}
            <div className="flex items-center justify-center gap-4 text-xs font-semibold border-b border-slate-100 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex items-center gap-1 transition-colors ${
                  authMode === 'signin'
                    ? 'text-slate-900 border-b-2 border-slate-900 pb-1 -mb-3'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex items-center gap-1 transition-colors ${
                  authMode === 'signup'
                    ? 'text-slate-900 border-b-2 border-slate-900 pb-1 -mb-3'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Admin Sign Up</span>
              </button>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Full Name / Studio Title
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Admin Email (Supabase)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2 group mt-3"
              >
                <span>{loading ? 'Authenticating...' : authMode === 'signup' ? 'Create Admin Account' : 'Sign In as Admin'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>
        ) : (
          /* ── CLIENT INSTANT GUEST JOIN FORM (No Login Required) ── */
          <form onSubmit={handleClientJoin} className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
              <strong>No registration required for clients!</strong> Enter your name below to join the board and iterate live with the studio owner.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Your Name / Organization
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp Reviewer"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2 group mt-2"
            >
              <span>Join Workspace as Client</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Powered by <strong className="text-slate-700">Supabase Auth & loopx</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
