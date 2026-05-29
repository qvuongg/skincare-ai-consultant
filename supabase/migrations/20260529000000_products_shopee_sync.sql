-- =============================================================================
-- Migration: 20260529000000_products_shopee_sync.sql
-- Description:
--   Pivots `products` from coarse `price_range` buckets + single `affiliate_url`
--   to real VND pricing with per-channel affiliate URLs and Shopee Marketing
--   API auto-sync metadata.
--
--   Changes:
--   - DROP `price_range` (bucket derived from `price_vnd` in code per SPEC §5.2)
--   - DROP `affiliate_url` (replaced by `shopee_url` / `lazada_url` / `tiki_url`)
--   - ADD `price_vnd` (int, real Shopee price in đồng)
--   - ADD per-channel URLs
--   - ADD sync metadata: `shopee_product_id`, `price_synced_at`, `sync_status`
--   - ADD `updated_at` + auto-update trigger
--   - Wipes existing rows + seeds 8 realistic Vietnamese-market products
--     (no shopee_product_id — admin fills in via UI once they have the IDs)
--
-- Notes:
--   - `price_vnd` is NOT NULL with a check >= 0. Safe because we DELETE first.
--   - `shopee_product_id` is nullable: products without it are skipped by
--     the cron sync job.
--   - `sync_status`: 'ok' = price fresh, 'stale' = >7 days since last sync,
--     'failed' = last sync attempt errored. Set by the cron worker.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Wipe existing data (per product spec — admin will reseed)
-- ---------------------------------------------------------------------------
delete from public.products;

-- ---------------------------------------------------------------------------
-- 2. Drop deprecated columns + their indexes
-- ---------------------------------------------------------------------------
drop index if exists public.products_price_range_idx;

alter table public.products
  drop column if exists price_range,
  drop column if exists affiliate_url;

-- ---------------------------------------------------------------------------
-- 3. Add new columns
-- ---------------------------------------------------------------------------
alter table public.products
  add column price_vnd          int         not null check (price_vnd >= 0),
  add column shopee_url         text,
  add column lazada_url         text,
  add column tiki_url           text,
  add column shopee_product_id  text,
  add column price_synced_at    timestamptz,
  add column sync_status        text        not null default 'ok'
    check (sync_status in ('ok','stale','failed')),
  add column updated_at         timestamptz not null default now();

comment on column public.products.price_vnd is
  'Shopee display price in Vietnamese đồng. Synced daily by /api/cron/sync-shopee-prices.';
comment on column public.products.shopee_product_id is
  'Shopee item ID (e.g. "i.123456.789012"). Required for auto-sync; null = manual-only product.';
comment on column public.products.sync_status is
  '''ok'' fresh, ''stale'' >7d since last sync, ''failed'' last sync errored. Surface as badge on report.';

-- ---------------------------------------------------------------------------
-- 4. New indexes
-- ---------------------------------------------------------------------------
create index products_price_vnd_idx
  on public.products (price_vnd);

-- Partial: only products eligible for sync hit the cron job
create index products_shopee_product_id_idx
  on public.products (shopee_product_id)
  where shopee_product_id is not null;

create index products_sync_status_idx
  on public.products (sync_status);

-- ---------------------------------------------------------------------------
-- 5. Auto-update updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Seed data — 8 realistic Vietnamese-market products
-- ---------------------------------------------------------------------------
-- price_vnd values are approximations from Shopee VN as of 2026-05.
-- shopee_product_id is null on seed; admin populates via UI once they have
-- the affiliate item IDs. Cron sync skips rows where shopee_product_id is null.

insert into public.products
  (name, brand, key_ingredients, skin_type_tags, category, price_vnd,
   image_url, shopee_url, lazada_url, tiki_url, tagline, rating)
values
  -- ── Cleansers ─────────────────────────────────────────────────────────
  ('Foaming Facial Cleanser',
   'CeraVe',
   array['Ceramides','Hyaluronic Acid','Niacinamide'],
   array['Oily','Combination','Acne-prone'],
   'cleanser',
   280000,
   null,
   'https://shopee.vn/cerave-foaming-cleanser',
   null, null,
   'Sữa rửa mặt tạo bọt cho da dầu, làm sạch sâu mà không gây khô.',
   4.7),

  ('Gentle Skin Cleanser',
   'Cetaphil',
   array['Glycerin','Panthenol'],
   array['Dry','Sensitive','All'],
   'cleanser',
   215000,
   null,
   'https://shopee.vn/cetaphil-gentle-cleanser',
   null, null,
   'Sữa rửa mặt non-foaming dịu nhẹ, pH cân bằng cho da nhạy cảm.',
   4.6),

  -- ── Treatments ────────────────────────────────────────────────────────
  ('Niacinamide 10% + Zinc 1%',
   'The Ordinary',
   array['Niacinamide','Zinc PCA'],
   array['Oily','Acne-prone','Combination'],
   'treatment',
   285000,
   null,
   'https://shopee.vn/the-ordinary-niacinamide-10',
   null, null,
   'Serum giảm lỗ chân lông, kiểm soát dầu và làm mờ thâm sau mụn.',
   4.5),

  ('Skin Perfecting 2% BHA Liquid Exfoliant',
   'Paula''s Choice',
   array['Salicylic Acid','Green Tea'],
   array['Oily','Acne-prone','Combination'],
   'treatment',
   720000,
   null,
   'https://shopee.vn/paulas-choice-2-bha',
   null, null,
   'Tẩy tế bào chết hoá học BHA 2%, thông thoáng lỗ chân lông, giảm mụn ẩn.',
   4.8),

  -- ── Moisturizers ──────────────────────────────────────────────────────
  ('Moisturizing Cream',
   'CeraVe',
   array['Ceramides','Hyaluronic Acid','Cholesterol'],
   array['Dry','Normal','Sensitive','All'],
   'moisturizer',
   395000,
   null,
   'https://shopee.vn/cerave-moisturizing-cream',
   null, null,
   'Kem dưỡng ẩm phục hồi hàng rào da với 3 loại ceramide thiết yếu.',
   4.7),

  ('Toleriane Sensitive Fluide',
   'La Roche-Posay',
   array['Niacinamide','Prebiotic Thermal Water'],
   array['Sensitive','Combination','All'],
   'moisturizer',
   460000,
   null,
   'https://shopee.vn/lrp-toleriane-sensitive',
   null, null,
   'Kem dưỡng mỏng nhẹ cho da nhạy cảm, không gây kích ứng.',
   4.6),

  -- ── Sunscreens ────────────────────────────────────────────────────────
  ('Perfect UV Sunscreen Skincare Milk SPF50+ PA++++',
   'Anessa',
   array['SPF50+','PA++++','Hyaluronic Acid','Collagen'],
   array['All','Combination','Normal'],
   'sunscreen',
   545000,
   null,
   'https://shopee.vn/anessa-perfect-uv-milk',
   null, null,
   'Kem chống nắng SPF50+ PA++++, kết cấu sữa lỏng thấm nhanh, kháng nước.',
   4.9),

  ('Aloe Soothing Sun Cream SPF50+ PA+++',
   'COSRX',
   array['SPF50+','PA+++','Aloe Vera','Hyaluronic Acid'],
   array['Sensitive','Dry','All'],
   'sunscreen',
   180000,
   null,
   'https://shopee.vn/cosrx-aloe-soothing-sun',
   null, null,
   'Kem chống nắng dịu nhẹ với chiết xuất nha đam, phù hợp da nhạy cảm.',
   4.4);
