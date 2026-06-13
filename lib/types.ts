export type Project = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  archived: boolean;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  archived: boolean;
  created_at: string;
};

export type TimeEntry = {
  id: string;
  user_id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  created_at: string;
};
