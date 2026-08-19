create table if not exists savia_profiles (
  user_id text primary key,
  display_name text not null default '',
  stage text not null default 'cycle',
  birth_year integer,
  cycle_length integer not null default 28,
  period_length integer not null default 5,
  last_period_start date,
  due_date date,
  last_period_year integer,
  onboarding_done boolean not null default false,
  locale text not null default 'es',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists period_starts (
  id serial primary key,
  user_id text not null,
  start_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);
create index if not exists period_starts_user_idx on period_starts (user_id, start_date desc);

create table if not exists daily_logs (
  id serial primary key,
  user_id text not null,
  day date not null,
  flow text not null default 'none',
  mood integer,
  energy integer,
  sleep_hours numeric,
  notes text not null default '',
  symptoms jsonb not null default '[]'::jsonb,
  period_started boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists daily_logs_user_idx on daily_logs (user_id, day desc);

create table if not exists savia_waitlist (
  id serial primary key,
  email text not null,
  plan text not null default 'serena',
  created_at timestamptz not null default now()
);
