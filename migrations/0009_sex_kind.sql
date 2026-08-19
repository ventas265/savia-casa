alter table daily_logs
  add column if not exists sex_kind text not null default 'none';
