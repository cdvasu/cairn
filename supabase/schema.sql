-- Cairn — database schema, indexes and Row Level Security policies.
-- Run this in the Supabase SQL editor. It is idempotent.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Replaces the earlier `activities` model, which fed one set of items to both
-- the heatmap and the todo list. Trackers and lists are now independent.
-- The two drops below are safe only while nothing has been created yet.
-- ---------------------------------------------------------------------------
drop table if exists public.activities cascade;

-- ------------------------------------------------------------------ trackers
-- One per thing you want to keep returning to. Marked by hand, once a day.
create table if not exists public.trackers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trackers_user_idx on public.trackers (user_id, position);

-- ------------------------------------------------------------------ day_logs
-- One row per tracker per day it was done. Nothing here resets or breaks.
-- Dropped explicitly: this table changed shape (activity_id -> tracker_id), and
-- `if not exists` would silently keep the old columns on an existing project.
drop table if exists public.day_logs cascade;

create table public.day_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  tracker_id uuid not null references public.trackers (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (tracker_id, day)
);

create index if not exists day_logs_user_day_idx on public.day_logs (user_id, day);

-- --------------------------------------------------------------------- lists
-- Groupings on the todo page. Unrelated to trackers by design.
create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lists_user_idx on public.lists (user_id, position);

-- --------------------------------------------------------------------- todos
-- `is_minimum` is set by dragging an item into a list's Minimum section.
drop table if exists public.todos cascade;

create table public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  list_id    uuid not null references public.lists (id) on delete cascade,
  day        date not null,
  title      text not null check (char_length(trim(title)) between 1 and 200),
  done       boolean not null default false,
  is_minimum boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_day_idx on public.todos (user_id, day);
create index if not exists todos_list_day_idx on public.todos (list_id, day, position);

-- ----------------------------------------------------------- journal_entries
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  content    text not null default '' check (char_length(content) <= 10000),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists journal_user_day_idx on public.journal_entries (user_id, day desc);

-- ------------------------------------------------------------------------ RLS
alter table public.trackers        enable row level security;
alter table public.day_logs        enable row level security;
alter table public.lists           enable row level security;
alter table public.todos           enable row level security;
alter table public.journal_entries enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['trackers', 'day_logs', 'lists', 'todos', 'journal_entries'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete', t);
  end loop;
end $$;
