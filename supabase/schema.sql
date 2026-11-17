-- Family Command Center - Supabase PostgreSQL Schema & RLS Policies
-- Supports multi-family isolation, RBAC (parent / member), realtime sync, and strict journal privacy.

create extension if not exists "pgcrypto";

-- 1. Families
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2. Family Members
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  display_name text not null,
  role text not null check (role in ('parent', 'member')),
  age_group text not null default 'adult' check (age_group in ('adult', 'teen', 'child')),
  avatar_color text not null default '#4F46E5',
  avatar_emoji text not null default '👤',
  permissions jsonb not null default '{"canAssignTasks": false, "canCreateFamilyEvents": true, "canInvite": false}'::jsonb,
  pin_code text,
  created_at timestamptz not null default now()
);

-- 3. Invitations
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('parent', 'member')),
  age_group text not null default 'child' check (age_group in ('adult', 'teen', 'child')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references public.family_members(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

-- 4. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text default '',
  assigned_to uuid[] not null default '{}',
  created_by uuid references public.family_members(id) on delete set null,
  start_date date,
  due_date date,
  due_time text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  category text not null default 'Personal',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'custom')),
  recurrence_custom text,
  subtasks jsonb not null default '[]'::jsonb,
  notes text default '',
  attachments jsonb not null default '[]'::jsonb,
  reminder_minutes integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Calendar Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text default '',
  location text default '',
  event_date date not null,
  start_time text not null,
  duration_minutes integer not null default 60,
  is_family_wide boolean not null default true,
  assigned_members uuid[] not null default '{}',
  category text not null default 'Family',
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  reminder_minutes integer default 30,
  created_by uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 6. Goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid references public.family_members(id) on delete cascade,
  scope text not null default 'weekly' check (scope in ('daily', 'weekly', 'monthly', 'family')),
  title text not null,
  description text default '',
  target_value integer not null default 100,
  current_value integer not null default 0,
  unit text not null default '%',
  due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. Habits & Habit Logs
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid not null references public.family_members(id) on delete cascade,
  title text not null,
  icon text not null default '✨',
  color text not null default '#10B981',
  target_frequency text not null default 'daily' check (target_frequency in ('daily', 'weekly')),
  target_count integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid not null references public.family_members(id) on delete cascade,
  logged_date date not null,
  completed boolean not null default true,
  count integer not null default 1,
  unique (habit_id, logged_date)
);

-- 8. Journal Entries (Strict Privacy Enforcement)
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.family_members(id) on delete cascade,
  entry_date date not null,
  visibility text not null default 'private' check (visibility in ('private', 'family_shared', 'parent_accessible')),
  mood text,
  energy integer check (energy between 1 and 5),
  content text not null default '',
  highlights text default '',
  learned text default '',
  gratitude text default '',
  tomorrow_priorities text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Family Activity Feed
create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  actor_id uuid references public.family_members(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

-- 10. Notification Preferences
create table if not exists public.notification_preferences (
  member_id uuid primary key references public.family_members(id) on delete cascade,
  task_reminders boolean not null default true,
  overdue_alerts boolean not null default true,
  event_reminders boolean not null default true,
  daily_planning boolean not null default true,
  journal_reminders boolean not null default true,
  weekly_summary boolean not null default true,
  parent_completion_alerts boolean not null default true,
  push_enabled boolean not null default false
);

-- ============================================================================
-- Helper Functions & Row-Level Security (RLS)
-- ============================================================================

create or replace function public.current_member_family_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

create or replace function public.is_parent_in_family(target_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
      and role = 'parent'
  );
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.journal_entries enable row level security;
alter table public.activity_feed enable row level security;
alter table public.notification_preferences enable row level security;

-- Families: members can read their own family; authenticated users can create
create policy "Read own family" on public.families
  for select using (id in (select public.current_member_family_ids()));
create policy "Create family" on public.families
  for insert with check (auth.uid() = created_by);

-- Family Members: read members in same family; parents manage members
create policy "Read family members" on public.family_members
  for select using (family_id in (select public.current_member_family_ids()));
create policy "Manage family members" on public.family_members
  for all using (public.is_parent_in_family(family_id) or user_id = auth.uid());

-- Invitations: parents can manage; anyone with token can read pending
create policy "Parents manage invitations" on public.invitations
  for all using (public.is_parent_in_family(family_id));
create policy "Read invitation by token" on public.invitations
  for select using (status = 'pending');

-- Tasks, Events, Goals, Habits, Habit Logs, Activity Feed: scoped to family_id
create policy "Family tasks access" on public.tasks
  for all using (family_id in (select public.current_member_family_ids()));

create policy "Family events access" on public.events
  for all using (
    family_id in (select public.current_member_family_ids())
    and (
      is_family_wide = true
      or created_by in (select id from public.family_members where user_id = auth.uid())
      or exists (
        select 1 from public.family_members fm
        where fm.user_id = auth.uid() and fm.id = any(assigned_members)
      )
      or public.is_parent_in_family(family_id)
    )
  );

create policy "Family goals access" on public.goals
  for all using (family_id in (select public.current_member_family_ids()));

create policy "Family habits access" on public.habits
  for all using (family_id in (select public.current_member_family_ids()));

create policy "Family habit logs access" on public.habit_logs
  for all using (family_id in (select public.current_member_family_ids()));

create policy "Family activity feed access" on public.activity_feed
  for all using (family_id in (select public.current_member_family_ids()));

-- Journal Entries: STRICT PRIVACY
create policy "Journal read policy" on public.journal_entries
  for select using (
    family_id in (select public.current_member_family_ids())
    and (
      author_id in (select id from public.family_members where user_id = auth.uid())
      or visibility = 'family_shared'
      or (visibility = 'parent_accessible' and public.is_parent_in_family(family_id))
    )
  );

create policy "Journal write own entries" on public.journal_entries
  for insert with check (
    author_id in (select id from public.family_members where user_id = auth.uid())
  );

create policy "Journal update own entries" on public.journal_entries
  for update using (
    author_id in (select id from public.family_members where user_id = auth.uid())
  );

create policy "Journal delete own entries" on public.journal_entries
  for delete using (
    author_id in (select id from public.family_members where user_id = auth.uid())
  );

create policy "Notification prefs own access" on public.notification_preferences
  for all using (
    member_id in (select id from public.family_members where user_id = auth.uid())
  );
