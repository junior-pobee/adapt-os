create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My ADAPT OS Workspace',
  default_locale text not null default 'en',
  default_currency char(3) not null default 'GHS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category text not null default 'General',
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount numeric(18, 2) not null check (amount > 0),
  currency char(3) not null,
  occurred_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists ledger_transactions_owner_date_idx on public.ledger_transactions(owner_id, occurred_on desc);
create index if not exists ledger_transactions_workspace_idx on public.ledger_transactions(workspace_id, occurred_on desc);

alter table public.workspaces enable row level security;
alter table public.ledger_transactions enable row level security;

create policy "Workspace owners can read their workspaces" on public.workspaces for select using (auth.uid() = owner_id);
create policy "Workspace owners can create their workspaces" on public.workspaces for insert with check (auth.uid() = owner_id);
create policy "Workspace owners can update their workspaces" on public.workspaces for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can read their ledger transactions" on public.ledger_transactions for select using (auth.uid() = owner_id);
create policy "Owners can create their ledger transactions" on public.ledger_transactions for insert with check (
  auth.uid() = owner_id and exists (
    select 1 from public.workspaces where workspaces.id = workspace_id and workspaces.owner_id = auth.uid()
  )
);
create policy "Owners can update their ledger transactions" on public.ledger_transactions for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can delete their ledger transactions" on public.ledger_transactions for delete using (auth.uid() = owner_id);
