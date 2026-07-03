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
Implement Phase 8 only: Friends and groups.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supabase Auth
- Supabase Phase 4 schema/RLS migration
- Email login/signup
- Protected dashboard at `/[locale]/app`
- Guest import from `noproblemo.guestWorkspace.v1`
- Profile/settings with display name and preferred locale saving
- Protected saved challenge workspace
- Editable challenge sections, solutions, tasks, final recommendation, summary, and Markdown export

Phase 8 should include:

- Friend requests
- Accept/decline
- Groups
- Group invitations
- Group roles
- 100-member group limit
- Group challenge access

Phase 8 should not include unless explicitly required as a minimal placeholder:

- Messaging
- Notifications
- Admin panel
- Payments
- AI features
- Resend
- Vercel Cron

Security requirements:

- Use Supabase Auth sessions server-side for protected routes.
- Use RLS as the real authorization boundary.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend/client code.
- Validate all server action inputs.
- Do not fetch or expose another user's private data.
- Invites must require accept/decline before access is granted.
- Enforce the 100-member group limit in database policy/trigger or server action with documentation.
- Keep user-generated content separate from UI translations.

Documentation updates:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DATABASE_SCHEMA.md`
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
