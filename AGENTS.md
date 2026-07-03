<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NoProblemo Agent Instructions

## Current Scope

The project has completed Phase 2: internationalization foundation. Do not implement later feature phases unless the user explicitly changes scope.

## Hard Boundaries

- Do not read, print, commit, or expose `.env.local` values.
- Do not add authentication, login screens, Supabase migrations, social login, payments, AI features, Resend, Vercel Cron, or the full guest workspace without explicit scope.
- Do not change unrelated files.
- Keep the app minimal, clean, mobile-friendly, and desktop-friendly.

## Validation

Run these commands after project changes:

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

Keep the foundation documents current:

- `PROJECT_BRIEF.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `SECURITY.md`
- `UX_UI_GUIDE.md`
- `ROADMAP.md`
- `DEPLOYMENT.md`
- `AI_READY.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/NEXT_CODEX_PROMPT.md`
- `docs/CHANGELOG.md`
