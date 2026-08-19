-- Xedruo Pay & Play foundation
-- Universal account + multi-currency wallet + service connections + music commerce.
-- External bank/card/flight/ride/investment rails remain provider adapters; this schema is the internal ledger and orchestration layer.

create extension if not exists "pgcrypto";

create table if not exists public.pay_play_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  xedruo_id varchar(10) not null unique references public.xedruo_users(xedruo_id),
  phone_account_number text not null unique,
  primary_currency char(3) not null default 'NGN',
  kyc_status text not null default 'unverified' check (kyc_status in ('unverified','pending','verified','rejected')),
  tier text not null default 'starter' check (tier in ('starter','verified','enhanced')),
  transfer_limit numeric(20,2) not null default 250000,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pay_play_balances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  currency char(3) not null,
  balance numeric(20,2) not null default 0,
  is_primary boolean not null default false,
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,currency)
);

create unique index if not exists pay_play_one_primary_currency on public.pay_play_balances(account_id) where is_primary;

create table if not exists public.pay_play_service_connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  company_slug text not null,
  company_name text not null,
  service_account_number text not null unique,
  company_registration_number text not null,
  status text not null default 'active' check (status in ('active','pending','suspended','closed')),
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  unique(account_id,company_slug)
);

create table if not exists public.pay_play_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  counterparty_account_id uuid references public.pay_play_accounts(id) on delete set null,
  transaction_type text not null check (transaction_type in ('transfer','receive','deposit','withdrawal','bill','card','service','ticket','store','booking','subscription','investment')),
  direction text not null check (direction in ('credit','debit')),
  amount numeric(20,2) not null check (amount > 0),
  currency char(3) not null,
  status text not null default 'pending' check (status in ('pending','completed','failed','reversed','pending_external')),
  reference text not null unique,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pay_play_transactions_account_idx on public.pay_play_transactions(account_id,created_at desc);

create table if not exists public.pay_play_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  company_slug text not null,
  service_type text not null check (service_type in ('ride','flight','invest','card','bill','music_ticket','artist_booking','artist_store','subscription','other')),
  title text not null,
  amount numeric(20,2) not null default 0,
  currency char(3) not null,
  status text not null default 'requested' check (status in ('requested','processing','confirmed','completed','cancelled','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pay_play_music_bookings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  artist_id text not null,
  artist_name text not null,
  booking_kind text not null check (booking_kind in ('ticket','show','party','feature','appearance')),
  event_date date,
  venue text,
  quantity integer not null default 1 check (quantity > 0),
  amount numeric(20,2) not null default 0,
  currency char(3) not null,
  status text not null default 'requested' check (status in ('requested','confirmed','cancelled','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.pay_play_kyc_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  document_type text,
  country_code text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  notes text
);

create table if not exists public.pay_play_cards (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  card_type text not null default 'virtual' check (card_type in ('virtual','physical')),
  last4 char(4),
  status text not null default 'requested' check (status in ('requested','active','frozen','closed')),
  provider_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.pay_play_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  company_slug text not null,
  plan_name text not null,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  next_billing_at timestamptz,
  created_at timestamptz not null default now(),
  unique(account_id,company_slug,plan_name)
);

create table if not exists public.pay_play_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.pay_play_accounts(id) on delete cascade,
  title text not null,
  message text not null,
  category text not null default 'system',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pay_play_notifications_account_idx on public.pay_play_notifications(account_id,created_at desc);

alter table public.pay_play_accounts enable row level security;
alter table public.pay_play_balances enable row level security;
alter table public.pay_play_service_connections enable row level security;
alter table public.pay_play_transactions enable row level security;
alter table public.pay_play_orders enable row level security;
alter table public.pay_play_music_bookings enable row level security;
alter table public.pay_play_kyc_requests enable row level security;
alter table public.pay_play_cards enable row level security;
alter table public.pay_play_subscriptions enable row level security;
alter table public.pay_play_notifications enable row level security;

create policy "pay play account self" on public.pay_play_accounts for select to authenticated using (user_id = auth.uid());
create policy "pay play balances self" on public.pay_play_balances for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play connections self" on public.pay_play_service_connections for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play transactions self" on public.pay_play_transactions for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play orders self" on public.pay_play_orders for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play music self" on public.pay_play_music_bookings for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play kyc self" on public.pay_play_kyc_requests for all to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid())) with check (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play cards self" on public.pay_play_cards for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play subscriptions self" on public.pay_play_subscriptions for select to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));
create policy "pay play notifications self" on public.pay_play_notifications for all to authenticated using (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid())) with check (exists(select 1 from public.pay_play_accounts a where a.id=account_id and a.user_id=auth.uid()));

create or replace function public.pay_play_main_currency(p_country_code text) returns char(3)
language sql immutable as $$
  select case upper(coalesce(p_country_code,''))
    when 'US' then 'USD' when 'CA' then 'CAD' when 'GB' then 'GBP' when 'IE' then 'EUR'
    when 'DE' then 'EUR' when 'FR' then 'EUR' when 'ES' then 'EUR' when 'IT' then 'EUR'
    when 'NG' then 'NGN' when 'GH' then 'GHS' when 'KE' then 'KES' when 'ZA' then 'ZAR'
    when 'IN' then 'INR' when 'AE' then 'AED' when 'AU' then 'AUD'
    else 'USD' end;
$$;

create or replace function public.provision_pay_play_account(
  p_user_id uuid,
  p_phone text,
  p_country_code text default 'NG',
  p_company_slug text default 'pay-and-play',
  p_company_name text default 'Pay & Play'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text;
  identity public.xedruo_users;
  account public.pay_play_accounts;
  main_currency char(3);
  service_number text;
  registration_number text;
  preferred text[] := array['USD','EUR','GBP'];
  c text;
  i integer;
begin
  if p_user_id is null then raise exception 'user id is required'; end if;
  normalized_phone := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
  if length(normalized_phone) < 7 then raise exception 'valid phone number is required'; end if;
  main_currency := public.pay_play_main_currency(p_country_code);

  select * into identity from public.xedruo_users where id=p_user_id for update;
  if identity.id is null then
    insert into public.xedruo_users(id,xedruo_id,phone_account_number,phone_verified,email_verified,display_name,country_code)
    select p_user_id, public.generate_xedruo_id(), normalized_phone, true, u.email_confirmed_at is not null,
           coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email), upper(p_country_code)
    from auth.users u where u.id=p_user_id
    returning * into identity;
  else
    update public.xedruo_users set phone_account_number=normalized_phone, phone_verified=true, country_code=upper(p_country_code), updated_at=now() where id=p_user_id returning * into identity;
  end if;

  insert into public.pay_play_accounts(user_id,xedruo_id,phone_account_number,primary_currency)
  values(p_user_id,identity.xedruo_id,normalized_phone,main_currency)
  on conflict(user_id) do update set phone_account_number=excluded.phone_account_number, primary_currency=excluded.primary_currency, updated_at=now()
  returning * into account;

  insert into public.pay_play_balances(account_id,currency,balance,is_primary,is_preferred)
  values(account.id,main_currency,0,true,false)
  on conflict(account_id,currency) do update set is_primary=true,is_preferred=false;

  i:=0;
  foreach c in array preferred loop
    if c <> main_currency then
      i:=i+1;
      insert into public.pay_play_balances(account_id,currency,balance,is_primary,is_preferred)
      values(account.id,c,0,false,true)
      on conflict(account_id,currency) do update set is_preferred=true;
      if i >= 3 then exit; end if;
    end if;
  end loop;

  registration_number := 'XPP-' || upper(left(regexp_replace(coalesce(p_company_slug,'PAY'), '[^A-Za-z0-9]','','g'),8)) || '-' || lpad((floor(random()*1000000))::bigint::text,6,'0');
  service_number := 'XPP-' || identity.xedruo_id || '-' || lpad((floor(random()*100000))::bigint::text,5,'0');
  insert into public.pay_play_service_connections(account_id,company_slug,company_name,service_account_number,company_registration_number)
  values(account.id,p_company_slug,p_company_name,service_number,registration_number)
  on conflict(account_id,company_slug) do nothing;

  insert into public.pay_play_subscriptions(account_id,company_slug,plan_name)
  values(account.id,p_company_slug,'standard')
  on conflict(account_id,company_slug,plan_name) do nothing;

  insert into public.pay_play_notifications(account_id,title,message,category)
  values(account.id,'Xedruo Pay & Play is ready','Your Xedruo Pay & Play account has been created. Use your phone number or Xedruo ID for Xedruo transfers. Complete KYC later to increase limits.','system');

  return jsonb_build_object('account_id',account.id,'xedruo_id',identity.xedruo_id,'phone_account_number',normalized_phone,'primary_currency',main_currency,'kyc_status',account.kyc_status,'tier',account.tier);
end;
$$;

revoke all on function public.provision_pay_play_account(uuid,text,text,text,text) from public;
grant execute on function public.provision_pay_play_account(uuid,text,text,text,text) to service_role;
