-- User session saved drafts for catering orders.
-- Each row holds the full session state (cart items, planner inputs, checkout fields)
-- so customers can resume an in-progress order later. Anonymous drafts are scoped by
-- a client-generated anon_session_id (cookie/localStorage UUID); authenticated drafts
-- are scoped by user_id and managed by RLS. Anon access goes through API routes that
-- use the service role and validate the anon cookie.

create extension if not exists "uuid-ossp";

create table if not exists public.order_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_session_id uuid,
  name text not null default 'Untitled draft',
  state jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_drafts_owner_check check (user_id is not null or anon_session_id is not null)
);

create index if not exists order_drafts_user_id_idx
  on public.order_drafts(user_id)
  where user_id is not null;

create index if not exists order_drafts_anon_session_idx
  on public.order_drafts(anon_session_id)
  where anon_session_id is not null;

create index if not exists order_drafts_user_active_idx
  on public.order_drafts(user_id)
  where is_active = true and user_id is not null;

create index if not exists order_drafts_anon_active_idx
  on public.order_drafts(anon_session_id)
  where is_active = true and anon_session_id is not null;

-- updated_at auto-bump
create or replace function public.set_order_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists order_drafts_set_updated_at on public.order_drafts;
create trigger order_drafts_set_updated_at
before update on public.order_drafts
for each row execute function public.set_order_drafts_updated_at();

-- RLS: authenticated users manage their own rows. Anon rows are reachable only via
-- the service role (server-side API routes that validate the anon_session_id cookie).
alter table public.order_drafts enable row level security;

drop policy if exists order_drafts_user_select on public.order_drafts;
create policy order_drafts_user_select on public.order_drafts
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists order_drafts_user_insert on public.order_drafts;
create policy order_drafts_user_insert on public.order_drafts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists order_drafts_user_update on public.order_drafts;
create policy order_drafts_user_update on public.order_drafts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists order_drafts_user_delete on public.order_drafts;
create policy order_drafts_user_delete on public.order_drafts
  for delete to authenticated
  using (user_id = auth.uid());
