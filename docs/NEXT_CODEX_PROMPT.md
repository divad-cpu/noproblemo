# Next Codex Prompt

Continue the NoProblemo project from the current repository state.

Current scope is Phase 1 foundation only unless the user explicitly requests a later phase.

Before editing:

1. Read `AGENTS.md`.
2. Read the relevant installed Next.js docs in `node_modules/next/dist/docs/`.
3. Inspect `git status --short`.
4. Do not read or print `.env.local` values.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase folder present, migrations deferred
- Vercel deployment configured externally
- Safe env templates: `.env.example` and `.env.local.example`
- Documentation baseline in root files and `docs/`

Do not implement without explicit approval:

- Authentication
- Login UI
- Supabase migrations
- Google login
- Apple login
- Payments
- AI features
- Resend email
- Vercel Cron
- `next-intl`

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update `docs/CODEX_PROJECT_LOG.md` and `docs/CHANGELOG.md` with a concise entry.
