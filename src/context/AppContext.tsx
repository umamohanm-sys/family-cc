import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  ActivityFeedItem,
  AppNotification,
  CalendarEvent,
  FamilyCommandState,
  FamilyMember,
  Goal,
  Habit,
  Invitation,
  JournalEntry,
  MemberPermissions,
  MemberRole,
  NavTab,
  NotificationPreferences,
  TaskItem,
  TaskStatus,
} from '../types';
import { createSampleFamilyState } from '../data/sampleData';
import { isSupabaseConfigured, signOutSupabase, supabase } from '../lib/supabase';
import { todayISO } from '../utils/dateUtils';

const STORAGE_KEY = 'fcc_family_command_state_v1';
const ACTIVE_MEMBER_KEY = 'fcc_active_member_id_v1';
const THEME_KEY = 'fcc_theme_v1';
const STYLE_KEY = 'fcc_theme_style_v1';
const AUTH_SESSION_KEY = 'fcc_demo_authenticated_v1';

export type ThemeStyle = 'obsidian' | 'aurora' | 'nordic';

interface AppContextValue {
  state: FamilyCommandState;
  currentMember: FamilyMember;
  isAuthenticated: boolean;
  supabaseSession: Session | null;
  isOnline: boolean;
  pendingSyncCount: number;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  inspectingMemberId: string | null;
  setInspectingMemberId: (id: string | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;

  // Auth & Family Onboarding
  loginDemo: (memberId?: string) => void;
  logout: () => Promise<void>;
  switchMember: (memberId: string) => void;
  registerNewFamily: (familyName: string, parentName: string, email: string) => void;
  createInvitation: (
    email: string,
    displayName: string,
    role: MemberRole,
    ageGroup: 'adult' | 'teen' | 'child'
  ) => Invitation;
  acceptInvitation: (token: string, displayName: string, email: string) => boolean;
  updateMemberRoleAndPerms: (
    memberId: string,
    role: MemberRole,
    permissions: MemberPermissions
  ) => void;

  // Tasks
  addTask: (task: Omit<TaskItem, 'id' | 'familyId' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<TaskItem>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;

  // Events
  addEvent: (evt: Omit<CalendarEvent, 'id' | 'familyId' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getVisibleEvents: (viewer?: FamilyMember) => CalendarEvent[];

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'familyId' | 'createdAt'>) => void;
  updateGoalProgress: (id: string, currentValue: number) => void;
  deleteGoal: (id: string) => void;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'familyId' | 'createdAt'>) => void;
  toggleHabitDate: (habitId: string, dateISO: string, ownerId: string) => void;
  deleteHabit: (id: string) => void;

  // Journal (strict privacy)
  saveJournalEntry: (
    entry: Omit<JournalEntry, 'id' | 'familyId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => void;
  deleteJournalEntry: (id: string) => void;
  getVisibleJournalEntries: (viewer?: FamilyMember) => JournalEntry[];

  // Notifications & Settings
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  exportBackupJSON: () => string;
  restoreBackupJSON: (json: string) => boolean;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadInitialState(): FamilyCommandState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as FamilyCommandState;
    }
  } catch {
    // ignore corrupt storage
  }
  return createSampleFamilyState();
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FamilyCommandState>(loadInitialState);
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_MEMBER_KEY) || 'mem-elena';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [inspectingMemberId, setInspectingMemberId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';
  });
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    const saved = localStorage.getItem(STYLE_KEY);
    if (saved === 'obsidian' || saved === 'aurora' || saved === 'nordic') return saved;
    return 'obsidian';
  });

  // Theme & style attribute sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.setAttribute('data-style', themeStyle);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(STYLE_KEY, themeStyle);
  }, [theme, themeStyle]);

  // Persist state & broadcast to other tabs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const bc = new BroadcastChannel('fcc_sync');
      bc.postMessage({ type: 'STATE_UPDATED', state });
      bc.close();
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    const bc = new BroadcastChannel('fcc_sync');
    bc.onmessage = (event) => {
      if (event.data?.type === 'STATE_UPDATED' && event.data.state) {
        setState(event.data.state);
      }
    };
    return () => bc.close();
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setPendingSyncCount(0);
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Supabase Auth session listener if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSupabaseSession(data.session);
      if (data.session) setIsAuthenticated(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      if (session) setIsAuthenticated(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const currentMember = useMemo(() => {
    return (
      state.members.find((m) => m.id === activeMemberId) ||
      state.members[0]
    );
  }, [state.members, activeMemberId]);

  const recordOfflineMutation = () => {
    if (!isOnline) setPendingSyncCount((c) => c + 1);
  };

  const pushActivity = (
    prev: FamilyCommandState,
    actorId: string,
    actionType: ActivityFeedItem['actionType'],
    entityType: ActivityFeedItem['entityType'],
    summary: string,
    entityId?: string
  ): ActivityFeedItem[] => {
    const item: ActivityFeedItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      familyId: prev.family.id,
      actorId,
      actionType,
      entityType,
      entityId,
      summary,
      createdAt: new Date().toISOString(),
    };
    return [item, ...prev.activityFeed].slice(0, 50);
  };

  const loginDemo = (memberId?: string) => {
    if (memberId) {
      setActiveMemberId(memberId);
      localStorage.setItem(ACTIVE_MEMBER_KEY, memberId);
    }
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await signOutSupabase();
    }
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_SESSION_KEY);
    setInspectingMemberId(null);
  };

  const switchMember = (memberId: string) => {
    setActiveMemberId(memberId);
    localStorage.setItem(ACTIVE_MEMBER_KEY, memberId);
    setInspectingMemberId(null);
    setActiveTab('home');
  };

  const registerNewFamily = (familyName: string, parentName: string, email: string) => {
    const now = new Date().toISOString();
    const familyId = `fam-${Date.now()}`;
    const parentId = `mem-${Date.now()}`;
    const newParent: FamilyMember = {
      id: parentId,
      familyId,
      email,
      displayName: parentName,
      role: 'parent',
      ageGroup: 'adult',
      avatarColor: '#4F46E5',
      avatarEmoji: '👩🏽',
      permissions: { canAssignTasks: true, canCreateFamilyEvents: true, canInvite: true },
      createdAt: now,
    };
    setState({
      family: { id: familyId, name: familyName, createdBy: parentId, createdAt: now },
      members: [newParent],
      invitations: [],
      tasks: [],
      events: [],
      goals: [],
      habits: [],
      habitLogs: [],
      journalEntries: [],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          familyId,
          actorId: parentId,
          actionType: 'member_joined',
          entityType: 'member',
          summary: `${parentName} created ${familyName}`,
          createdAt: now,
        },
      ],
      notificationPrefs: {
        [parentId]: {
          taskReminders: true,
          overdueAlerts: true,
          eventReminders: true,
          dailyPlanning: true,
          journalReminders: true,
          weeklySummary: true,
          parentCompletionAlerts: true,
          pushEnabled: false,
        },
      },
    });
    loginDemo(parentId);
  };

  const createInvitation = (
    email: string,
    displayName: string,
    role: MemberRole,
    ageGroup: 'adult' | 'teen' | 'child'
  ): Invitation => {
    const inv: Invitation = {
      id: `inv-${Date.now()}`,
      familyId: state.family.id,
      email,
      displayName,
      role,
      ageGroup,
      token: `fcc-${Math.random().toString(36).slice(2, 10)}`,
      status: 'pending',
      invitedBy: currentMember.id,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      invitations: [inv, ...prev.invitations],
      activityFeed: pushActivity(
        prev,
        currentMember.id,
        'member_joined',
        'member',
        `${currentMember.displayName} invited ${displayName} (${role})`,
        inv.id
      ),
    }));
    return inv;
  };

  const acceptInvitation = (token: string, displayName: string, email: string): boolean => {
    const inv = state.invitations.find((i) => i.token === token && i.status === 'pending');
    if (!inv) return false;
    const newId = `mem-${Date.now()}`;
    const emojis = ['🧑🏽', '👧🏽', '👦🏽', '👩🏽', '👨🏽'];
    const colors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#0EA5E9'];
    const member: FamilyMember = {
      id: newId,
      familyId: state.family.id,
      email: email || inv.email,
      displayName: displayName || inv.displayName,
      role: inv.role,
      ageGroup: inv.ageGroup,
      avatarColor: colors[state.members.length % colors.length],
      avatarEmoji: emojis[state.members.length % emojis.length],
      permissions: {
        canAssignTasks: inv.role === 'parent',
        canCreateFamilyEvents: true,
        canInvite: inv.role === 'parent',
      },
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      members: [...prev.members, member],
      invitations: prev.invitations.map((i) =>
        i.id === inv.id ? { ...i, status: 'accepted' } : i
      ),
      activityFeed: pushActivity(
        prev,
        newId,
        'member_joined',
        'member',
        `${member.displayName} joined ${prev.family.name}!`,
        newId
      ),
    }));
    loginDemo(newId);
    return true;
  };

  const updateMemberRoleAndPerms = (
    memberId: string,
    role: MemberRole,
    permissions: MemberPermissions
  ) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId ? { ...m, role, permissions } : m
      ),
    }));
  };

  // Tasks CRUD
  const addTask = (task: Omit<TaskItem, 'id' | 'familyId' | 'createdAt'>) => {
    recordOfflineMutation();
    const id = `task-${Date.now()}`;
    const newTask: TaskItem = {
      ...task,
      id,
      familyId: state.family.id,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      activityFeed: pushActivity(
        prev,
        currentMember.id,
        'task_created',
        'task',
        `${currentMember.displayName} added task "${newTask.title}"`,
        id
      ),
    }));
  };

  const updateTask = (id: string, patch: Partial<TaskItem>) => {
    recordOfflineMutation();
    setState((prev) => {
      const existing = prev.tasks.find((t) => t.id === id);
      const updated = prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
      const summary =
        patch.dueDate && existing && patch.dueDate !== existing.dueDate
          ? `${currentMember.displayName} updated deadline for "${existing.title}"`
          : `${currentMember.displayName} updated "${existing?.title || 'task'}"`;
      return {
        ...prev,
        tasks: updated,
        activityFeed: pushActivity(prev, currentMember.id, 'task_updated', 'task', summary, id),
      };
    });
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    recordOfflineMutation();
    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === id);
      const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
      const tasks = prev.tasks.map((t) =>
        t.id === id ? { ...t, status, completedAt } : t
      );
      const activityFeed =
        status === 'completed' && target
          ? pushActivity(
              prev,
              currentMember.id,
              'task_completed',
              'task',
              `${currentMember.displayName} completed "${target.title}"`,
              id
            )
          : prev.activityFeed;
      return { ...prev, tasks, activityFeed };
    });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      ),
    }));
  };

  const deleteTask = (id: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  // Events CRUD
  const addEvent = (evt: Omit<CalendarEvent, 'id' | 'familyId' | 'createdAt'>) => {
    recordOfflineMutation();
    const id = `evt-${Date.now()}`;
    const newEvt: CalendarEvent = {
      ...evt,
      id,
      familyId: state.family.id,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      events: [...prev.events, newEvt],
      activityFeed: evt.isFamilyWide
        ? pushActivity(
            prev,
            currentMember.id,
            'event_added',
            'event',
            `${currentMember.displayName} added family event "${newEvt.title}"`,
            id
          )
        : prev.activityFeed,
    }));
  };

  const updateEvent = (id: string, patch: Partial<CalendarEvent>) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const deleteEvent = (id: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const getVisibleEvents = (viewer: FamilyMember = currentMember): CalendarEvent[] => {
    return state.events.filter(
      (e) =>
        e.isFamilyWide ||
        e.createdBy === viewer.id ||
        e.assignedMembers.includes(viewer.id) ||
        viewer.role === 'parent'
    );
  };

  // Goals CRUD
  const addGoal = (goal: Omit<Goal, 'id' | 'familyId' | 'createdAt'>) => {
    recordOfflineMutation();
    const id = `goal-${Date.now()}`;
    const newGoal: Goal = {
      ...goal,
      id,
      familyId: state.family.id,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
      activityFeed: pushActivity(
        prev,
        currentMember.id,
        'goal_added',
        'goal',
        `${currentMember.displayName} added a ${newGoal.scope} goal "${newGoal.title}"`,
        id
      ),
    }));
  };

  const updateGoalProgress = (id: string, currentValue: number) => {
    recordOfflineMutation();
    setState((prev) => {
      const target = prev.goals.find((g) => g.id === id);
      const isDone = target ? currentValue >= target.targetValue : false;
      const goals = prev.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              currentValue: Math.max(0, currentValue),
              status: isDone ? ('completed' as const) : ('active' as const),
              completedAt: isDone ? new Date().toISOString() : undefined,
            }
          : g
      );
      const activityFeed =
        isDone && target && target.status !== 'completed'
          ? pushActivity(
              prev,
              currentMember.id,
              'goal_completed',
              'goal',
              `${currentMember.displayName} achieved goal "${target.title}"! 🎉`,
              id
            )
          : prev.activityFeed;
      return { ...prev, goals, activityFeed };
    });
  };

  const deleteGoal = (id: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  };

  // Habits CRUD
  const addHabit = (habit: Omit<Habit, 'id' | 'familyId' | 'createdAt'>) => {
    recordOfflineMutation();
    const id = `hab-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, { ...habit, id, familyId: prev.family.id, createdAt: new Date().toISOString() }],
    }));
  };

  const toggleHabitDate = (habitId: string, dateISO: string, ownerId: string) => {
    recordOfflineMutation();
    setState((prev) => {
      const existing = prev.habitLogs.find(
        (l) => l.habitId === habitId && l.loggedDate === dateISO
      );
      if (existing) {
        return {
          ...prev,
          habitLogs: prev.habitLogs.filter((l) => l.id !== existing.id),
        };
      }
      return {
        ...prev,
        habitLogs: [
          ...prev.habitLogs,
          {
            id: `hl-${Date.now()}`,
            habitId,
            familyId: prev.family.id,
            ownerId,
            loggedDate: dateISO,
            completed: true,
            count: 1,
          },
        ],
      };
    });
  };

  const deleteHabit = (id: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
      habitLogs: prev.habitLogs.filter((l) => l.habitId !== id),
    }));
  };

  // Journal CRUD with strict privacy
  const saveJournalEntry = (
    entry: Omit<JournalEntry, 'id' | 'familyId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    recordOfflineMutation();
    const now = new Date().toISOString();
    setState((prev) => {
      if (entry.id) {
        return {
          ...prev,
          journalEntries: prev.journalEntries.map((j) =>
            j.id === entry.id ? { ...j, ...entry, updatedAt: now } : j
          ),
        };
      }
      const id = `j-${Date.now()}`;
      const newEntry: JournalEntry = {
        ...entry,
        id,
        familyId: prev.family.id,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...prev,
        journalEntries: [newEntry, ...prev.journalEntries],
        // Note: summary intentionally omits private content
        activityFeed: pushActivity(
          prev,
          entry.authorId,
          'journal_created',
          'journal',
          `${currentMember.displayName} created a journal entry`,
          id
        ),
      };
    });
  };

  const deleteJournalEntry = (id: string) => {
    recordOfflineMutation();
    setState((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.filter((j) => j.id !== id),
    }));
  };

  const getVisibleJournalEntries = (viewer: FamilyMember = currentMember): JournalEntry[] => {
    return state.journalEntries.filter((entry) => {
      if (entry.authorId === viewer.id) return true;
      if (entry.visibility === 'family_shared') return true;
      if (entry.visibility === 'parent_accessible' && viewer.role === 'parent') return true;
      return false;
    });
  };

  // Dynamic Notifications
  const notifications = useMemo<AppNotification[]>(() => {
    const today = todayISO();
    const list: AppNotification[] = [];
    const myTasks = state.tasks.filter(
      (t) => t.assignedTo.includes(currentMember.id) && t.status !== 'completed'
    );
    const overdue = myTasks.filter((t) => t.dueDate < today);
    const dueToday = myTasks.filter((t) => t.dueDate === today);

    overdue.forEach((t) => {
      const id = `notif-overdue-${t.id}`;
      list.push({
        id,
        title: 'Overdue Task',
        body: `"${t.title}" was due on ${t.dueDate}.`,
        type: 'overdue',
        read: readNotificationIds.has(id),
        createdAt: new Date().toISOString(),
      });
    });

    dueToday.forEach((t) => {
      const id = `notif-due-${t.id}`;
      list.push({
        id,
        title: 'Due Today',
        body: `"${t.title}"${t.dueTime ? ` at ${t.dueTime}` : ''}`,
        type: 'task',
        read: readNotificationIds.has(id),
        createdAt: new Date().toISOString(),
      });
    });

    const todayEvents = getVisibleEvents(currentMember).filter((e) => e.eventDate === today);
    todayEvents.forEach((e) => {
      const id = `notif-evt-${e.id}`;
      list.push({
        id,
        title: 'Upcoming Event Today',
        body: `${e.title} at ${e.startTime}${e.location ? ` (${e.location})` : ''}`,
        type: 'event',
        read: readNotificationIds.has(id),
        createdAt: new Date().toISOString(),
      });
    });

    const hasJournalToday = state.journalEntries.some(
      (j) => j.authorId === currentMember.id && j.entryDate === today
    );
    if (!hasJournalToday) {
      const id = `notif-journal-${today}`;
      list.push({
        id,
        title: 'Daily Reflection Reminder',
        body: 'Take 2 minutes to log your highlights and gratitude for today.',
        type: 'journal',
        read: readNotificationIds.has(id),
        createdAt: new Date().toISOString(),
      });
    }

    return list;
  }, [state.tasks, state.events, state.journalEntries, currentMember, readNotificationIds]);

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => new Set(prev).add(id));
  };

  const updateNotificationPrefs = (patch: Partial<NotificationPreferences>) => {
    setState((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        [currentMember.id]: {
          ...prev.notificationPrefs[currentMember.id],
          ...patch,
        },
      },
    }));
  };

  const exportBackupJSON = () => JSON.stringify(state, null, 2);

  const restoreBackupJSON = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as FamilyCommandState;
      if (!parsed.family || !Array.isArray(parsed.members)) return false;
      setState(parsed);
      return true;
    } catch {
      return false;
    }
  };

  const resetDemoData = () => {
    const fresh = createSampleFamilyState();
    setState(fresh);
    setActiveMemberId(fresh.members[0].id);
    localStorage.setItem(ACTIVE_MEMBER_KEY, fresh.members[0].id);
  };

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <AppContext.Provider
      value={{
        state,
        currentMember,
        isAuthenticated,
        supabaseSession,
        isOnline,
        pendingSyncCount,
        activeTab,
        setActiveTab,
        inspectingMemberId,
        setInspectingMemberId,
        theme,
        toggleTheme,
        themeStyle,
        setThemeStyle,
        loginDemo,
        logout,
        switchMember,
        registerNewFamily,
        createInvitation,
        acceptInvitation,
        updateMemberRoleAndPerms,
        addTask,
        updateTask,
        setTaskStatus,
        toggleSubtask,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        getVisibleEvents,
        addGoal,
        updateGoalProgress,
        deleteGoal,
        addHabit,
        toggleHabitDate,
        deleteHabit,
        saveJournalEntry,
        deleteJournalEntry,
        getVisibleJournalEntries,
        notifications,
        markNotificationRead,
        updateNotificationPrefs,
        exportBackupJSON,
        restoreBackupJSON,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
