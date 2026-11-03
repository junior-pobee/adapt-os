create table if not exists public.workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

create index if not exists workspace_snapshots_owner_idx on public.workspace_snapshots(owner_id, updated_at desc);
alter table public.workspace_snapshots enable row level security;

create policy "Owners can read workspace snapshots" on public.workspace_snapshots for select using (auth.uid() = owner_id);
create policy "Owners can create workspace snapshots" on public.workspace_snapshots for insert with check (
  auth.uid() = owner_id and exists (
    select 1 from public.workspaces where workspaces.id = workspace_id and workspaces.owner_id = auth.uid()
  )
);
create policy "Owners can update workspace snapshots" on public.workspace_snapshots for update using (auth.uid() = owner_id) with check (
  auth.uid() = owner_id and exists (
    select 1 from public.workspaces where workspaces.id = workspace_id and workspaces.owner_id = auth.uid()
  )
);
