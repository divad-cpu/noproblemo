# Next Codex Prompt

Continue the NoProblemo project from the current repository state.

Current scope is Phase 3 only if the user explicitly requests it: guest workspace foundation. Phase 2 internationalization foundation is complete.

Before editing:

1. Read `AGENTS.md`.
2. Read the relevant installed Next.js docs in `node_modules/next/dist/docs/`.
3. Inspect `git status --short`.
4. Do not read or print `.env.local` values.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supported locales: `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`
- RTL handling for `ar` and `ur`
- Supabase folder present, migrations deferred
- Vercel deployment configured externally
- Safe env templates: `.env.example` and `.env.local.example`
- Documentation baseline in root files and `docs/`

Phase 3 direction, only when explicitly requested:

- Preserve guest-mode first.
- Build a minimal guest workspace foundation without login.
- Keep user-generated content separate from UI translations.
- Do not add database migrations unless Phase 3 explicitly includes them.

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

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update `docs/CODEX_PROJECT_LOG.md` and `docs/CHANGELOG.md` with a concise entry.
