# Next Codex Prompt

You are continuing the NoProblemo project.

Before changing anything:

1. Read `AGENTS.md`.
2. Read `CURRENT_STATE.md`.
3. Read `docs/CODEX_PROJECT_MAP.md`.
4. Read `docs/PHASE_HANDOFF_TEMPLATE.md`.
5. Read the relevant installed Next.js guide in `node_modules/next/dist/docs/`.
6. Inspect the current repository state with `git status --short`.
7. Check `package.json`, `app/`, `lib/`, `supabase/`, `docs/`, `README.md`, and existing documentation.
8. Do not assume anything is implemented unless it exists in the repository.
9. Do not read or print `.env.local` values.
10. Do not print Supabase `.temp` file contents.

Task:
Implement Phase 11 only: Polish, security review and deployment preparation.

Current foundation:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl` locale routing
- Supabase Auth
- Supabase Phase 4 schema/RLS migration
- Supabase Phase 8 friends/groups migration
- Supabase Phase 9 messaging/notifications/activity migration
- Supabase Phase 10 admin/settings/logs migration
- Email login/signup
- Protected dashboard at `/[locale]/app`
- Guest import from `noproblemo.guestWorkspace.v1`
- Saved challenge workspace
- Friends, groups, invitations, group challenge links
- Group messages and challenge discussion messages
- Private notifications and activity events
- Protected admin overview at `/[locale]/app/admin`
- Protected admin settings checklist at `/[locale]/app/admin/settings`
- Local project log documentation in the repository

Phase 11 should include:

- Mobile polish
- Desktop polish
- Accessibility checks
- Translation check
- RTL check for Arabic and Urdu
- RLS/security review
- Deployment documentation review
- Final README review
- Final validation

Phase 11 must not add large new product features.

Do not implement:

- Payments
- AI features
- Email automation
- Resend
- Vercel Cron
- `CRON_SECRET`
- Public challenge sharing
- Organization accounts
- Voting
- Comments
- File attachments
- Read receipts
- Typing indicators
- Reactions
- Advanced chat threads
- Calendar integration
- PDF export
- Complex realtime collaboration
- Enterprise analytics
- Full moderation system
- Support ticket system
- Billing

Security requirements:

- Use Supabase Auth sessions server-side for protected routes.
- Keep RLS as the real authorization boundary.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend/client code.
- Do not expose private user, group, challenge, message, notification, activity, or admin data.
- Do not expose emails unless explicitly intended and stored outside `auth.users`.
- Preserve admin protection based on `profiles.role = 'admin'`.
- Preserve profile role self-promotion protections.
- Keep user-generated content separate from UI translations.
- Do not automatically translate user-generated content.

Documentation updates:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md` if architecture notes change
- `SECURITY.md`
- `DATABASE_SCHEMA.md` if schema notes change
- `DEPLOYMENT.md`
- `README.md`
- `ROADMAP.md`
- `AI_READY.md` if future Codex guidance changes
- `docs/CODEX_PROJECT_MAP.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/NEXT_CODEX_PROMPT.md`
- `docs/CHANGELOG.md`

After changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

If `npm run build` fails only because Turbopack cannot bind a local port in the sandbox, rerun it with approved escalation.

Finish with:

- files created
- files changed
- validation commands and results
- polish/security/deployment changes
- security impact
- remaining planned work
- warnings or unknowns
