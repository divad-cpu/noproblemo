# Next Codex Prompt

You are continuing the NoProblemo project.

Before changing anything:

1. Read `AGENTS.md`.
2. Read `CURRENT_STATE.md`.
3. Read `docs/CODEX_PROJECT_MAP.md`.
4. Read `docs/PHASE_HANDOFF_TEMPLATE.md`.
5. Read the relevant installed Next.js guide in `node_modules/next/dist/docs/`.
6. Inspect `git status --short`.
7. Check `package.json`, `app/`, `lib/`, `supabase/`, `docs/`, `README.md`, and existing documentation.
8. Do not assume anything is implemented unless it exists in the repository.
9. Do not read or print `.env.local` values.
10. Do not print Supabase `.temp` file contents.

Task:
Production verification and launch readiness.

Goal:
Verify NoProblemo against real Supabase/Vercel production setup and produce a clear launch-readiness report. Do not add unrelated product features.

In scope:

- Confirm local git state and validation status.
- Review all environment variable names without printing real values.
- Configure or verify Vercel environment variables only with explicit user approval.
- Configure `noproblemo.tech` in Vercel only with explicit user approval.
- Configure Domeneshop DNS only with explicit user approval.
- Configure `support@noproblemo.tech` as a mailbox or alias outside the app, if the user asks for help with that setup.
- Apply Supabase migrations to a real Supabase project only with explicit user approval.
- Verify Supabase migration status.
- Verify Supabase Auth email login settings and redirect URLs.
- Verify Google OAuth provider settings if credentials are available and the user approves.
- Verify Apple OAuth provider settings if credentials are available and the user approves.
- Assign the first admin manually in trusted Supabase SQL only with explicit user approval.
- Test RLS with multiple users:
  - normal user
  - admin user
  - group owner/admin/member/viewer where practical
  - outside user
- Test guest mode stays local.
- Test login, signup, callback, and logout.
- Test dashboard, challenge creation, saved workspace, sections, solutions, tasks, Markdown export, and guest import.
- Test friends, groups, invitations, group challenge links, messages, notifications, activity, admin access, and non-admin admin denial.
- Test all 11 languages.
- Test Arabic and Urdu RTL.
- Test mobile and desktop layouts.
- Run final validation:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm audit`

Out of scope:

- Do not implement payments.
- Do not implement AI features.
- Do not implement email automation, Resend, Vercel Cron, or `CRON_SECRET`.
- Do not add public challenge sharing.
- Do not add organization accounts.
- Do not add voting, comments, attachments, read receipts, typing indicators, reactions, advanced chat threads, calendar integration, PDF export, complex realtime collaboration, enterprise analytics, full moderation, support tickets, or billing.
- Do not run destructive database commands.
- Do not reset or push a remote Supabase database without explicit approval.
- Do not expose secrets, tokens, project refs, or `.env.local` values.

Documentation updates:

- `CURRENT_STATE.md`
- `DEPLOYMENT.md`
- `SECURITY.md` if verification changes security status
- `README.md` if launch instructions change
- `ROADMAP.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/CHANGELOG.md`
- `docs/NEXT_CODEX_PROMPT.md` if another handoff is needed

Final response:

- production checks completed
- checks not completed and why
- Supabase migration/RLS verification results
- Vercel/domain/DNS verification results
- auth/OAuth verification results
- manual app flow test results
- validation and audit results
- secrets handling confirmation
- remaining launch blockers
- next recommended action
