-- Security phase 1.
-- 1) Fixed-window rate limits (AI, recovery, registration, waitlist, admin PIN).
create table if not exists savia_rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);
create index if not exists savia_rate_limits_window_idx on savia_rate_limits (window_start);

-- 2) Recovery codes: new codes are 16 chars, scrypt+salt, found by a 4-char selector.
alter table savia_testers add column if not exists recovery_selector text;
create index if not exists savia_testers_recovery_sel_idx
  on savia_testers (recovery_selector) where recovery_selector is not null;

-- 3) Existing (pre-0013) codes were stored as unsalted sha256(code). Wrap each one
--    with a per-row salt: lsha$<salt>$sha256(salt || old_hash). The user's code does
--    not change; the app verifies it and re-hashes it with scrypt on first use.
--    No rows are deleted; tokens are untouched.
update savia_testers t
set recovery_hash = 'lsha$' || s.salt || '$' ||
  encode(sha256(convert_to(s.salt || t.recovery_hash, 'UTF8')), 'hex')
from (
  select device_id, md5(random()::text || clock_timestamp()::text || device_id) as salt
  from savia_testers
  where recovery_hash ~ '^[0-9a-f]{64}$'
) s
where t.device_id = s.device_id;
