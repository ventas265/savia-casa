-- Web Push subscriptions (companion reminders). One row per browser endpoint.
-- user_id = the beta device id (savia_testers.device_id / savia_profiles.user_id).
create table if not exists push_subscriptions (
  id            serial primary key,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_id       text not null,
  display_name  text not null default '',
  timezone      text not null default 'America/Caracas',
  preferred_hour smallint not null default 9 check (preferred_hour between 0 and 23),
  locale        text not null default 'es',
  enabled       boolean not null default true,
  last_sent_on  date,
  last_test_at  timestamptz,
  fail_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
create index if not exists push_subscriptions_enabled_idx on push_subscriptions (enabled, preferred_hour);
