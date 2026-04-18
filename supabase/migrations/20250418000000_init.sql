create extension if not exists "pgcrypto";

create table public.skin_scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  concerns text[] not null default '{}'
);

create table public.affiliate_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('impression', 'click')),
  product_id text not null,
  category text not null,
  scan_id uuid references public.skin_scans (id) on delete set null
);

create index affiliate_events_created_at_idx on public.affiliate_events (created_at desc);
create index affiliate_events_type_idx on public.affiliate_events (event_type);

alter table public.skin_scans enable row level security;
alter table public.affiliate_events enable row level security;

create policy "Admins can read skin_scans"
  on public.skin_scans for select
  to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'role'), '') = 'admin');

create policy "Admins can read affiliate_events"
  on public.affiliate_events for select
  to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'role'), '') = 'admin');
