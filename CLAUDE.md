# CLAUDE.md for Skincare AI Consultant

This file provides context and guidelines for Claude Code to assist with the Skincare AI Consultant project.

## Build and Lint Commands
- Dev server: `npm run dev`
- Build project: `npm run build`
- Linting: `npm run lint`
- Type checking: `npx tsc --noEmit`

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database/Auth**: Supabase
- **AI Engine**: Google Generative AI (Gemini)
- **UI Components**: Radix UI, Lucide React, Framer Motion

## Coding Guidelines
- **Components**: Use React Server Components by default; use `'use client'` only when necessary.
- **Styling**: Use Tailwind CSS utility classes. Follow the established design system (premium, modern aesthetics).
- **Types**: Use strict TypeScript types. Define interfaces for API responses and component props.
- **AI Logic**: Centralize Gemini logic in `src/lib/gemini/`. Use Zod for schema validation.
- **Naming**: Use PascalCase for components and camelCase for functions/variables.
- **File Structure**: 
  - `src/app`: Routes and pages
  - `src/components`: Reusable UI elements
  - `src/lib`: Utility functions and external API integrations
  - `supabase`: Database migrations and types
- **Always act as a Senior Technical Architect and UI/UX Designer**. Focus on Antigravity UI standards and system modularity.

## API and Environment
- Environment variables are managed in `.env.local`.
- Supabase types should be kept in sync with the database schema.


