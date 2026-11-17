import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CalendarEvent } from '../types';
import {
  formatFriendlyDate,
  formatTime12h,
  getMonthDays,
  getWeekDates,
  todayISO,
} from '../utils/dateUtils';

const EVENT_CATEGORIES: CalendarEvent['category'][] = [
  'Family',
  'School',
  'Sports',
  'Music',
  'Medical',
  'Outing',
  'Birthday',
  'Deadline',
];

export const CalendarView: React.FC = () => {
  const { state, currentMember, getVisibleEvents, addEvent, deleteEvent } = useApp();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [scopeFilter, setScopeFilter] = useState<'all' | 'family' | 'personal'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isFamilyWide, setIsFamilyWide] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([currentMember.id]);
  const [category, setCategory] = useState<CalendarEvent['category']>('Family');
  const [recurrence, setRecurrence] = useState<CalendarEvent['recurrence']>('none');

  const today = todayISO();
  const visibleEvents = useMemo(() => {
    return getVisibleEvents(currentMember)
      .filter((e) => {
        if (scopeFilter === 'family') return e.isFamilyWide;
        if (scopeFilter === 'personal') return !e.isFamilyWide;
        return true;
      })
      .sort((a, b) => `${a.eventDate}${a.startTime}`.localeCompare(`${b.eventDate}${b.startTime}`));
  }, [getVisibleEvents, currentMember, scopeFilter]);

  const anchorDate = new Date(selectedDate + 'T12:00:00');
  const monthCells = getMonthDays(anchorDate.getFullYear(), anchorDate.getMonth());
  const weekDates = getWeekDates(selectedDate);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addEvent({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      eventDate,
      startTime,
      durationMinutes,
      isFamilyWide,
      assignedMembers: isFamilyWide
        ? state.members.map((m) => m.id)
        : assignedMembers.length
        ? assignedMembers
        : [currentMember.id],
      category,
      recurrence,
      reminderMinutes: 30,
      createdBy: currentMember.id,
    });
    setTitle('');
    setDescription('');
    setLocation('');
    setModalOpen(false);
  };

  const selectedDayEvents = visibleEvents.filter((e) => e.eventDate === selectedDate);

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
            {(['month', 'week', 'day'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`btn-tactile px-3 py-1.5 rounded-md text-xs font-semibold capitalize ${
                  viewMode === m
                    ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-stone-200/80 dark:border-zinc-700'
                    : 'text-slate-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'family', label: 'Family-Wide' },
              { id: 'personal', label: 'Personal' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setScopeFilter(s.id as typeof scopeFilter)}
                className={`btn-tactile px-2.5 py-1.5 rounded-md text-xs font-semibold ${
                  scopeFilter === s.id
                    ? 'bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs tabular-nums"
          />
          <button
            onClick={() => {
              setEventDate(selectedDate);
              setModalOpen(true);
            }}
            className="btn-tactile px-3.5 py-2 rounded-lg accent-bg text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 surface-card rounded-2xl p-4">
            <div className="text-sm font-bold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 accent-text" />
              {anchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                      key={`e-${idx}`}
                      className="h-20 rounded-lg bg-slate-50 dark:bg-white/[0.04]/40"
                    />
                  );
                const dayEvts = visibleEvents.filter((e) => e.eventDate === cell);
                const isSelected = cell === selectedDate;
                const isToday = cell === today;
                return (
                  <button
                    key={cell}
                    onClick={() => setSelectedDate(cell)}
                    className={`btn-tactile min-h-20 p-1.5 rounded-lg border text-left flex flex-col ${
                      isSelected
                        ? 'border-indigo-500 bg-teal-50/50 dark:bg-teal-950/30'
                        : isToday
                        ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-stone-100 dark:border-zinc-800 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold tabular-nums">
                      {Number(cell.slice(-2))}
                    </span>
                    <div className="mt-1 space-y-0.5 w-full">
                      {dayEvts.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            e.isFamilyWide
                              ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300'
                              : 'bg-stone-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvts.length > 2 && (
                        <div className="text-[9px] text-slate-400 tabular-nums">
                          +{dayEvts.length - 2}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda */}
          <div className="surface-card rounded-2xl p-4 space-y-3">
            <div className="font-bold text-sm">Agenda — {formatFriendlyDate(selectedDate)}</div>
            {selectedDayEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No events scheduled on this day.
              </p>
            ) : (
              selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.04]/70 border border-stone-200/80 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{evt.title}</span>
                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3 h-3" /> {formatTime12h(evt.startTime)} ({evt.durationMinutes}m)
                  </div>
                  {evt.location && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {evt.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 font-semibold">
                      {evt.isFamilyWide ? 'Family' : 'Personal'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10">
                      {evt.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDates.map((d) => {
            const evts = visibleEvents.filter((e) => e.eventDate === d);
            return (
              <div
                key={d}
                className={`bg-white dark:bg-[#161920] border rounded-xl p-3 space-y-2 ${
                  d === today
                    ? 'border-indigo-500'
                    : 'border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="text-xs font-bold">{formatFriendlyDate(d)}</div>
                {evts.length === 0 ? (
                  <div className="text-[11px] text-slate-400">Free</div>
                ) : (
                  evts.map((e) => (
                    <div
                      key={e.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-stone-200/70 dark:border-zinc-800 text-xs space-y-0.5"
                    >
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {formatTime12h(e.startTime)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="surface-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-base">Schedule for {formatFriendlyDate(selectedDate)}</h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events on {selectedDate}.</p>
          ) : (
            selectedDayEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200/80 dark:border-white/10"
              >
                <div>
                  <div className="font-bold text-sm">{e.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {formatTime12h(e.startTime)} · {e.durationMinutes} mins · {e.location || 'No location'}
                  </div>
                  {e.description && (
                    <p className="text-xs text-stone-600 dark:text-zinc-300 mt-1">{e.description}</p>
                  )}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {e.isFamilyWide ? 'Family-Wide' : 'Personal'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-surface-enter surface-card rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Add Calendar Event</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title (e.g., Soccer Practice)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Duration (min)"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as CalendarEvent['recurrence'])}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFamilyWide}
                  onChange={(e) => setIsFamilyWide(e.target.checked)}
                  className="rounded"
                />
                <Users className="w-4 h-4 text-teal-700" />
                Family-wide event (visible to all members)
              </label>

              {!isFamilyWide && (
                <div className="flex flex-wrap gap-1.5">
                  {state.members.map((m) => {
                    const sel = assignedMembers.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() =>
                          setAssignedMembers((prev) =>
                            sel ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }
                        className={`btn-tactile px-2.5 py-1 rounded-full text-xs border ${
                          sel
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {m.displayName}
                      </button>
                    );
                  })}
                </div>
              )}

              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />

              <div className="flex justify-end gap-2">
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
