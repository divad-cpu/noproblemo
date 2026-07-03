<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NoProblemo Agent Instructions

## First Read

Every Codex session must read these files before changing code:

1. `CURRENT_STATE.md`
2. `docs/CODEX_PROJECT_MAP.md`
3. `AGENTS.md`
4. The relevant installed Next.js guide in `node_modules/next/dist/docs/`

## How To Work Here

- Inspect the current repository state before changing files.
- Do not rebuild from scratch.
- Do not duplicate existing routes, components, docs, or architecture.
- Preserve the current stack: Next.js App Router, React, TypeScript, Tailwind CSS, `next-intl`, Supabase, and Vercel.
- Prefer small, safe, incremental changes.
- Keep the design minimalistic, clean, calm, professional, and responsive.
- Avoid unnecessary abstractions, heavy dependencies, and broad refactors.
- Use clear file names and readable code.
- Avoid changing unrelated files.
- Update `CURRENT_STATE.md` after each completed phase or major task.
- Show changed files and validation results after each task.

## Security Boundaries

- Never read, print, commit, or expose `.env.local` values.
- Never commit real secrets, Supabase service role keys, OAuth secrets, payment keys, email keys, AI keys, or Vercel tokens.
- Protect authentication, Supabase row-level security policies, environment variables, private messages, group data, and challenge content.
- Do not add real authentication, additional Supabase migrations, cloud saving, groups, invites, messaging, payments, AI, Resend, or Vercel Cron unless explicitly scoped.
- Guest work currently stays in local browser storage only and must not be sent to Supabase unless a future phase explicitly requests it.

## Validation

Run available validation after changes:

```bash
npm run lint
npm run typecheck
npm run build
```

If validation fails, fix the cause and rerun the failed command before finishing.
