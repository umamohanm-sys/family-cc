import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Edit3,
  Kanban,
  List,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type {
  RecurrenceType,
  Subtask,
  TaskCategory,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../types';
import { formatFriendlyDate, formatTime12h, getMonthDays, todayISO } from '../utils/dateUtils';

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

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export const TasksView: React.FC = () => {
  const {
    state,
    currentMember,
    addTask,
    updateTask,
    setTaskStatus,
    toggleSubtask,
    deleteTask,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [scope, setScope] = useState<'mine' | 'family'>('mine');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([currentMember.id]);
  const [dueDate, setDueDate] = useState(todayISO());
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const today = todayISO();
  const canAssignOthers =
    currentMember.role === 'parent' || currentMember.permissions.canAssignTasks;

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setAssignedTo([currentMember.id]);
    setDueDate(today);
    setDueTime('');
    setPriority('medium');
    setCategory('Personal');
    setRecurrence('none');
    setNotes('');
    setSubtasks([]);
    setModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assignedTo);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '');
    setPriority(task.priority);
    setCategory(task.category);
    setRecurrence(task.recurrence);
    setNotes(task.notes);
    setSubtasks(task.subtasks);
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo.length ? assignedTo : [currentMember.id],
      createdBy: editingTask?.createdBy || currentMember.id,
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      category,
      status: editingTask?.status || ('not_started' as TaskStatus),
      recurrence,
      subtasks,
      notes: notes.trim(),
      attachments: editingTask?.attachments || [],
    };
    if (editingTask) updateTask(editingTask.id, payload);
    else addTask(payload);
    setModalOpen(false);
  };

  const filteredTasks = useMemo(() => {
    return state.tasks
      .filter((t) => (scope === 'mine' ? t.assignedTo.includes(currentMember.id) : true))
      .filter((t) => {
        if (periodFilter === 'today') return t.dueDate === today;
        if (periodFilter === 'upcoming') return t.dueDate > today && t.status !== 'completed';
        if (periodFilter === 'overdue') return t.dueDate < today && t.status !== 'completed';
        if (periodFilter === 'completed') return t.status === 'completed';
        return true;
      })
      .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
      .filter((t) => (priorityFilter === 'all' ? true : t.priority === priorityFilter));
  }, [state.tasks, scope, currentMember.id, periodFilter, today, categoryFilter, priorityFilter]);

  const nowDate = new Date();
  const monthCells = getMonthDays(nowDate.getFullYear(), nowDate.getMonth());

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="surface-card rounded-2xl p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
            {[
              { id: 'list', label: 'List', icon: List },
              { id: 'kanban', label: 'Kanban', icon: Kanban },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id as typeof viewMode)}
                  className={`btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                    viewMode === v.id
                      ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-stone-200/80 dark:border-zinc-700'
                      : 'text-stone-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {canAssignOthers && (
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
              <button
                onClick={() => setScope('mine')}
                className={`btn-tactile px-3 py-1.5 rounded-md text-xs font-semibold ${
                  scope === 'mine'
                    ? 'bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700'
                    : 'text-slate-500'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setScope('family')}
                className={`btn-tactile px-3 py-1.5 rounded-md text-xs font-semibold ${
                  scope === 'family'
                    ? 'bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700'
                    : 'text-slate-500'
                }`}
              >
                All Family
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as typeof periodFilter)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs font-medium"
          >
            <option value="all">All Periods</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs font-medium"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs font-medium"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="btn-tactile px-3.5 py-2 rounded-lg accent-bg text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="surface-card rounded-2xl divide-y divide-slate-100 dark:divide-white/[0.06]">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No tasks match your current filters. Try clearing a filter or creating a new task.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const done = task.status === 'completed';
              const overdue = task.dueDate < today && !done;
              const assignees = state.members.filter((m) => task.assignedTo.includes(m.id));
              return (
                <div key={task.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() =>
                          setTaskStatus(task.id, done ? 'not_started' : 'completed')
                        }
                        className="btn-tactile mt-0.5 shrink-0"
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-300 dark:text-zinc-600 hover:text-teal-600" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              done ? 'line-through text-slate-400 dark:text-zinc-500' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-indigo-700 dark:text-indigo-300">
                            {task.category}
                          </span>
                          {task.recurrence !== 'none' && (
                            <span className="text-[10px] inline-flex items-center gap-1 text-slate-500 font-medium capitalize">
                              <Repeat className="w-3 h-3" /> {task.recurrence}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-[65ch]">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                          <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                            Due: {formatFriendlyDate(task.dueDate)}
                            {task.dueTime ? ` at ${formatTime12h(task.dueTime)}` : ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {assignees.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4F2ED] dark:bg-zinc-800 text-[10px] font-medium"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: a.avatarColor }}
                                />
                                {a.displayName}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04]"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => openEditModal(task)}
                        aria-label="Edit task"
                        className="btn-tactile p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-stone-100 dark:hover:bg-zinc-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        aria-label="Delete task"
                        className="btn-tactile p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {task.subtasks.length > 0 && (
                    <div className="pl-8 pt-2 border-t border-stone-100 dark:border-zinc-800/70 space-y-1.5">
                      {task.subtasks.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => toggleSubtask(task.id, st.id)}
                          className="btn-tactile flex items-center gap-2 text-xs text-left w-full hover:text-teal-700 dark:hover:text-teal-400"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-stone-300 dark:text-zinc-600 shrink-0" />
                          )}
                          <span className={st.completed ? 'line-through text-slate-400' : ''}>
                            {st.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { id: 'not_started', title: 'Not Started', dot: 'bg-stone-400' },
              { id: 'in_progress', title: 'In Progress', dot: 'bg-amber-500' },
              { id: 'completed', title: 'Completed', dot: 'accent-bg' },
            ] as { id: TaskStatus; title: string; dot: string }[]
          ).map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#F4F2ED] dark:bg-[#12141A] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    {col.title}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-[#161920] border border-slate-200/80 dark:border-white/10 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold">{t.title}</span>
                        <button
                          onClick={() => openEditModal(t)}
                          className="text-slate-400 hover:text-teal-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>{formatFriendlyDate(t.dueDate)}</span>
                        <span className="uppercase font-semibold">{t.priority}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        {col.id !== 'not_started' && (
                          <button
                            onClick={() => setTaskStatus(t.id, 'not_started')}
                            className="btn-tactile text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800"
                          >
                            Todo
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button
                            onClick={() => setTaskStatus(t.id, 'in_progress')}
                            className="btn-tactile text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          >
                            In Progress
                          </button>
                        )}
                        {col.id !== 'completed' && (
                          <button
                            onClick={() => setTaskStatus(t.id, 'completed')}
                            className="btn-tactile text-[10px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-indigo-700 dark:text-indigo-300"
                          >
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="surface-card rounded-2xl p-4">
          <div className="text-sm font-bold mb-3">
            {nowDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Tasks
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((cell, idx) => {
              if (!cell)
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-20 rounded-lg bg-slate-50 dark:bg-white/[0.04]/40"
                  />
                );
              const dayTasks = filteredTasks.filter((t) => t.dueDate === cell);
              const isToday = cell === today;
              return (
                <div
                  key={cell}
                  className={`min-h-20 p-1.5 rounded-lg border text-left ${
                    isToday
                      ? 'border-indigo-500 bg-teal-50/40 dark:bg-teal-950/20'
                      : 'border-stone-100 dark:border-zinc-800'
                  }`}
                >
                  <div className="text-[11px] font-bold tabular-nums">{Number(cell.slice(-2))}</div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 line-through dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-stone-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-surface-enter surface-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Task Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete science worksheet"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {canAssignOthers && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Assign To</label>
                  <div className="flex flex-wrap gap-1.5">
                    {state.members.map((m) => {
                      const selected = assignedTo.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() =>
                            setAssignedTo((prev) =>
                              selected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            )
                          }
                          className={`btn-tactile px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                            selected
                              ? 'bg-teal-700 text-white border-teal-700'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: selected ? '#fff' : m.avatarColor }}
                          />
                          {m.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Subtasks / Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSubtask.trim()) return;
                      setSubtasks((prev) => [
                        ...prev,
                        { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false },
                      ]);
                      setNewSubtask('');
                    }}
                    className="btn-tactile px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04]"
                    >
                      <span>{st.title}</span>
                      <button
                        type="button"
                        onClick={() => setSubtasks((prev) => prev.filter((s) => s.id !== st.id))}
                        className="text-rose-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-tactile px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-5 py-2 rounded-lg accent-bg text-xs font-semibold"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
