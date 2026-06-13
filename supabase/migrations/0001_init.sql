-- Píchačky: time tracking schema

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  color text not null default '#3b82f6',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  project_id uuid references projects(id) on delete set null,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  task_id uuid not null references tasks(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on tasks (project_id);
create index if not exists time_entries_user_started_idx on time_entries (user_id, started_at desc);
create index if not exists time_entries_task_id_idx on time_entries (task_id);

alter table projects enable row level security;
alter table tags enable row level security;
alter table tasks enable row level security;
alter table task_tags enable row level security;
alter table time_entries enable row level security;

create policy "owner all" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner all" on tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner all" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner all" on time_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner via task" on task_tags for all
  using (exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid()));
