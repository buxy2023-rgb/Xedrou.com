-- International registration profile
-- Country is mandatory during registration completion and drives locale, currency and time zone defaults.

alter table if exists public.profiles
  add column if not exists country_code text,
  add column if not exists currency_code text,
  add column if not exists time_zone text,
  add column if not exists locale text;

alter table if exists public.user_profiles
  add column if not exists country_code text,
  add column if not exists currency_code text,
  add column if not exists time_zone text,
  add column if not exists locale text;

alter table if exists public.xedruo_users
  add column if not exists currency_code text,
  add column if not exists time_zone text,
  add column if not exists locale text;

create index if not exists idx_profiles_country_code on public.profiles(country_code);
create index if not exists idx_user_profiles_country_code on public.user_profiles(country_code);
create index if not exists idx_xedruo_users_country_code on public.xedruo_users(country_code);

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles drop constraint if exists profiles_country_code_format';
    execute 'alter table public.profiles add constraint profiles_country_code_format check (country_code is null or country_code ~ ''^[A-Z]{2}$'')';
  end if;
  if to_regclass('public.user_profiles') is not null then
    execute 'alter table public.user_profiles drop constraint if exists user_profiles_country_code_format';
    execute 'alter table public.user_profiles add constraint user_profiles_country_code_format check (country_code is null or country_code ~ ''^[A-Z]{2}$'')';
  end if;
  if to_regclass('public.xedruo_users') is not null then
    execute 'alter table public.xedruo_users drop constraint if exists xedruo_users_country_code_format';
    execute 'alter table public.xedruo_users add constraint xedruo_users_country_code_format check (country_code is null or country_code ~ ''^[A-Z]{2}$'')';
  end if;
end $$;
