import React, { useState } from 'react';
import { Award, BarChart3, CheckCircle2, Flame, Sparkles, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addDaysISO, calculateStreak, todayISO } from '../utils/dateUtils';

export const ReportsView: React.FC = () => {
  const { state, currentMember, getVisibleEvents } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const today = todayISO();

  const startDate =
    period === 'daily'
      ? today
      : period === 'weekly'
      ? addDaysISO(today, -7)
      : addDaysISO(today, -30);

  const scopeTasks =
    currentMember.role === 'parent'
      ? state.tasks
      : state.tasks.filter((t) => t.assignedTo.includes(currentMember.id));

  const periodTasks = scopeTasks.filter(
    (t) => t.dueDate >= startDate && t.dueDate <= addDaysISO(today, 7)
  );
  const completedTasks = periodTasks.filter((t) => t.status === 'completed');
  const pendingTasks = periodTasks.filter((t) => t.status !== 'completed');
  const completionRate = periodTasks.length
    ? Math.round((completedTasks.length / periodTasks.length) * 100)
    : 0;

  const myHabits = state.habits.filter((h) => h.ownerId === currentMember.id);
  const bestStreak = myHabits.reduce((max, h) => {
    const dates = new Set(
      state.habitLogs.filter((l) => l.habitId === h.id).map((l) => l.loggedDate)
    );
    return Math.max(max, calculateStreak(dates, today));
  }, 0);

  const completedGoals = state.goals.filter(
    (g) =>
      (g.ownerId === currentMember.id ||
        g.ownerId === 'family' ||
        currentMember.role === 'parent') &&
      g.status === 'completed'
  );

  const todayEvents = getVisibleEvents(currentMember).filter((e) => e.eventDate === today);

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 accent-text" />
            Progress & Positive Insights
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Celebrating consistency, completed milestones, and collaborative family effort.
          </p>
        </div>
        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`btn-tactile px-3.5 py-1.5 rounded-md text-xs font-semibold capitalize ${
                period === p
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-stone-200/80 dark:border-zinc-700'
                  : 'text-slate-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-medium">Completion Rate</div>
          <div className="text-3xl font-extrabold accent-text mt-1 tabular-nums">
            {completionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {completedTasks.length} completed · {pendingTasks.length} remaining
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-medium">Best Habit Streak</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1 flex items-center gap-1.5 tabular-nums">
            <Flame className="w-6 h-6" /> {bestStreak}d
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {myHabits.length} tracked habits
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-medium">Goals Achieved</div>
          <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5 tabular-nums">
            <Target className="w-6 h-6" /> {completedGoals.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {state.goals.filter((g) => g.status === 'active').length} active in progress
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-medium">Today&apos;s Events</div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {todayEvents.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Coordinated on family calendar</div>
        </div>
      </div>

      {/* Member Breakdown & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-base">Member Contribution Summary</h3>
          <div className="space-y-3.5">
            {state.members.map((m) => {
              const mTasks = state.tasks.filter((t) => t.assignedTo.includes(m.id));
              const mDone = mTasks.filter((t) => t.status === 'completed').length;
              const pct = mTasks.length ? Math.round((mDone / mTasks.length) * 100) : 0;
              return (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: m.avatarColor }}
                      />
                      {m.displayName}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {mDone}/{mTasks.length} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: m.avatarColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Positive Milestones & Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-stone-200/80 dark:border-zinc-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 accent-text shrink-0" />
              <div>
                <div className="text-xs font-bold">Consistency Builder</div>
                <div className="text-[11px] text-slate-500">Logged habits multiple days in a row</div>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-stone-200/80 dark:border-zinc-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold">Team Player</div>
                <div className="text-[11px] text-slate-500">Completed shared family tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
