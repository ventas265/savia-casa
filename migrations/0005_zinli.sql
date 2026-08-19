create table if not exists savia_settings (
  key text primary key,
  value text not null default ''
);

create table if not exists savia_payments (
  id serial primary key,
  email text not null,
  plan text not null,
  amount numeric not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
