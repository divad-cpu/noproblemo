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
Implement Phase 6 only: Dashboard and guest import.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supported locales: `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`
- RTL handling for `ar` and `ur`
- Public routes: `/[locale]`, `/[locale]/solve`, `/[locale]/support`
- Auth routes: `/[locale]/login`, `/[locale]/signup`, `/[locale]/auth/callback`, `/[locale]/auth/logout`
- Minimal protected placeholder route: `/[locale]/app`
- Guest workspace stores drafts in localStorage only
- Supabase migration exists for profiles and core challenge tables
- Supabase RLS foundation exists and needs verification
- Email login/signup is implemented through Supabase Auth
- Google and Apple OAuth starts are prepared but require provider configuration

Phase 6 should include:

- Logged-in dashboard
- Profile/settings page
- Save/import guest challenge after login
- Continue previous saved work
- Language preference saving
- Basic saved challenge list and create flow if needed for dashboard usefulness

Phase 6 should not include:

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

- Use Supabase Auth sessions server-side for protected routes.
- Use RLS as the real authorization boundary for saved challenge data.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend/client code.
- Do not send guest localStorage data to Supabase without explicit user action.
- Validate all server action inputs.
- Keep user-generated content separate from UI translations.

Documentation updates:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DATABASE_SCHEMA.md` if data usage changes
- `docs/CODEX_PROJECT_MAP.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/CHANGELOG.md`

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Finish with changed files, validation results, security impact, remaining planned work, and warnings or unknowns.
