create extension if not exists pgcrypto;

create table if not exists public.workforce_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('chief_of_staff','governor','developer','accountant','customer_service','staff')),
  company_slug text,
  password_hash text not null,
  password_salt text not null,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workforce_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.workforce_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workforce_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.workforce_accounts(id) on delete set null,
  action text not null,
  target_id uuid references public.workforce_accounts(id) on delete set null,
  company_slug text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workforce_sessions_token_idx on public.workforce_sessions(token_hash);
create index if not exists workforce_audit_actor_idx on public.workforce_audit_log(actor_id, created_at desc);

-- Initial executive accounts. Passwords are stored only as scrypt-derived hashes.
insert into public.workforce_accounts (username,display_name,role,password_hash,password_salt)
values
('Godwill','Godwill','chief_of_staff','oEz76OmICrHE35NUnAlhXrCb+4Gz6kyhs7XwoV7CUKwOVI46S0Y2aymfW06cZyazltdoFS/dqipH7mHJsXPYvw==','M/ILHgcwaJziLbEDu5AdyQ=='),
('miracle','Olowolafe Miracle','governor','TSuLBIvnIWX/ZUORYXOX5hR4QLgiKJ8ixUDScQlyzpA47K2F1RCSFnVp7qt+emisenYnWLMcMhw+gYi5MI7JGQ==','A+mpV8hd3pVuzFK6sZS4rg=='),
('blessing','Olowolafe Blessing','governor','UAO/NPJyvwTElsAh1JJpzUuK0iJRUECMtyJZNykuLxUaQvhM57e6VTA7AZQZ7OWLrI2ykT7oLaM+/abmduGncg==','57Yqis0Fi2tTFeUNe6GKRQ==')
on conflict (username) do update set display_name=excluded.display_name, role=excluded.role;

alter table public.workforce_accounts enable row level security;
alter table public.workforce_sessions enable row level security;
alter table public.workforce_audit_log enable row level security;

-- Workforce authentication and privileged management are server-side operations.
-- No direct client policy is granted; the service role is used by the API.
