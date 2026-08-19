create table if not exists public.company_domains (
  id uuid primary key default gen_random_uuid(),
  company_id char(9) not null references public.companies(company_id) on delete cascade,
  project_id uuid references public.developer_projects(id) on delete cascade,
  domain text not null,
  normalized_domain text not null unique,
  domain_type text not null default 'custom' check (domain_type in ('custom','www','apex','subdomain')),
  status text not null default 'pending' check (status in ('pending','verifying','verified','active','failed','removed')),
  verification_token text not null,
  verification_method text not null default 'dns_txt' check (verification_method in ('dns_txt','dns_cname')),
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists company_domains_company_idx on public.company_domains(company_id,status);
create index if not exists company_domains_project_idx on public.company_domains(project_id,status);
alter table public.company_domains enable row level security;
create policy "company domains admin only" on public.company_domains for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer')));
create or replace function public.set_company_domains_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists company_domains_updated_at on public.company_domains;
create trigger company_domains_updated_at before update on public.company_domains for each row execute function public.set_company_domains_updated_at();
