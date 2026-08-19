create table if not exists public.developer_plugins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null,
  provider text not null,
  capabilities jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  requires_connection boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_project_plugins (
  project_id uuid not null references public.developer_projects(id) on delete cascade,
  plugin_id uuid not null references public.developer_plugins(id) on delete cascade,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  connected_by uuid references auth.users(id) on delete set null,
  primary key (project_id, plugin_id)
);

insert into public.developer_plugins(slug,name,category,description,provider,capabilities,requires_connection) values
('github','GitHub','Code','Repositories, branches, commits, pull requests and CI workflows.','github','["read_repo","write_branch","commit","pull_request","actions"]',true),
('supabase','Supabase','Database','Postgres, Auth, Storage, Realtime, Edge Functions and database migrations.','supabase','["read_schema","sql","migrations","auth","storage","functions"]',true),
('vercel','Vercel','Deploy','Projects, deployments, domains, environment variables and production releases.','vercel','["preview","deploy","logs","domains","env"]',true),
('figma','Figma','Design','Design files, components, variables, screens and design-to-code workflows.','figma','["read_design","write_design","components","variables","screens"]',true),
('web-design','Web Design Tools','Design','Optional web design and prototyping tools connected by plugin adapters.','web-design','["prototype","assets","export"]',true)
on conflict (slug) do update set name=excluded.name,description=excluded.description,provider=excluded.provider,capabilities=excluded.capabilities,updated_at=now();

alter table public.developer_plugins enable row level security;
alter table public.developer_project_plugins enable row level security;

create policy "developers view plugins" on public.developer_plugins for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role in ('admin','developer')));
create policy "developers manage project plugins" on public.developer_project_plugins for all to authenticated
using (exists (select 1 from public.developer_projects dp join public.profiles p on p.id=auth.uid() where dp.id=developer_project_plugins.project_id and p.is_active and p.role in ('admin','developer')))
with check (exists (select 1 from public.developer_projects dp join public.profiles p on p.id=auth.uid() where dp.id=developer_project_plugins.project_id and p.is_active and p.role in ('admin','developer')));
