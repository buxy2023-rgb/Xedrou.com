create table if not exists public.developer_accounts (
  id uuid primary key,
  username text not null unique,
  display_name text not null,
  role text not null default 'developer',
  company_slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists developer_accounts_company_idx on public.developer_accounts(company_slug);
