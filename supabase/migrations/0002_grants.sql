-- The Data API "authenticated" role needs table privileges in addition to RLS
-- policies. When the schema is applied via raw SQL (not the Supabase dashboard),
-- these grants are not added automatically, which makes every PostgREST request
-- fail with "permission denied for table ...". RLS still enforces row ownership.

grant select, insert, update, delete on projects, tags, tasks, task_tags, time_entries to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
