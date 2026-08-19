create or replace function public.pay_play_company_name(p_slug text) returns text
language sql immutable as $$
  select case lower(coalesce(p_slug,''))
    when 'pay-and-play' then 'Pay & Play'
    when 'sportruo' then 'Sportruo'
    when 'hireuo' then 'Hireuo'
    when 'adom' then 'Adom'
    when 'agruo' then 'Agruo'
    when 'healthruo' then 'Healthruo'
    when 'xedruo-education' then 'Xedruo Education'
    when 'xedruo-capital' then 'Xedruo Capital'
    when 'xedruo-energy' then 'Xedruo Energy'
    when 'xedruo-logistics' then 'Xedruo Logistics'
    when 'xedruo-properties' then 'Xedruo Properties'
    when 'spacetruo' then 'Spacetruo'
    when 'enit-ai' then 'Enit AI'
    when 'xedruo' then 'Xedruo'
    else initcap(replace(coalesce(p_slug,''),'-',' ')) end;
$$;

create or replace function public.auto_connect_pay_play_for_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  identity public.xedruo_users;
  phone text;
  country text;
begin
  select * into identity from public.xedruo_users where id=new.user_id;
  if identity.id is null or identity.phone_account_number is null then
    return new;
  end if;
  phone := identity.phone_account_number;
  country := coalesce(identity.country_code,'NG');
  perform public.provision_pay_play_account(new.user_id,phone,country,new.company_id,public.pay_play_company_name(new.company_id));
  return new;
exception when others then
  raise warning 'Pay & Play auto-connect skipped for %: %', new.user_id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_auto_connect_pay_play on public.xedruo_company_memberships;
create trigger trg_auto_connect_pay_play
after insert on public.xedruo_company_memberships
for each row execute function public.auto_connect_pay_play_for_membership();
