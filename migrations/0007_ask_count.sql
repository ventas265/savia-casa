alter table savia_profiles
  add column if not exists ask_count integer not null default 0;
