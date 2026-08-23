create table if not exists savia_testers (
  device_id   text primary key,
  display_name text not null default '',
  stage       text not null default 'cycle',
  country     text not null default 'VE',
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create index if not exists savia_testers_seen_idx on savia_testers (last_seen desc);
