export type MemberRole = 'parent' | 'member';
export type AgeGroup = 'adult' | 'teen' | 'child';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type TaskCategory =
  | 'Chores'
  | 'Homework'
  | 'Reading'
  | 'Exercise'
  | 'Health'
  | 'Errands'
  | 'Personal'
  | 'Family';

export type JournalVisibility = 'private' | 'family_shared' | 'parent_accessible';
export type MoodType = 'amazing' | 'good' | 'okay' | 'tired' | 'stressed';
export type GoalScope = 'daily' | 'weekly' | 'monthly' | 'family';

export type NavTab =
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'goals'
  | 'journal'
  | 'family'
  | 'reports'
  | 'settings';

export interface MemberPermissions {
  canAssignTasks: boolean;
  canCreateFamilyEvents: boolean;
  canInvite: boolean;
}

export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId?: string;
  email: string;
  displayName: string;
  role: MemberRole;
  ageGroup: AgeGroup;
  avatarColor: string;
  avatarEmoji: string;
  permissions: MemberPermissions;
  createdAt: string;
}

export interface Invitation {
  id: string;
  familyId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  ageGroup: AgeGroup;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
}

export interface TaskItem {
  id: string;
  familyId: string;
  title: string;
  description: string;
  assignedTo: string[];
  createdBy: string;
  startDate?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  recurrence: RecurrenceType;
  recurrenceCustom?: string;
  subtasks: Subtask[];
  notes: string;
  attachments: TaskAttachment[];
  reminderMinutes?: number;
  completedAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  familyId: string;
  title: string;
  description: string;
  location: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  isFamilyWide: boolean;
  assignedMembers: string[];
  category: 'School' | 'Sports' | 'Music' | 'Medical' | 'Outing' | 'Birthday' | 'Deadline' | 'Family';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminderMinutes: number;
  createdBy: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  familyId: string;
  ownerId: string; // memberId or 'family'
  scope: GoalScope;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string;
  status: 'active' | 'completed' | 'archived';
  completedAt?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  familyId: string;
  ownerId: string;
  title: string;
  icon: string;
  color: string;
  targetFrequency: 'daily' | 'weekly';
  targetCount: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  familyId: string;
  ownerId: string;
  loggedDate: string; // YYYY-MM-DD
  completed: boolean;
  count: number;
}

export interface JournalEntry {
  id: string;
  familyId: string;
  authorId: string;
  entryDate: string; // YYYY-MM-DD
  visibility: JournalVisibility;
  mood: MoodType;
  energy: number; // 1-5
  content: string;
  highlights: string;
  learned: string;
  gratitude: string;
  tomorrowPriorities: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFeedItem {
  id: string;
  familyId: string;
  actorId: string;
  actionType:
    | 'task_completed'
    | 'task_created'
    | 'task_updated'
    | 'goal_added'
    | 'goal_completed'
    | 'journal_created'
    | 'event_added'
    | 'habit_streak'
    | 'member_joined';
  entityType: 'task' | 'goal' | 'journal' | 'event' | 'habit' | 'member';
  entityId?: string;
  summary: string;
  createdAt: string;
}

export interface NotificationPreferences {
  taskReminders: boolean;
  overdueAlerts: boolean;
  eventReminders: boolean;
  dailyPlanning: boolean;
  journalReminders: boolean;
  weeklySummary: boolean;
  parentCompletionAlerts: boolean;
  pushEnabled: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'task' | 'overdue' | 'event' | 'journal' | 'summary';
  read: boolean;
  createdAt: string;
}

export interface FamilyCommandState {
  family: Family;
  members: FamilyMember[];
  invitations: Invitation[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journalEntries: JournalEntry[];
  activityFeed: ActivityFeedItem[];
  notificationPrefs: Record<string, NotificationPreferences>;
}
