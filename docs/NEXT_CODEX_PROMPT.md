# Next Codex Prompt

You are continuing the NoProblemo project.

Before changing anything:

1. Read `AGENTS.md`.
2. Read `CURRENT_STATE.md`.
3. Read `docs/CODEX_PROJECT_MAP.md`.
4. Read `docs/PHASE_HANDOFF_TEMPLATE.md`.
5. Read the relevant installed Next.js guide in `node_modules/next/dist/docs/`.
6. Inspect `git status --short`.
7. Do not read or print `.env.local` values.
8. Do not print Supabase `.temp` file contents.

Task:
Implement Phase 5 only: Authentication.

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
- Supabase migration exists for profiles and core challenge tables
- Supabase RLS foundation exists and needs verification
- Supabase helpers exist in `lib/supabase/`

Phase 5 should include:

- Email login
- Signup
- Logout
- Protected app layout
- Profile creation after signup if the Phase 4 database trigger is not sufficient after testing
- Google login prepared
- Apple login prepared
- Auth documentation

Phase 5 should not include unless explicitly required as a minimal placeholder:

- Full dashboard
- Guest import after login
- Friends
- Groups
- Messaging
- Notifications
- Admin panel
- Payments
- AI features
- Resend
- Vercel Cron

Security requirements:

- Use Supabase Auth.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Do not fake authorization with frontend-only checks.
- Keep user-generated content separate from UI translations.
- Preserve guest mode and do not send guest drafts to Supabase unless explicitly scoped.

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update:

- `CURRENT_STATE.md`
- `SECURITY.md`
- `ARCHITECTURE.md` if auth architecture changes
- `docs/CODEX_PROJECT_MAP.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/CHANGELOG.md`
