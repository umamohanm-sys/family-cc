import React, { useMemo, useState } from 'react';
import { BookOpen, Eye, Home, Lock, Save, Sparkles, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { JournalVisibility, MoodType } from '../types';
import { formatFriendlyDate, todayISO } from '../utils/dateUtils';

const MOODS: { id: MoodType; label: string }[] = [
  { id: 'amazing', label: 'Amazing' },
  { id: 'good', label: 'Good' },
  { id: 'okay', label: 'Okay' },
  { id: 'tired', label: 'Tired' },
  { id: 'stressed', label: 'Stressed' },
];

export const JournalView: React.FC = () => {
  const {
    state,
    currentMember,
    getVisibleJournalEntries,
    saveJournalEntry,
    deleteJournalEntry,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [tab, setTab] = useState<'write' | 'history' | 'shared'>('write');

  const visibleEntries = useMemo(
    () => getVisibleJournalEntries(currentMember),
    [getVisibleJournalEntries, currentMember]
  );

  const myEntries = useMemo(
    () =>
      visibleEntries
        .filter((j) => j.authorId === currentMember.id)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate)),
    [visibleEntries, currentMember.id]
  );

  const familySharedEntries = useMemo(
    () =>
      visibleEntries
        .filter((j) => j.authorId !== currentMember.id)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate)),
    [visibleEntries, currentMember.id]
  );

  const existingForDate = myEntries.find((j) => j.entryDate === selectedDate);

  const [visibility, setVisibility] = useState<JournalVisibility>(
    existingForDate?.visibility || 'private'
  );
  const [mood, setMood] = useState<MoodType>(existingForDate?.mood || 'good');
  const [energy, setEnergy] = useState<number>(existingForDate?.energy || 4);
  const [content, setContent] = useState(existingForDate?.content || '');
  const [highlights, setHighlights] = useState(existingForDate?.highlights || '');
  const [learned, setLearned] = useState(existingForDate?.learned || '');
  const [gratitude, setGratitude] = useState(existingForDate?.gratitude || '');
  const [tomorrowPriorities, setTomorrowPriorities] = useState(
    existingForDate?.tomorrowPriorities || ''
  );
  const [savedToast, setSavedToast] = useState(false);

  const loadDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const found = myEntries.find((j) => j.entryDate === dateStr);
    setVisibility(found?.visibility || 'private');
    setMood(found?.mood || 'good');
    setEnergy(found?.energy || 4);
    setContent(found?.content || '');
    setHighlights(found?.highlights || '');
    setLearned(found?.learned || '');
    setGratitude(found?.gratitude || '');
    setTomorrowPriorities(found?.tomorrowPriorities || '');
    setTab('write');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveJournalEntry({
      id: existingForDate?.id,
      authorId: currentMember.id,
      entryDate: selectedDate,
      visibility,
      mood,
      energy,
      content,
      highlights,
      learned,
      gratitude,
      tomorrowPriorities,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="surface-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 accent-text" />
          <div>
            <h2 className="font-bold text-base">Daily Journal</h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Entries are private by default unless you choose to share them.
            </p>
          </div>
        </div>

        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
          {[
            { id: 'write', label: 'Write Entry' },
            { id: 'history', label: `My History (${myEntries.length})` },
            { id: 'shared', label: `Shared (${familySharedEntries.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`btn-tactile px-3 py-1.5 rounded-md text-xs font-semibold tabular-nums ${
                tab === t.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-stone-200/80 dark:border-zinc-700'
                  : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'write' && (
        <form
          onSubmit={handleSave}
          className="surface-card rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Entry Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => loadDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs font-semibold tabular-nums"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'private', label: 'Private', icon: Lock, color: 'text-rose-600' },
                  {
                    id: 'parent_accessible',
                    label: 'Parents',
                    icon: Users,
                    color: 'text-amber-600',
                  },
                  {
                    id: 'family_shared',
                    label: 'Family Shared',
                    icon: Home,
                    color: 'text-teal-700',
                  },
                ] as const
              ).map((v) => {
                const Icon = v.icon;
                const active = visibility === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setVisibility(v.id)}
                    className={`btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      active
                        ? 'border-indigo-500 bg-teal-50/70 dark:bg-teal-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? v.color : ''}`} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      mood === m.id
                        ? 'border-indigo-500 bg-teal-50 dark:bg-teal-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 tabular-nums">
                Energy Level ({energy}/5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setEnergy(lvl)}
                    className={`btn-tactile flex-1 py-1.5 rounded-lg text-xs font-bold border tabular-nums ${
                      energy >= lvl
                        ? 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1.5">
              Daily Reflection
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely about your day..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1">
                Today&apos;s Highlight
              </label>
              <input
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Best moment of the day..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1">
                Something I Learned
              </label>
              <input
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="A new skill, fact, or insight..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1">
                Grateful For
              </label>
              <input
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="Who or what are you thankful for?"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1">
                Tomorrow&apos;s Priorities
              </label>
              <input
                value={tomorrowPriorities}
                onChange={(e) => setTomorrowPriorities(e.target.value)}
                placeholder="Top 1–2 things for tomorrow..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedToast ? (
              <span className="text-xs font-semibold accent-text flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Entry saved ({visibility.replace('_', ' ')})
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Visibility: <strong>{visibility.replace('_', ' ')}</strong>
              </span>
            )}
            <button
              type="submit"
              className="btn-tactile px-5 py-2.5 rounded-lg accent-bg text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </form>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {myEntries.length === 0 ? (
            <div className="surface-card rounded-2xl p-8 text-center text-sm text-slate-500">
              No journal entries yet. Start writing today.
            </div>
          ) : (
            myEntries.map((entry) => (
              <div
                key={entry.id}
                className="surface-card rounded-2xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{formatFriendlyDate(entry.entryDate)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F2ED] dark:bg-zinc-800 capitalize">
                      {entry.mood}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-indigo-700 dark:text-indigo-300 font-medium capitalize">
                      {entry.visibility.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadDate(entry.entryDate)}
                      className="text-xs font-semibold accent-text hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteJournalEntry(entry.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {entry.content && (
                  <p className="text-sm text-stone-700 dark:text-zinc-300 max-w-[68ch] leading-relaxed">
                    {entry.content}
                  </p>
                )}
                {entry.highlights && (
                  <p className="text-xs text-slate-500">Highlight: {entry.highlights}</p>
                )}
                {entry.gratitude && (
                  <p className="text-xs text-slate-500">Gratitude: {entry.gratitude}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'shared' && (
        <div className="space-y-3">
          {familySharedEntries.length === 0 ? (
            <div className="surface-card rounded-2xl p-8 text-center text-sm text-slate-500">
              No shared family journal entries visible to you yet.
            </div>
          ) : (
            familySharedEntries.map((entry) => {
              const author = state.members.find((m) => m.id === entry.authorId);
              return (
                <div
                  key={entry.id}
                  className="surface-card rounded-2xl p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: author?.avatarColor || '#0F766E' }}
                      >
                        {author?.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-sm font-bold">{author?.displayName}</span>
                      <span className="text-xs text-slate-400">
                        · {formatFriendlyDate(entry.entryDate)}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1 capitalize">
                      <Eye className="w-3 h-3" /> {entry.visibility.replace('_', ' ')}
                    </span>
                  </div>
                  {entry.content && (
                    <p className="text-sm text-stone-700 dark:text-zinc-300 max-w-[68ch] leading-relaxed">
                      {entry.content}
                    </p>
                  )}
                  {entry.highlights && (
                    <p className="text-xs text-slate-500">Highlight: {entry.highlights}</p>
                  )}
                  {entry.gratitude && (
                    <p className="text-xs text-slate-500">Gratitude: {entry.gratitude}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
