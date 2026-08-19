alter table savia_profiles add column if not exists intention text not null default 'track';
alter table daily_logs add column if not exists mucus text not null default 'none';
