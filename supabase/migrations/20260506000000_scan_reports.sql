-- =============================================================================
-- Migration: 20260506000000_scan_reports.sql
-- Description:
--   1. Extends `leads` with the demographic fields required by SPEC §5.A
--      (age_group, gender). Both nullable because the current onboarding
--      flow does not yet capture them — they'll be populated once the
--      onboarding form catches up to SPEC §12.1.
--   2. Creates `scan_reports`, the durable record of every Skin Scan run:
--      the 11 AI metrics from §6.B, the lifestyle modifier breakdown from
--      §7.B, and the post-modifier composite score + band from §7.A/7.C.
--      Mirrors the API contract in §12.2.
--
-- RLS contract:
--   - leads        → unchanged (admin-read, service-role write)
--   - scan_reports → admin-read, service-role write (same as leads)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend leads with onboarding demographics (SPEC §5.A · A2 / A1 gender)
-- ---------------------------------------------------------------------------
-- Both columns are nullable on purpose:
--   - existing rows pre-date these fields
--   - the current /api/onboarding handler doesn't yet capture them
-- Engine treats `null` as "no modifier applies" — see §7.B sunscreen rule
-- which only fires when `age_group ∈ {25-34, 35-44, 45-54, 55+}`.

alter table public.leads
  add column if not exists age_group text,
  add column if not exists gender    text;

-- Enums mirror SPEC §12.1 onboarding payload exactly, so values flow
-- through the API → DB without translation.
alter table public.leads
  drop constraint if exists leads_age_group_check;
alter table public.leads
  add  constraint leads_age_group_check
  check (age_group is null
         or age_group in ('13-17','18-24','25-34','35-44','45-54','55+'));

alter table public.leads
  drop constraint if exists leads_gender_check;
alter table public.leads
  add  constraint leads_gender_check
  check (gender is null
         or gender in ('female','male','prefer_not_to_say'));

-- ---------------------------------------------------------------------------
-- 2. scan_reports
-- ---------------------------------------------------------------------------
-- `lead_id` is nullable + ON DELETE SET NULL: the existing onboarding flow
-- doesn't return a lead_id to the client, so until that's plumbed through
-- some scans will be unattached. Setting NULL on lead deletion keeps the
-- analytics history intact even if a lead is purged for privacy.

create table if not exists public.scan_reports (
  id                  uuid        primary key default gen_random_uuid(),
  lead_id             uuid        references public.leads (id) on delete set null,

  -- 11 physiological metrics + per-zone scores per §6.B. Stored as raw
  -- JSONB so we don't have to migrate the table every time the AI schema
  -- evolves. Engine layer enforces shape via Zod.
  ai_metrics          jsonb       not null,

  -- Array of { factor, value, modifier_value, metric_affected, message }
  -- — the xAI breakdown surfaced in the report (SPEC §12.2).
  lifestyle_modifiers jsonb       not null default '[]'::jsonb,

  -- Final composite score AFTER lifestyle modifiers + clamp(0,100).
  overall_score       int         not null
                         check (overall_score between 0 and 100),

  -- Band labels from §7.C — kept as text + check rather than an enum so
  -- adding a new band (e.g. for a future tier) is a one-line constraint
  -- swap, not an ALTER TYPE.
  score_band          text        not null
                         check (score_band in
                           ('critical','poor','fair','good','excellent')),

  -- Routine engine is Phase 2 — column exists for forward-compat but stays
  -- nullable; populated when §9 routine engine ships.
  recommended_routine jsonb,

  created_at          timestamptz not null default now()
);

comment on table public.scan_reports is
  'Skin scan output: 11 physiological metrics, capped lifestyle modifiers, post-modifier composite score + band, and the (future) routine recommendation. Mirrors the §7 scoring pipeline and §12.2 API contract.';

create index if not exists scan_reports_lead_id_idx
  on public.scan_reports (lead_id);
create index if not exists scan_reports_created_at_idx
  on public.scan_reports (created_at desc);
create index if not exists scan_reports_score_band_idx
  on public.scan_reports (score_band);

-- RLS — mirror the leads contract. Service role bypasses RLS for inserts
-- (we never expose write policies to logged-in users), and only admin JWTs
-- may select via the dashboard.
alter table public.scan_reports enable row level security;

create policy "Admins can read scan_reports"
  on public.scan_reports for select
  to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
