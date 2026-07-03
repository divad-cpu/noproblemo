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
Implement Phase 9 only: Messaging, notifications and activity.

Current foundation:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supabase Auth
- Supabase Phase 4 schema/RLS migration
- Supabase Phase 8 friends/groups migration
- Email login/signup
- Protected dashboard at `/[locale]/app`
- Guest import from `noproblemo.guestWorkspace.v1`
- Profile/settings with display name and preferred locale saving
- Protected saved challenge workspace
- Friend requests and friendships
- Groups, group invitations, roles, 100-member group limit, and explicit group challenge links

Phase 9 should include:

- Group messages
- Challenge messages
- Basic notifications
- Activity events
- Realtime only if simple and safe

Phase 9 should not include unless explicitly required as a minimal placeholder:

- Admin panel
- Payments
- AI features
- Resend
- Vercel Cron
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
- Do not fetch or expose another user's private data.
- Messages must be visible only to users with the relevant group or challenge access.
- Notifications and activity events must not reveal private group/challenge names to unauthorized users.
- Keep user-generated content separate from UI translations.

Documentation updates:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DATABASE_SCHEMA.md`
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
