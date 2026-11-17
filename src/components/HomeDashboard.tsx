import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Flame,
  MapPin,
  Plus,
  Repeat,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { MoodType } from '../types';
import { calculateStreak, formatFriendlyDate, formatTime12h, todayISO } from '../utils/dateUtils';

export const HomeDashboard: React.FC = () => {
  const {
    state,
    currentMember,
    inspectingMemberId,
    setActiveTab,
    addTask,
    setTaskStatus,
    toggleHabitDate,
    getVisibleEvents,
    getVisibleJournalEntries,
    saveJournalEntry,
  } = useApp();

  const targetMember =
    (inspectingMemberId && state.members.find((m) => m.id === inspectingMemberId)) ||
    currentMember;

  const isOwnDashboard = targetMember.id === currentMember.id;
  const today = todayISO();

  const myTasks = state.tasks.filter((t) => t.assignedTo.includes(targetMember.id));
  const todayTasks = myTasks.filter((t) => t.dueDate === today);
  const overdueTasks = myTasks.filter((t) => t.dueDate < today && t.status !== 'completed');
  const completedCount = myTasks.filter((t) => t.status === 'completed').length;
  const completionRate = myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0;

  const myGoals = state.goals.filter(
    (g) => g.ownerId === targetMember.id || g.ownerId === 'family'
  );

  const myHabits = state.habits.filter((h) => h.ownerId === targetMember.id);
  const completedHabitsToday = myHabits.filter((h) =>
    state.habitLogs.some((l) => l.habitId === h.id && l.loggedDate === today)
  ).length;

  const bestStreak = myHabits.reduce((max, h) => {
    const dates = new Set(
      state.habitLogs.filter((l) => l.habitId === h.id).map((l) => l.loggedDate)
    );
    return Math.max(max, calculateStreak(dates, today));
  }, 0);

  const upcomingEvents = getVisibleEvents(targetMember)
    .filter((e) => e.eventDate >= today)
    .sort((a, b) => `${a.eventDate}${a.startTime}`.localeCompare(`${b.eventDate}${b.startTime}`))
    .slice(0, 4);

  const todayJournal = getVisibleJournalEntries(currentMember).find(
    (j) => j.authorId === targetMember.id && j.entryDate === today
  );

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickMood, setQuickMood] = useState<MoodType>('good');
  const [quickHighlight, setQuickHighlight] = useState('');
  const [quickSaved, setQuickSaved] = useState(false);

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      description: '',
      assignedTo: [targetMember.id],
      createdBy: currentMember.id,
      dueDate: today,
      priority: 'medium',
      category: 'Personal',
      status: 'not_started',
      recurrence: 'none',
      subtasks: [],
      notes: '',
      attachments: [],
    });
    setQuickTaskTitle('');
  };

  const handleQuickJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHighlight.trim()) return;
    saveJournalEntry({
      id: todayJournal?.id,
      authorId: currentMember.id,
      entryDate: today,
      visibility: todayJournal?.visibility || 'private',
      mood: quickMood,
      energy: todayJournal?.energy || 4,
      content: todayJournal?.content || quickHighlight,
      highlights: quickHighlight,
      learned: todayJournal?.learned || '',
      gratitude: todayJournal?.gratitude || '',
      tomorrowPriorities: todayJournal?.tomorrowPriorities || '',
    });
    setQuickHighlight('');
    setQuickSaved(true);
    setTimeout(() => setQuickSaved(false), 2500);
  };

  const remainingToday = todayTasks.filter((t) => t.status !== 'completed').length;

  // SVG Ring geometry
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completionRate / 100) * ringCircumference;

  return (
    <div className="space-y-8">
      {/* Hero Focus Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: `${targetMember.avatarColor}22` }}
          >
            {targetMember.avatarEmoji}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              {isOwnDashboard
                ? `Welcome back, ${targetMember.displayName}`
                : `${targetMember.displayName}’s Workspace`}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 tabular-nums">
              {remainingToday === 0
                ? 'All caught up for today'
                : `${remainingToday} ${remainingToday === 1 ? 'task' : 'tasks'} remaining`}
              {upcomingEvents.length > 0 ? ` · ${upcomingEvents.length} upcoming events` : ''}
            </p>
          </div>
        </div>

        {/* Geometric SVG Ring + Streak Pill */}
        <div className="flex items-center gap-4 surface-card px-4 py-3 self-start sm:self-auto">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-black/[0.06] dark:text-white/[0.08]"
              />
              <circle
                cx="30"
                cy="30"
                r={ringRadius}
                fill="none"
                stroke={targetMember.avatarColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xs font-extrabold tabular-nums">
              {completionRate}%
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold tabular-nums">
              {completedCount}/{myTasks.length} Tasks
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                <Flame className="w-3.5 h-3.5" /> {bestStreak}d streak
              </span>
              <span>·</span>
              <span>
                {completedHabitsToday}/{myHabits.length} habits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric 62% / 38% Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Agenda */}
          <section className="surface-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">Today’s Agenda</h2>
              <button
                onClick={() => setActiveTab('tasks')}
                className="btn-tactile text-xs font-semibold accent-text hover:underline underline-offset-4 flex items-center gap-1"
              >
                Open Board <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Command Quick-Capture */}
            <form onSubmit={handleQuickAddTask} className="flex gap-2">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Add a task for today..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.02] dark:bg-white/[0.03] text-sm"
              />
              <button
                type="submit"
                className="btn-tactile px-4 py-2.5 rounded-xl accent-bg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            {overdueTasks.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  Overdue ({overdueTasks.length})
                </div>
                {overdueTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setTaskStatus(t.id, 'completed')}
                      className="btn-tactile flex items-center gap-2.5 text-left"
                    >
                      <span className="w-5 h-5 rounded-full border-2 border-rose-400 shrink-0 hover:bg-rose-500 transition" />
                      <span className="font-semibold">{t.title}</span>
                    </button>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                      {formatFriendlyDate(t.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {todayTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Your today list is clear. Add a task above to get started.
                </div>
              ) : (
                todayTasks.map((task) => {
                  const done = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between py-3 first:pt-1 last:pb-1 gap-3"
                    >
                      <button
                        onClick={() =>
                          setTaskStatus(task.id, done ? 'not_started' : 'completed')
                        }
                        className="btn-tactile flex items-center gap-3.5 text-left min-w-0 flex-1"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition ${
                            done
                              ? 'accent-bg animate-check-pop'
                              : 'border-2 border-slate-300 dark:border-zinc-600'
                          }`}
                        >
                          {done && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold truncate ${
                              done ? 'line-through opacity-45' : ''
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 tabular-nums">
                            <span>{task.category}</span>
                            {task.dueTime && <span>· {formatTime12h(task.dueTime)}</span>}
                            {task.recurrence !== 'none' && (
                              <span className="inline-flex items-center gap-1 capitalize accent-text">
                                · <Repeat className="w-3 h-3" /> {task.recurrence}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                            : task.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                            : 'bg-black/[0.05] dark:bg-white/[0.07] text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* 1-Tap Habit Strip */}
          <section className="surface-card p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Daily Habits
              </h2>
              <button
                onClick={() => setActiveTab('goals')}
                className="btn-tactile text-xs font-semibold accent-text hover:underline underline-offset-4 flex items-center gap-1"
              >
                Full Tracker <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {myHabits.length === 0 ? (
                <p className="text-sm text-slate-500">No habits configured yet.</p>
              ) : (
                myHabits.map((h) => {
                  const logs = new Set(
                    state.habitLogs.filter((l) => l.habitId === h.id).map((l) => l.loggedDate)
                  );
                  const doneToday = logs.has(today);
                  const streak = calculateStreak(logs, today);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHabitDate(h.id, today, targetMember.id)}
                      className={`btn-tactile px-3.5 py-2.5 rounded-2xl border text-left flex items-center gap-2.5 ${
                        doneToday
                          ? 'accent-soft-bg border-current accent-text'
                          : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <div>
                        <div className="text-xs font-bold">{h.title}</div>
                        <div className="text-[10px] opacity-75 tabular-nums">
                          {streak}d streak {doneToday ? '· Done' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Secondary Column (5 cols) — Timeline, Check-In, Goals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vertical Time-Blocked Schedule */}
          <section className="surface-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 accent-text" />
                Timeline
              </h2>
              <button
                onClick={() => setActiveTab('calendar')}
                className="btn-tactile text-xs font-semibold accent-text hover:underline underline-offset-4"
              >
                Calendar →
              </button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming events.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div key={evt.id} className="flex gap-3 items-start">
                    <div className="w-16 shrink-0 pt-0.5 text-right">
                      <div className="text-[11px] font-bold tabular-nums">
                        {formatTime12h(evt.startTime)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatFriendlyDate(evt.eventDate)}
                      </div>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-black/[0.025] dark:bg-white/[0.035] border border-black/[0.05] dark:border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">{evt.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full accent-soft-bg accent-text shrink-0">
                          {evt.isFamilyWide ? 'Family' : 'Personal'}
                        </span>
                      </div>
                      {evt.location && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 2-Minute Daily Check-In */}
          {isOwnDashboard && (
            <section className="surface-card p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                  <BookOpen className="w-4 h-4 accent-text" />
                  Daily Check-In
                </h2>
                <button
                  onClick={() => setActiveTab('journal')}
                  className="btn-tactile text-xs font-semibold accent-text hover:underline underline-offset-4"
                >
                  Full Journal →
                </button>
              </div>
              <form onSubmit={handleQuickJournal} className="space-y-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'amazing', label: '😄 Great' },
                      { id: 'good', label: '🙂 Good' },
                      { id: 'okay', label: '😐 Okay' },
                      { id: 'tired', label: '😴 Tired' },
                    ] as { id: MoodType; label: string }[]
                  ).map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setQuickMood(m.id)}
                      className={`btn-tactile px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        quickMood === m.id
                          ? 'accent-soft-bg accent-text border-current'
                          : 'border-black/[0.08] dark:border-white/[0.08] opacity-70 hover:opacity-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickHighlight}
                    onChange={(e) => setQuickHighlight(e.target.value)}
                    placeholder="One highlight or gratitude note..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.02] dark:bg-white/[0.03] text-sm"
                  />
                  <button
                    type="submit"
                    className="btn-tactile px-4 py-2 rounded-xl accent-bg text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
                {quickSaved && (
                  <p className="text-xs accent-text font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Saved privately to your journal.
                  </p>
                )}
              </form>
            </section>
          )}

          {/* Active Goals */}
          <section className="surface-card p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                Goals
              </h2>
              <button
                onClick={() => setActiveTab('goals')}
                className="btn-tactile text-xs font-semibold accent-text hover:underline underline-offset-4"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-3">
              {myGoals.length === 0 ? (
                <p className="text-sm text-slate-500">No active goals yet.</p>
              ) : (
                myGoals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold truncate pr-2">{g.title}</span>
                        <span className="text-slate-500 dark:text-zinc-400 shrink-0 tabular-nums">
                          {g.currentValue}/{g.targetValue} {g.unit}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full accent-bg transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="btn-tactile w-full pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 accent-text" /> View Weekly Progress Report
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
