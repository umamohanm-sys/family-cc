import React, { useRef, useState } from 'react';
import { Bell, Database, Download, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { NotificationPreferences } from '../types';

export const SettingsView: React.FC = () => {
  const {
    state,
    currentMember,
    updateNotificationPrefs,
    exportBackupJSON,
    restoreBackupJSON,
    resetDemoData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const prefs: NotificationPreferences = state.notificationPrefs[currentMember.id] || {
    taskReminders: true,
    overdueAlerts: true,
    eventReminders: true,
    dailyPlanning: true,
    journalReminders: true,
    weeklySummary: true,
    parentCompletionAlerts: true,
    pushEnabled: false,
  };

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      setStatusMsg('Browser notifications are not supported on this device.');
      return;
    }
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      updateNotificationPrefs({ pushEnabled: true });
      new Notification('Family Command Center', {
        body: 'Push notifications are now enabled for your device!',
      });
      setStatusMsg('Push notifications enabled.');
    } else {
      setStatusMsg('Notification permission was denied.');
    }
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-command-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = restoreBackupJSON(String(reader.result || ''));
      setStatusMsg(ok ? 'Backup restored successfully.' : 'Invalid backup file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {statusMsg && (
        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      <section className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 accent-text" />
              Notifications & Reminders
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure reminders for {currentMember.displayName}.
            </p>
          </div>
          <button
            onClick={handleEnablePush}
            className="btn-tactile px-3.5 py-2 rounded-lg accent-bg text-xs font-semibold shrink-0"
          >
            {prefs.pushEnabled ? 'Push Enabled' : 'Enable Browser Push'}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {(
            [
              { key: 'taskReminders', label: 'Upcoming task reminders' },
              { key: 'overdueAlerts', label: 'Overdue task alerts' },
              { key: 'eventReminders', label: 'Calendar event reminders' },
              { key: 'dailyPlanning', label: 'Morning daily planning reminder' },
              { key: 'journalReminders', label: 'Evening journal reflection reminder' },
              { key: 'weeklySummary', label: 'Weekly progress summary' },
              ...(currentMember.role === 'parent'
                ? [
                    {
                      key: 'parentCompletionAlerts',
                      label: 'Notify when family members complete key tasks',
                    },
                  ]
                : []),
            ] as { key: keyof NotificationPreferences; label: string }[]
          ).map((item) => (
            <label
              key={item.key}
              className="py-3 flex items-center justify-between cursor-pointer text-sm"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(prefs[item.key])}
                onChange={(e) => updateNotificationPrefs({ [item.key]: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Supabase Cloud Sync & Auth
        </h2>
        <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed max-w-[65ch]">
          Status:{' '}
          <strong className={isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'}>
            {isSupabaseConfigured
              ? 'Connected to Supabase'
              : 'Local Offline & Multi-Tab Sync Mode'}
          </strong>
          . To connect your live Supabase project, copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, and run <code>supabase/schema.sql</code> in the
          Supabase SQL Editor.
        </p>
      </section>

      <section className="surface-card rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Database className="w-4 h-4 accent-text" />
          Backup, Recovery & Demo Reset
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadBackup}
            className="btn-tactile px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export JSON Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-tactile px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Restore from Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleRestore}
            className="hidden"
          />
          <button
            onClick={() => {
              resetDemoData();
              setStatusMsg('Sample family data restored.');
            }}
            className="btn-tactile px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Reset Sample Data
          </button>
        </div>
      </section>
    </div>
  );
};
