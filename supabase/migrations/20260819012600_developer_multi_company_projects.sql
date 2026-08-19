create table if not exists public.developer_projects (
  id uuid primary key default gen_random_uuid(),
  company_id char(9) not null references public.companies(company_id) on delete cascade,
  slug text not null unique,
  name text not null,
  project_type text not null default 'company_platform',
  description text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  specification jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_project_members (
  project_id uuid not null references public.developer_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role text not null default 'developer' check (access_role in ('developer','lead','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists developer_projects_company_idx on public.developer_projects(company_id);
create index if not exists developer_project_members_user_idx on public.developer_project_members(user_id, status);

insert into public.developer_projects (company_id,slug,name,description)
select c.company_id,c.slug,c.name,'Developer project for advancing the ' || c.name || ' company platform.'
from public.companies c
where c.slug in ('xedruo-power-holdings','xedruo','sportruo','hireruo','adom','agruo','heathrou','xedruo-education','xedruo-capital','xedruo-energy','xedruo-logistics','xedruo-properties','spacetruo','xedruo-ai')
on conflict (slug) do update set company_id=excluded.company_id,name=excluded.name,description=excluded.description,updated_at=now();

alter table public.developer_projects enable row level security;
alter table public.developer_project_members enable row level security;

create policy "developers can view projects" on public.developer_projects
for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer')) or exists (select 1 from public.developer_project_members m where m.project_id=developer_projects.id and m.user_id=auth.uid() and m.status='active'));

create policy "developers can manage projects" on public.developer_projects
for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer')) or exists (select 1 from public.developer_project_members m where m.project_id=developer_projects.id and m.user_id=auth.uid() and m.status='active' and m.access_role in ('lead','admin')))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer')) or exists (select 1 from public.developer_project_members m where m.project_id=developer_projects.id and m.user_id=auth.uid() and m.status='active' and m.access_role in ('lead','admin')));

create policy "users can view project memberships" on public.developer_project_members
for select to authenticated
using (user_id=auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role='admin'));

create policy "admins manage project memberships" on public.developer_project_members
for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role='admin'));

create or replace function public.set_developer_projects_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists developer_projects_updated_at on public.developer_projects;
create trigger developer_projects_updated_at before update on public.developer_projects for each row execute function public.set_developer_projects_updated_at();
