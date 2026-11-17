import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp, type ThemeStyle } from '../context/AppContext';
import {
  isSupabaseConfigured,
  signInWithEmailPassword,
  signInWithGoogle,
  signInWithMagicLink,
  signUpWithEmailPassword,
} from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { state, loginDemo, registerNewFamily, acceptInvitation, themeStyle, setThemeStyle, theme, toggleTheme } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic' | 'create_family' | 'join'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        if (mode === 'create_family') {
          if (!familyName.trim() || !displayName.trim()) {
            setMessage({ type: 'err', text: 'Please enter a family name and your name.' });
          } else {
            registerNewFamily(familyName.trim(), displayName.trim(), email || 'parent@family.app');
          }
          setLoading(false);
          return;
        }
        if (mode === 'join') {
          const ok = acceptInvitation(inviteToken.trim(), displayName.trim(), email.trim());
          if (!ok) {
            setMessage({
              type: 'err',
              text: 'Invalid or expired invite token. Try "rivera-invite-2026-sofia" for the sample invite.',
            });
          }
          setLoading(false);
          return;
        }
        loginDemo(state.members[0]?.id);
        setLoading(false);
        return;
      }

      if (mode === 'signin') {
        const { error } = await signInWithEmailPassword(email, password);
        if (error) setMessage({ type: 'err', text: error.message });
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmailPassword(email, password, displayName);
        if (error) setMessage({ type: 'err', text: error.message });
        else setMessage({ type: 'ok', text: 'Check your email to confirm your account!' });
      } else if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) setMessage({ type: 'err', text: error.message });
        else setMessage({ type: 'ok', text: 'Magic link sent! Check your inbox.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Top-right Live Style Preview Bar */}
      <div className="max-w-5xl w-full mx-auto flex justify-end items-center gap-2 mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
          {(
            [
              { id: 'obsidian', label: 'Obsidian Mint' },
              { id: 'aurora', label: 'Aurora Rose' },
              { id: 'nordic', label: 'Nordic Gold' },
            ] as { id: ThemeStyle; label: string }[]
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setThemeStyle(s.id)}
              className={`btn-tactile px-3 py-1 rounded-lg text-xs font-semibold ${
                themeStyle === s.id
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-tactile px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Sleek Welcome + Interactive Member Cards */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Kids & Grownups
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Family Command Center
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-[50ch]">
              One sleek home for daily quests, shared schedules, habit streaks, and private
              journals—crafted to feel effortless for parents and rewarding for kids.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 accent-text" />
                Jump into {state.family.name}
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                Instant Demo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {state.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => loginDemo(m.id)}
                  className="btn-tactile group flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-white/[0.05] text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#131620]"
                      style={{
                        backgroundColor: `${m.avatarColor}20`,
                        // @ts-expect-error css custom property for ring
                        '--tw-ring-color': m.avatarColor,
                      }}
                    >
                      {m.avatarEmoji}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {m.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {m.role === 'parent' ? 'Parent' : m.ageGroup}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sign In Card */}
        <div className="surface-card rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'signin' && 'Sign in to your family'}
              {mode === 'signup' && 'Create member account'}
              {mode === 'magic' && 'Magic link sign in'}
              {mode === 'create_family' && 'Register a new family'}
              {mode === 'join' && 'Join with invite code'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {isSupabaseConfigured
                ? 'Connected to Supabase Auth'
                : 'Supabase-ready Auth (Local Offline Mode active)'}
            </p>
          </div>

          <div className="flex flex-wrap gap-1 mb-5 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'magic', label: 'Magic Link' },
              { id: 'create_family', label: 'New Family' },
              { id: 'join', label: 'Join Invite' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id as typeof mode);
                  setMessage(null);
                }}
                className={`btn-tactile flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold ${
                  mode === tab.id
                    ? 'bg-white dark:bg-[#1E2231] text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSupabaseAuth} className="space-y-4">
            {mode === 'create_family' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g., The Rivera Family"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
            )}

            {mode === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invitation Code
                </label>
                <input
                  type="text"
                  required
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="rivera-invite-2026-sofia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
            )}

            {(mode === 'signup' || mode === 'create_family' || mode === 'join') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required={mode !== 'create_family' || isSupabaseConfigured}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
            </div>

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required={isSupabaseConfigured}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                  />
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  message.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile w-full py-2.5 px-4 rounded-xl accent-bg font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {mode === 'join' ? <UserPlus className="w-4 h-4" /> : null}
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Sign Up'
                : mode === 'magic'
                ? 'Send Magic Link'
                : mode === 'create_family'
                ? 'Create Family Workspace'
                : 'Accept Invite & Join'}
            </button>
          </form>

          {isSupabaseConfigured && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="btn-tactile w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-sm font-medium"
              >
                Continue with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
