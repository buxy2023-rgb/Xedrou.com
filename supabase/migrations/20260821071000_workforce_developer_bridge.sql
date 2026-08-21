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
create or replace function public.bridge_workforce_developer() returns trigger language plpgsql security definer as $$
begin
  if new.role='developer' then
    insert into public.developer_accounts(id,username,display_name,role,company_slug,is_active)
    values(new.id,new.username,new.display_name,'developer',coalesce(new.company_slug,''),new.is_active)
    on conflict (id) do update set username=excluded.username,display_name=excluded.display_name,company_slug=excluded.company_slug,is_active=excluded.is_active;
  end if;
  return new;
end $$;
drop trigger if exists workforce_developer_bridge on public.workforce_accounts;
create trigger workforce_developer_bridge after insert or update of username,display_name,role,company_slug,is_active on public.workforce_accounts for each row execute function public.bridge_workforce_developer();
