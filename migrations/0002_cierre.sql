-- Cierre: profiles, services, quotes, waitlist
create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  business_name text not null default '',
  handle text unique,
  tagline text not null default '',
  bio text not null default '',
  whatsapp text not null default '',
  email_public text not null default '',
  currency text not null default 'USD',
  locale text not null default 'es',
  payment_notes text not null default '',
  payment_link text not null default '',
  onboarding_done boolean not null default false,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id serial primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  unit text not null default 'proyecto',
  price numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists services_user_id_idx on services (user_id);

create table if not exists quotes (
  id serial primary key,
  user_id text not null,
  public_id text not null unique,
  status text not null default 'draft',
  client_name text not null default '',
  client_contact text not null default '',
  title text not null default '',
  intro text not null default '',
  items jsonb not null default '[]',
  notes text not null default '',
  terms text not null default '',
  currency text not null default 'USD',
  tax_pct numeric not null default 0,
  total numeric not null default 0,
  valid_until date,
  whatsapp_message text not null default '',
  accepted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_user_id_idx on quotes (user_id);
create index if not exists quotes_public_id_idx on quotes (public_id);
create index if not exists quotes_user_created_idx on quotes (user_id, created_at desc);

create table if not exists waitlist (
  id serial primary key,
  user_id text,
  email text not null,
  plan text not null default 'pro',
  created_at timestamptz not null default now()
);
