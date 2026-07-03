# Next Codex Prompt

Continue the NoProblemo project from the current repository state.

Current scope is Phase 4 only if the user explicitly requests it: Supabase foundation. Phase 3 public landing page and guest mode are complete.

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
- Public routes: `/[locale]`, `/[locale]/solve`, `/[locale]/support`
- Placeholder routes: `/[locale]/login`, `/[locale]/signup`
- Guest workspace stores drafts in localStorage only
- Supabase folder present, migrations deferred
- Safe env templates: `.env.example` and `.env.local.example`

Phase 4 direction, only when explicitly requested:

- Build Supabase foundation deliberately.
- Define schema before migrations.
- Add migrations only if Phase 4 explicitly includes them.
- Preserve guest mode and do not send guest drafts to Supabase unless explicitly requested.
- Keep user-generated content separate from UI translations.

Do not implement without explicit approval:

- Real authentication
- Google login
- Apple login
- Payments
- AI features
- Resend email
- Vercel Cron
- Real collaboration or messaging

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update `docs/CODEX_PROJECT_LOG.md` and `docs/CHANGELOG.md` with a concise entry.
