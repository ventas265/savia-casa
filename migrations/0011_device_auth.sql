alter table savia_testers add column if not exists token text;
alter table savia_testers add column if not exists recovery_hash text;
create unique index if not exists savia_testers_token_idx on savia_testers (token) where token is not null;
