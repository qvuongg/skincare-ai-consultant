-- =============================================================================
-- Migration: 20250421000000_schema.sql
-- Description: Creates the core application tables (products, leads, scan_stats)
--              with proper Row Level Security (RLS) policies.
--
-- RLS contract:
--   - products    → public read (anon + authenticated), admin write
--   - leads       → admin only (read/write via service role; no public policy)
--   - scan_stats  → admin only (read/write via service role; no public policy)
--
-- "Admin" is determined by app_metadata.role = 'admin' set in the Supabase
-- dashboard or via the Auth Admin API on the user record.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  brand            text        not null,
  key_ingredients  text[]      not null default '{}',
  skin_type_tags   text[]      not null default '{}',
  price_range      text        not null check (price_range in ('budget', 'mid', 'premium')),
  category         text        not null check (category in ('cleanser', 'treatment', 'moisturizer', 'sunscreen')),
  image_url        text,
  affiliate_url    text,
  tagline          text,
  rating           numeric(2, 1) check (rating >= 0 and rating <= 5),
  created_at       timestamptz not null default now()
);

comment on table public.products is 'Skincare product catalogue with affiliate links.';

-- Useful indexes for common query patterns
create index if not exists products_brand_idx        on public.products (brand);
create index if not exists products_price_range_idx  on public.products (price_range);
create index if not exists products_category_idx     on public.products (category);
-- GIN indexes for array columns (skin_type_tags / key_ingredients lookups)
create index if not exists products_skin_type_tags_gin on public.products using gin (skin_type_tags);
create index if not exists products_key_ingredients_gin on public.products using gin (key_ingredients);

-- RLS
alter table public.products enable row level security;

-- Everyone (including anonymous visitors) can read products
create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only admins can insert / update / delete products
create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using  (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ---------------------------------------------------------------------------
-- 2. leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  contact_info        text        not null,        -- email or phone
  skin_type_detected  text        not null,
  primary_goal        text        not null,
  raw_data            jsonb,                       -- optional: full onboarding payload
  created_at          timestamptz not null default now()
);

comment on table public.leads is 'User leads collected during the onboarding flow.';

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- RLS — no public policies; all access goes through the service role (admin client)
alter table public.leads enable row level security;

-- Authenticated admins can read leads
create policy "Admins can read leads"
  on public.leads for select
  to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ---------------------------------------------------------------------------
-- 3. scan_stats
-- ---------------------------------------------------------------------------
create table if not exists public.scan_stats (
  id                uuid        primary key default gen_random_uuid(),
  detected_concerns text[]      not null default '{}',
  timestamp         timestamptz not null default now()
);

comment on table public.scan_stats is 'Anonymous logs of skin-scan concern detections for usage analytics.';

create index if not exists scan_stats_timestamp_idx on public.scan_stats (timestamp desc);
create index if not exists scan_stats_concerns_gin  on public.scan_stats using gin (detected_concerns);

-- RLS — no public policies; all writes go through the service role (admin client)
alter table public.scan_stats enable row level security;

-- Authenticated admins can read scan stats
create policy "Admins can read scan_stats"
  on public.scan_stats for select
  to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
