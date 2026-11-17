import React, { useState } from 'react';
import { Award, Check, Flame, Plus, Target, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { GoalScope } from '../types';
import { addDaysISO, calculateStreak, todayISO } from '../utils/dateUtils';

export const GoalsHabitsView: React.FC = () => {
  const {
    state,
    currentMember,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    addHabit,
    toggleHabitDate,
    deleteHabit,
  } = useApp();

  const [goalScopeFilter, setGoalScopeFilter] = useState<'all' | GoalScope>('all');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalScope, setGoalScope] = useState<GoalScope>('weekly');
  const [goalTarget, setGoalTarget] = useState(5);
  const [goalUnit, setGoalUnit] = useState('days');
  const [showGoalForm, setShowGoalForm] = useState(false);

  const [habitTitle, setHabitTitle] = useState('');
  const [showHabitForm, setShowHabitForm] = useState(false);

  const today = todayISO();
  const last7Days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i - 6));

  const visibleGoals = state.goals
    .filter((g) => g.ownerId === currentMember.id || g.ownerId === 'family')
    .filter((g) => (goalScopeFilter === 'all' ? true : g.scope === goalScopeFilter));

  const myHabits = state.habits.filter((h) => h.ownerId === currentMember.id);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    addGoal({
      ownerId: goalScope === 'family' ? 'family' : currentMember.id,
      scope: goalScope,
      title: goalTitle.trim(),
      description: '',
      targetValue: Math.max(1, goalTarget),
      currentValue: 0,
      unit: goalUnit || 'units',
      dueDate: addDaysISO(today, goalScope === 'daily' ? 1 : goalScope === 'weekly' ? 7 : 30),
      status: 'active',
    });
    setGoalTitle('');
    setShowGoalForm(false);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    addHabit({
      ownerId: currentMember.id,
      title: habitTitle.trim(),
      icon: '✓',
      color: currentMember.avatarColor,
      targetFrequency: 'daily',
      targetCount: 1,
    });
    setHabitTitle('');
    setShowHabitForm(false);
  };

  return (
    <div className="space-y-8">
      {/* GOALS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-4 h-4 accent-text" />
              Personal & Family Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Track daily targets, weekly objectives, monthly milestones, and shared family goals.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={goalScopeFilter}
              onChange={(e) => setGoalScopeFilter(e.target.value as typeof goalScopeFilter)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161920] text-xs font-medium"
            >
              <option value="all">All Scopes</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="family">Family Goals</option>
            </select>
            <button
              onClick={() => setShowGoalForm((s) => !s)}
              className="btn-tactile px-3.5 py-2 rounded-lg accent-bg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>
        </div>

        {showGoalForm && (
          <form
            onSubmit={handleAddGoal}
            className="animate-surface-enter bg-white dark:bg-[#161920] border border-teal-300 dark:border-teal-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Goal Title</label>
              <input
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Read 4 books this month"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Scope</label>
              <select
                value={goalScope}
                onChange={(e) => setGoalScope(e.target.value as GoalScope)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                {currentMember.role === 'parent' && <option value="family">Family-Wide</option>}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1">Target</label>
                <input
                  type="number"
                  min={1}
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1">Unit</label>
                <input
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-tactile py-2 px-4 rounded-lg accent-bg text-xs font-semibold"
            >
              Add Goal
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGoals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const done = g.status === 'completed';
            return (
              <div
                key={g.id}
                className="surface-card rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#F4F2ED] dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                        {g.scope === 'family' ? 'Family' : g.scope}
                      </span>
                      {done && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Achieved
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm mt-2">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                    <span>
                      {g.currentValue} / {g.targetValue} {g.unit}
                    </span>
                    <span className="font-semibold accent-text">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full accent-bg transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => updateGoalProgress(g.id, g.currentValue - 1)}
                    className="btn-tactile px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold tabular-nums"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => updateGoalProgress(g.id, g.currentValue + 1)}
                    className="btn-tactile px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tabular-nums"
                  >
                    +1 {g.unit}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HABITS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              Habit Tracker & Streaks
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Tap any day in the 7-day grid to log consistency and build streaks.
            </p>
          </div>
          <button
            onClick={() => setShowHabitForm((s) => !s)}
            className="btn-tactile px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>

        {showHabitForm && (
          <form
            onSubmit={handleAddHabit}
            className="animate-surface-enter bg-white dark:bg-[#161920] border border-stone-300 dark:border-zinc-700 rounded-xl p-4 flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-semibold mb-1">Habit Name</label>
              <input
                required
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                placeholder="e.g., Read for 20 minutes"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
            <button
              type="submit"
              className="btn-tactile py-2 px-4 rounded-lg accent-bg text-xs font-semibold"
            >
              Add Habit
            </button>
          </form>
        )}

        <div className="surface-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] uppercase text-slate-400">
                  <th className="p-4">Habit</th>
                  <th className="p-4 text-center">Streak</th>
                  {last7Days.map((d) => (
                    <th key={d} className="p-2 text-center tabular-nums">
                      <div>
                        {new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </div>
                      <div className="text-[10px] font-normal">{d.slice(-2)}</div>
                    </th>
                  ))}
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                {myHabits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-sm text-slate-500">
                      No habits yet. Create one to start your streak.
                    </td>
                  </tr>
                ) : (
                  myHabits.map((h) => {
                    const loggedSet = new Set(
                      state.habitLogs.filter((l) => l.habitId === h.id).map((l) => l.loggedDate)
                    );
                    const streak = calculateStreak(loggedSet, today);
                    return (
                      <tr key={h.id} className="hover:bg-[#FAF9F6] dark:hover:bg-zinc-900/40">
                        <td className="p-4">
                          <span className="text-sm font-semibold">{h.title}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold tabular-nums">
                            <Flame className="w-3 h-3" /> {streak}d
                          </span>
                        </td>
                        {last7Days.map((d) => {
                          const done = loggedSet.has(d);
                          return (
                            <td key={d} className="p-2 text-center">
                              <button
                                onClick={() => toggleHabitDate(h.id, d, currentMember.id)}
                                className={`btn-tactile w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${
                                  done
                                    ? 'accent-bg text-white'
                                    : 'bg-[#F4F2ED] dark:bg-zinc-800 text-stone-300 dark:text-zinc-600 hover:bg-stone-200 dark:hover:bg-zinc-700'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteHabit(h.id)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
