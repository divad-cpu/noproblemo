---
name: noproblemo-feature-slice
description: Use when adding a small, vertically complete feature to the NoProblemo repository. Applies to focused product changes across Next.js App Router routes, next-intl messages, Supabase-backed data flows, and local documentation.
---

# NoProblemo Feature Slice

Use this skill for small NoProblemo features. Keep the work scoped, secure, and consistent with the existing MVP.

## Workflow

1. Inspect before editing:
   - `CURRENT_STATE.md`
   - `docs/CODEX_PROJECT_MAP.md`
   - `AGENTS.md`
   - Relevant Next.js docs in `node_modules/next/dist/docs/`
   - Relevant files in `app/`, `components/` if present, `lib/`, `messages/`, `supabase/`, and docs.
2. Confirm the existing route, locale, auth, and database assumptions from the repo. Do not assume a feature exists unless it is implemented.
3. Build a small vertical slice:
   - Route/page or component changes
   - Server action or data access if needed
   - Message keys for all supported locales if visible text changes
   - Minimal docs update if behavior changes
4. Preserve the current stack and style:
   - Next.js App Router
   - TypeScript
   - Tailwind CSS
   - `next-intl`
   - Supabase Auth/Postgres/RLS
5. Avoid unrelated edits, broad refactors, new dependencies, and new product areas.

## NoProblemo Checks

- Preserve locale-prefixed routing under `/[locale]`.
- Preserve RTL support for Arabic and Urdu.
- Do not automatically translate user-generated content.
- Keep guest mode local-only unless explicitly scoped otherwise.
- Keep protected routes protected server-side.
- Keep Supabase service-role usage server-only and out of client bundles.
- Update local docs such as `CURRENT_STATE.md`, `README.md`, `SECURITY.md`, or `docs/CODEX_PROJECT_LOG.md` only when behavior changes.

## Validation

Run available validation when code changes:

```bash
npm run lint
npm run typecheck
npm run build
```

For message changes, also validate JSON and key parity across `messages/*.json`.

## Final Response

Summarize:

- Files created
- Files changed
- Feature behavior
- Validation results
- Remaining manual work or known risks
