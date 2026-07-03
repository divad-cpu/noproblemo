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
Implement Phase 10 only: Admin/settings and local project logs.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supabase Auth
- Supabase Phase 4 schema/RLS migration
- Supabase Phase 8 friends/groups migration
- Supabase Phase 9 messaging/notifications/activity migration
- Email login/signup
- Protected dashboard at `/[locale]/app`
- Guest import from `noproblemo.guestWorkspace.v1`
- Profile/settings with display name and preferred locale saving
- Protected saved challenge workspace
- Friend requests and friendships
- Groups, group invitations, roles, 100-member group limit, and explicit group challenge links
- Group messages and challenge discussion messages
- Private notifications and basic activity events

Phase 10 should include:

- Basic admin/settings area
- Admin role protection using `profiles.role = 'admin'`
- Activity/admin overview if simple
- Complete local Codex project log documentation

Phase 10 must not include:

- Email automation
- Resend
- Vercel Cron
- Payments
- AI features
- Organization accounts
- Voting
- Comments
- Calendar integration
- PDF export

Security requirements:

- Use Supabase Auth sessions server-side for protected routes.
- Use RLS as the real authorization boundary.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend/client code.
- Validate all server action inputs.
- Do not expose private user, group, challenge, message, notification, or activity data to non-admin users.
- Admin routes must be protected server-side.
- Keep user-generated content separate from UI translations.

Documentation updates:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DATABASE_SCHEMA.md` if schema notes changed
- `ROADMAP.md`
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
