import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { MemberRole, TaskCategory } from '../types';
import { formatFriendlyDate, formatRelativeTime, todayISO } from '../utils/dateUtils';

const CATEGORIES: TaskCategory[] = [
  'Chores',
  'Homework',
  'Reading',
  'Exercise',
  'Health',
  'Errands',
  'Personal',
  'Family',
];

export const FamilyView: React.FC = () => {
  const {
    state,
    currentMember,
    setActiveTab,
    setInspectingMemberId,
    createInvitation,
    updateMemberRoleAndPerms,
  } = useApp();

  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<MemberRole>('member');
  const [invAge, setInvAge] = useState<'adult' | 'teen' | 'child'>('child');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const today = todayISO();
  const isParent = currentMember.role === 'parent';

  const filteredTasks = useMemo(() => {
    return state.tasks
      .filter((t) => (memberFilter === 'all' ? true : t.assignedTo.includes(memberFilter)))
      .filter((t) => {
        if (statusFilter === 'completed') return t.status === 'completed';
        if (statusFilter === 'pending') return t.status !== 'completed';
        if (statusFilter === 'overdue') return t.dueDate < today && t.status !== 'completed';
        return true;
      })
      .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter));
  }, [state.tasks, memberFilter, statusFilter, categoryFilter, today]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim() || !invEmail.trim()) return;
    createInvitation(invEmail.trim(), invName.trim(), invRole, invAge);
    setInvName('');
    setInvEmail('');
    setInviteOpen(false);
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const completedTodayCount = state.tasks.filter(
    (t) => t.dueDate === today && t.status === 'completed'
  ).length;
  const pendingCount = state.tasks.filter((t) => t.status !== 'completed').length;
  const overdueCount = state.tasks.filter(
    (t) => t.dueDate < today && t.status !== 'completed'
  ).length;

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 accent-text" />
            {state.family.name} — Command Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 tabular-nums">
            {completedTodayCount} completed today · {pendingCount} pending · {overdueCount} overdue
          </p>
        </div>
        {(isParent || currentMember.permissions.canInvite) && (
          <button
            onClick={() => setInviteOpen(true)}
            className="btn-tactile px-4 py-2 rounded-lg accent-bg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.members.map((m) => {
          const mTasks = state.tasks.filter((t) => t.assignedTo.includes(m.id));
          const mDone = mTasks.filter((t) => t.status === 'completed').length;
          const mOverdue = mTasks.filter((t) => t.dueDate < today && t.status !== 'completed').length;
          const pct = mTasks.length ? Math.round((mDone / mTasks.length) * 100) : 0;
          const mGoals = state.goals.filter((g) => g.ownerId === m.id);

          return (
            <div
              key={m.id}
              className="surface-card rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{m.displayName}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {m.role} · {m.ageGroup}
                    </div>
                  </div>
                </div>
                {isParent && m.id !== currentMember.id && (
                  <button
                    onClick={() =>
                      updateMemberRoleAndPerms(m.id, m.role, {
                        ...m.permissions,
                        canAssignTasks: !m.permissions.canAssignTasks,
                      })
                    }
                    title="Toggle task-assign permission"
                    className={`btn-tactile p-1.5 rounded-lg text-xs ${
                      m.permissions.canAssignTasks
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                        : 'text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Task Progress</span>
                  <span className="font-bold tabular-nums">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: m.avatarColor }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 tabular-nums">
                  <span>
                    {mDone}/{mTasks.length} tasks
                  </span>
                  {mOverdue > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {mOverdue} overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 tabular-nums">
                Goals: {mGoals.length} active
              </div>

              {isParent && (
                <button
                  onClick={() => {
                    setInspectingMemberId(m.id);
                    setActiveTab('home');
                  }}
                  className="btn-tactile w-full py-2 rounded-lg bg-[#F4F2ED] dark:bg-zinc-800 hover:bg-stone-200/80 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Dashboard
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Filter className="w-4 h-4 accent-text" />
              Family Responsibilities & Tasks
            </h3>
            <div className="flex flex-wrap gap-2">
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
              >
                <option value="all">All Members</option>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No matching tasks.</p>
            ) : (
              filteredTasks.map((t) => {
                const assignees = state.members.filter((m) => t.assignedTo.includes(m.id));
                const overdue = t.dueDate < today && t.status !== 'completed';
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            t.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {t.title}
                        </span>
                        {overdue && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {assignees.map((a) => a.displayName).join(', ')} · {t.category} ·{' '}
                        {formatFriendlyDate(t.dueDate)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        t.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : t.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 accent-text" />
              Family Activity Feed
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {state.activityFeed.slice(0, 15).map((act) => {
                const actor = state.members.find((m) => m.id === act.actorId);
                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: actor?.avatarColor || '#0F766E' }}
                    >
                      {actor?.displayName.slice(0, 2).toUpperCase() || 'FC'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-stone-700 dark:text-zinc-200 font-medium">
                        {act.summary}
                      </p>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {state.invitations.length > 0 && (
            <div className="surface-card rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm">Pending Invitations</h3>
              {state.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-stone-200/70 dark:border-zinc-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {inv.displayName} ({inv.role})
                    </span>
                    <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{inv.email}</div>
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => copyInviteLink(inv.token)}
                      className="inline-flex items-center gap-1 accent-text font-semibold hover:underline"
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied Invite Link
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Invite Link (Code: {inv.token})
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-surface-enter surface-card rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Invite Family Member</h3>
              <button onClick={() => setInviteOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-3.5">
              <input
                required
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
                placeholder="Member Name (e.g., Grandma Sofia)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
              <input
                type="email"
                required
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={invRole}
                  onChange={(e) => setInvRole(e.target.value as MemberRole)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                >
                  <option value="member">Family Member</option>
                  <option value="parent">Parent (Admin)</option>
                </select>
                <select
                  value={invAge}
                  onChange={(e) => setInvAge(e.target.value as typeof invAge)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                >
                  <option value="child">Child</option>
                  <option value="teen">Teen</option>
                  <option value="adult">Adult</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="btn-tactile px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-5 py-2 rounded-lg accent-bg text-xs font-semibold"
                >
                  Generate Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
