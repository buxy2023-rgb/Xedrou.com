-- Xedruo Universal Identity
-- One permanent 10-digit public Xedruo ID per consumer across all Xedruo apps.
-- Phone number is the user's local account number. It is NOT the permanent identity.
-- Transaction PIN must never be stored in plaintext; use Supabase Auth/secure verification flows.

create extension if not exists "pgcrypto";

create table if not exists xedruo_users (
  id uuid primary key references auth.users(id) on delete cascade,
  xedruo_id varchar(10) not null unique,
  phone_account_number text not null unique,
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  display_name text,
  country_code text,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_xedruo_users_phone on xedruo_users(phone_account_number);

create or replace function generate_xedruo_id() returns varchar(10)
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate varchar(10);
begin
  loop
    candidate := lpad((floor(random() * 10000000000))::bigint::text, 10, '0');
    if candidate <> '0000000000' and not exists (select 1 from public.xedruo_users where xedruo_id = candidate) then
      return candidate;
    end if;
  end loop;
end;
$$;

alter table xedruo_users enable row level security;

drop policy if exists "xedruo_users_select_self" on xedruo_users;
create policy "xedruo_users_select_self" on xedruo_users
for select to authenticated using (id = auth.uid());

drop policy if exists "xedruo_users_update_self" on xedruo_users;
create policy "xedruo_users_update_self" on xedruo_users
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Company memberships are separate from universal consumer identity.
create table if not exists xedruo_company_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  role text not null check (role in ('staff','customer_service','accountant','developer','admin')),
  status text not null default 'pending' check (status in ('pending','active','suspended','revoked')),
  invited_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create index if not exists idx_xedruo_memberships_user on xedruo_company_memberships(user_id);
create index if not exists idx_xedruo_memberships_company on xedruo_company_memberships(company_id);

alter table xedruo_company_memberships enable row level security;

drop policy if exists "memberships_select_self" on xedruo_company_memberships;
create policy "memberships_select_self" on xedruo_company_memberships
for select to authenticated using (user_id = auth.uid());

-- Install any Xedruo app with an authenticated account and provision the universal identity once.
create or replace function provision_xedruo_user()
returns public.xedruo_users
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.xedruo_users;
  auth_phone text;
  auth_email_verified boolean;
  auth_phone_verified boolean;
  auth_display_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select u.phone, u.email_confirmed_at is not null, u.phone_confirmed_at is not null,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
    into auth_phone, auth_email_verified, auth_phone_verified, auth_display_name
  from auth.users u where u.id = auth.uid();

  if auth_phone is null or length(regexp_replace(auth_phone, '[^0-9+]', '', 'g')) < 7 then
    raise exception 'verified phone number is required to provision a Xedruo account number';
  end if;

  insert into public.xedruo_users (id, xedruo_id, phone_account_number, phone_verified, email_verified, display_name)
  values (
    auth.uid(),
    public.generate_xedruo_id(),
    regexp_replace(auth_phone, '[^0-9+]', '', 'g'),
    auth_phone_verified,
    auth_email_verified,
    auth_display_name
  )
  on conflict (id) do update set
    phone_account_number = excluded.phone_account_number,
    phone_verified = excluded.phone_verified,
    email_verified = excluded.email_verified,
    display_name = excluded.display_name,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function provision_xedruo_user() from public;
grant execute on function provision_xedruo_user() to authenticated;
