# AI Ready

## Purpose

This file helps future AI/Codex sessions continue NoProblemo without rebuilding, duplicating work, or losing product direction.

## Read Order

1. `CURRENT_STATE.md`
2. `docs/CODEX_PROJECT_MAP.md`
3. `AGENTS.md`
4. The task-specific docs, such as `DATABASE_SCHEMA.md`, `SECURITY.md`, or `UX_UI_GUIDE.md`
5. Relevant installed Next.js docs in `node_modules/next/dist/docs/`

## Decisions Already Made

- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS.
- Use `next-intl` and locale-prefixed routes.
- Use Supabase for authentication, database, and row-level security.
- Use the Phase 4 migration and RLS foundation as the starting point for future saved data work.
- Deploy on Vercel.
- Use Domeneshop mainly for domain and DNS.
- Keep UI minimalistic, calm, professional, and responsive.
- Keep guest work local until a future explicit save/import flow is implemented.
- Do not automatically translate user-generated content.

## Must Not Change Without A Clear Reason

- Supported locale list and default locale.
- RTL handling for `ar` and `ur`.
- Guest localStorage key unless a migration plan is included.
- Current route structure unless a phase explicitly changes it.
- Phase 4 database schema/RLS without a migration plan.
- Security guardrails around `.env.local`, Supabase service role keys, and private data.
- Minimal visual direction.

## How To Prepare Future Phase Prompts

Use `docs/PHASE_HANDOFF_TEMPLATE.md`. A good prompt should name exactly one phase, list what is in scope, list what is out of scope, require inspection before edits, require docs updates, and require validation.

## How To Avoid Duplicated Work

- Read `CURRENT_STATE.md` first.
- Check `git status --short`.
- Inspect existing routes/components before creating new ones.
- Search with `rg` before adding new concepts.
- Prefer extending existing docs instead of creating overlapping docs.
- Keep planned features marked as planned until code exists.

## Validation

Use:

```bash
npm run lint
npm run typecheck
npm run build
```
