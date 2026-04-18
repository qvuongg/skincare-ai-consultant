# Skincare AI Consultant

Next.js app with a clinical-style landing page, camera/upload skin scan, Gemini 1.5 Flash analysis, optional Supabase analytics, and an admin dashboard.

## Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/apikey) API key for Gemini
- A [Supabase](https://supabase.com) project (for scan logging, affiliate events, and admin login)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and fill in values:

   - `GOOGLE_GENERATIVE_AI_API_KEY` — required for `/api/analyze-skin`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase keys
   - `SUPABASE_SERVICE_ROLE_KEY` — used only on the server to insert rows into `skin_scans` and `affiliate_events` (keep secret)
   - `NEXT_PUBLIC_AFFILIATE_BASE` — prefix for placeholder product paths (replace with your affiliate store base URL)

3. **Database**

   Run the SQL in [`supabase/migrations/20250418000000_init.sql`](supabase/migrations/20250418000000_init.sql) in the Supabase SQL editor (or use the Supabase CLI to apply migrations).

4. **Admin user**

   - Create a user in **Authentication → Users** (or sign up via your app if you enable it).
   - In the user row, open **raw app metadata** and set:

     ```json
     { "role": "admin" }
     ```

     Do not rely on `user_metadata` for authorization.

5. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin) (sign in with the admin account).

## Analytics

- **Vercel Web Analytics** — enabled via `<Analytics />` in the root layout when deployed on Vercel (enable Analytics in the project dashboard).
- **Supabase** — stores `skin_scans` and `affiliate_events` for total scans, concern frequency, and affiliate impression/click CTR (see admin UI).

## Product links

Placeholder products live in [`src/lib/products/recommendations.json`](src/lib/products/recommendations.json). Replace entries and set `NEXT_PUBLIC_AFFILIATE_BASE` (or edit `buildAffiliateUrl` in [`src/lib/products/ingredient-mapping.ts`](src/lib/products/ingredient-mapping.ts)) when you have real affiliate URLs.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Start production   |
| `npm run lint` | ESLint             |
