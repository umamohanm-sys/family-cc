import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Download,
  Eye,
  Home,
  LogOut,
  Menu,
  Moon,
  Palette,
  Settings,
  Sun,
  Target,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp, type ThemeStyle } from '../context/AppContext';
import type { NavTab } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PRIMARY_NAV: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Today', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    currentMember,
    activeTab,
    setActiveTab,
    inspectingMemberId,
    setInspectingMemberId,
    switchMember,
    logout,
    theme,
    toggleTheme,
    themeStyle,
    setThemeStyle,
    isOnline,
    pendingSyncCount,
    notifications,
    markNotificationRead,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const inspectedMember = inspectingMemberId
    ? state.members.find((m) => m.id === inspectingMemberId)
    : null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-dvh flex flex-col text-slate-900 dark:text-zinc-100">
      {/* Sleek Top Command Navigation */}
      <header className="sticky top-0 z-30 surface-sidebar border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="btn-tactile lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveTab('home');
                setInspectingMemberId(null);
              }}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <div className="w-8 h-8 rounded-xl accent-bg flex items-center justify-center text-xs font-extrabold shrink-0">
                FC
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-bold tracking-tight truncate">
                  {state.family.name}
                </div>
              </div>
            </button>
          </div>

          {/* Center: Desktop Segmented Pill Nav */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.06]">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'home') setInspectingMemberId(null);
                  }}
                  className={`btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                    active
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'accent-text' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Sync, Theme, Notifications, Avatar Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[11px] font-semibold tabular-nums">
                <WifiOff className="w-3 h-3" />
                <span>{pendingSyncCount}</span>
              </div>
            )}
            {isOnline && (
              <div
                title="Synced"
                className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              >
                <Wifi className="w-3 h-3" />
              </div>
            )}

            {installPrompt && (
              <button
                onClick={handleInstall}
                className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl accent-bg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Compact Theme Style Cycle */}
            <button
              onClick={() => {
                const order: ThemeStyle[] = ['obsidian', 'aurora', 'nordic'];
                setThemeStyle(order[(order.indexOf(themeStyle) + 1) % order.length]);
              }}
              title={`Theme: ${themeStyle} (click to cycle)`}
              className="btn-tactile p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] flex items-center gap-1.5 text-xs font-semibold capitalize"
            >
              <Palette className="w-4 h-4 accent-text" />
              <span className="hidden xl:inline">{themeStyle}</span>
            </button>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Light/Dark Mode"
              className="btn-tactile p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileMenuOpen(false);
                }}
                aria-label="Notifications"
                className="btn-tactile relative p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {notifOpen && (
                <div className="animate-surface-enter origin-top-right fixed sm:absolute right-4 sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] surface-card p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.06] dark:border-white/[0.07]">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
                      Notifications ({unreadCount})
                    </span>
                    <button onClick={() => setNotifOpen(false)}>
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">All caught up!</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`btn-tactile w-full text-left p-2.5 rounded-xl text-xs ${
                            n.read
                              ? 'opacity-60 hover:opacity-100'
                              : 'accent-soft-bg font-medium'
                          }`}
                        >
                          <div className="font-semibold">{n.title}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">{n.body}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Profile Pill + Switcher Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileMenuOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="btn-tactile flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${currentMember.avatarColor}28` }}
                >
                  {currentMember.avatarEmoji}
                </span>
                <span className="hidden sm:inline">{currentMember.displayName}</span>
              </button>

              {profileMenuOpen && (
                <div className="animate-surface-enter origin-top-right fixed sm:absolute right-4 sm:right-0 mt-2 w-64 surface-card p-3 z-50 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1.5">
                    Switch Family Member
                  </div>
                  <div className="space-y-1">
                    {state.members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          switchMember(m.id);
                          setProfileMenuOpen(false);
                        }}
                        className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold ${
                          m.id === currentMember.id
                            ? 'accent-soft-bg accent-text'
                            : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{m.avatarEmoji}</span>
                          <span>{m.displayName}</span>
                        </span>
                        <span className="text-[10px] opacity-65 capitalize">{m.role}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.07] flex gap-1.5">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setProfileMenuOpen(false);
                      }}
                      className="btn-tactile flex-1 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <button
                      onClick={logout}
                      className="btn-tactile px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Parent Inspection Banner */}
      {inspectedMember && (
        <div className="accent-bg px-4 sm:px-6 py-2 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                Viewing <strong>{inspectedMember.displayName}&apos;s</strong> workspace (private
                journal entries remain protected).
              </span>
            </div>
            <button
              onClick={() => setInspectingMemberId(null)}
              className="btn-tactile px-2.5 py-1 rounded-lg bg-black/15 hover:bg-black/25 font-semibold text-xs"
            >
              Exit View
            </button>
          </div>
        </div>
      )}

      {/* Breathable Main Canvas */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 lg:pb-10">
        {children}
      </main>

      {/* Mobile Floating Dock */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 h-16 rounded-2xl surface-sidebar border shadow-xl flex justify-around items-center px-2 z-30">
        {PRIMARY_NAV.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`btn-tactile flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold ${
                active ? 'accent-text accent-soft-bg' : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] surface-sidebar border-r h-full p-4 flex flex-col z-10">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
              <span className="font-bold text-sm">{state.family.name}</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 py-3 space-y-1 overflow-y-auto">
              {[...PRIMARY_NAV, { id: 'settings' as NavTab, label: 'Settings', icon: Settings }].map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`btn-tactile w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        activeTab === item.id
                          ? 'accent-soft-bg accent-text font-semibold'
                          : 'text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
