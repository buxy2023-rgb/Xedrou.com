alter table public.workforce_accounts
  add column if not exists google_email text;

create unique index if not exists workforce_accounts_google_email_idx
  on public.workforce_accounts (lower(google_email))
  where google_email is not null;

comment on column public.workforce_accounts.google_email is
  'Verified Google Workspace identity email allowed to sign into this workforce account.';
