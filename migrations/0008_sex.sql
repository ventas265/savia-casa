alter table daily_logs
  add column if not exists sex boolean not null default false;
