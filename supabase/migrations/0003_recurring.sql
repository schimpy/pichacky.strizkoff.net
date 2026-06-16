-- recurring flag for tasks that repeat regularly (standup, review, etc.)
alter table tasks add column if not exists recurring boolean not null default false;
