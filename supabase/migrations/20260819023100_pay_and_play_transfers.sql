create or replace function public.pay_play_transfer(
  p_sender_user_id uuid,
  p_recipient text,
  p_amount numeric,
  p_currency char(3),
  p_description text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sender public.pay_play_accounts;
  recipient public.pay_play_accounts;
  sender_balance public.pay_play_balances;
  recipient_balance public.pay_play_balances;
  recipient_id uuid;
  reference_base text;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be greater than zero'; end if;
  if p_currency is null or length(p_currency) <> 3 then raise exception 'currency is required'; end if;

  select * into sender from public.pay_play_accounts where user_id=p_sender_user_id and status='active' for update;
  if sender.id is null then raise exception 'sender Pay & Play account not found'; end if;
  if p_amount > sender.transfer_limit then raise exception 'transfer amount exceeds current account limit'; end if;

  select id into recipient_id
  from public.pay_play_accounts
  where xedruo_id = p_recipient or phone_account_number = regexp_replace(p_recipient,'[^0-9+]','','g')
  limit 1;
  if recipient_id is null then raise exception 'recipient is not a Xedruo Pay & Play account'; end if;
  if recipient_id = sender.id then raise exception 'sender and recipient must be different'; end if;
  select * into recipient from public.pay_play_accounts where id=recipient_id and status='active' for update;
  if recipient.id is null then raise exception 'recipient account is not active'; end if;

  select * into sender_balance from public.pay_play_balances where account_id=sender.id and currency=upper(p_currency) for update;
  if sender_balance.id is null then raise exception 'sender balance for this currency is not enabled'; end if;
  if sender_balance.balance < p_amount then raise exception 'insufficient balance'; end if;

  insert into public.pay_play_balances(account_id,currency,balance,is_primary,is_preferred)
  values(recipient.id,upper(p_currency),0,false,true)
  on conflict(account_id,currency) do nothing;
  select * into recipient_balance from public.pay_play_balances where account_id=recipient.id and currency=upper(p_currency) for update;

  update public.pay_play_balances set balance=balance-p_amount, updated_at=now() where id=sender_balance.id;
  update public.pay_play_balances set balance=balance+p_amount, updated_at=now() where id=recipient_balance.id;

  reference_base := 'XPP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));
  insert into public.pay_play_transactions(account_id,counterparty_account_id,transaction_type,direction,amount,currency,status,reference,description,metadata)
  values(sender.id,recipient.id,'transfer','debit',p_amount,upper(p_currency),'completed',reference_base||'-D',p_description,jsonb_build_object('channel','xedruo_internal','recipient_xedruo_id',recipient.xedruo_id));
  insert into public.pay_play_transactions(account_id,counterparty_account_id,transaction_type,direction,amount,currency,status,reference,description,metadata)
  values(recipient.id,sender.id,'receive','credit',p_amount,upper(p_currency),'completed',reference_base||'-C',p_description,jsonb_build_object('channel','xedruo_internal','sender_xedruo_id',sender.xedruo_id));

  return jsonb_build_object('status','completed','reference',reference_base,'amount',p_amount,'currency',upper(p_currency),'recipient_xedruo_id',recipient.xedruo_id);
end;
$$;

revoke all on function public.pay_play_transfer(uuid,text,numeric,char,text) from public;
grant execute on function public.pay_play_transfer(uuid,text,numeric,char,text) to service_role;
