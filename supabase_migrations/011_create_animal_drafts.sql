-- Create animal_drafts table for pre-cadastro de animais
create table if not exists public.animal_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','ready')),
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 month')
);

-- Updated at trigger
create trigger trg_animal_drafts_updated_at
before update on public.animal_drafts
for each row execute function public.update_updated_at_column();

-- Indexes
create index if not exists idx_animal_drafts_user on public.animal_drafts(user_id);
create index if not exists idx_animal_drafts_expires on public.animal_drafts(expires_at);

-- RLS
alter table public.animal_drafts enable row level security;

-- Policies: owner-only access (compatível com versões sem IF NOT EXISTS)
drop policy if exists animal_drafts_select_own on public.animal_drafts;
create policy animal_drafts_select_own
  on public.animal_drafts for select
  using (auth.uid() = user_id);

drop policy if exists animal_drafts_insert_own on public.animal_drafts;
create policy animal_drafts_insert_own
  on public.animal_drafts for insert
  with check (auth.uid() = user_id);

drop policy if exists animal_drafts_update_own on public.animal_drafts;
create policy animal_drafts_update_own
  on public.animal_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists animal_drafts_delete_own on public.animal_drafts;
create policy animal_drafts_delete_own
  on public.animal_drafts for delete
  using (auth.uid() = user_id);


