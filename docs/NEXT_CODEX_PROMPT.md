# Next Codex Prompt

You are continuing the NoProblemo project.

Before changing anything:

1. Read `AGENTS.md`.
2. Read `CURRENT_STATE.md`.
3. Read `docs/CODEX_PROJECT_MAP.md`.
4. Read `docs/PHASE_HANDOFF_TEMPLATE.md`.
5. Read `docs/PRODUCTION_VERIFICATION.md`.
6. Read `docs/SUPABASE_VERIFICATION.md`.
7. Read `docs/MANUAL_TEST_PLAN.md`.
8. Read `docs/LAUNCH_READINESS_REPORT.md`.
9. Read the relevant installed Next.js guide in `node_modules/next/dist/docs/`.
10. Inspect `git status --short`.
11. Check `package.json`, `app/`, `lib/`, `supabase/`, `docs/`, `README.md`, and existing documentation.
12. Do not assume anything is implemented unless it exists in the repository.
13. Do not read or print `.env.local` values.
14. Do not print Supabase `.temp` file contents.

Task:
Controlled Supabase/Vercel production verification.

Goal:
Verify NoProblemo against the intended Supabase and Vercel production setup, document every result, and identify launch blockers. Do not add unrelated product features.

Core safety rules:

- Do not expose secrets, tokens, project refs, or `.env.local` values.
- Do not print Supabase `.temp` file contents.
- Ask before applying Supabase migrations to any remote project.
- Ask before assigning the first admin in Supabase SQL.
- Ask before changing Vercel project settings.
- Ask before changing Domeneshop DNS settings.
- Ask before changing Auth provider settings.
- Do not run destructive database commands.
- Do not reset or push a remote Supabase database without explicit approval.
- Do not add email automation, Resend, Vercel Cron, or `CRON_SECRET`.

In scope:

- Verify local validation first:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm audit`
- Verify repository safety:
  - no tracked `.env.local`
  - no tracked Supabase `.temp` files
  - no real secrets committed
  - no service-role key usage in frontend/client code
  - no Resend or cron project-log system
- Verify migration readiness from `supabase/migrations/`.
- Verify production environment variable names without printing values:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPPORT_EMAIL`
- Verify Supabase migration status only after approval.
- Verify Supabase Auth Site URL and redirect URLs.
- Verify email login, signup, callback, and logout.
- Verify Google OAuth if credentials/provider access are available and approved.
- Verify Apple OAuth if credentials/provider access are available and approved.
- Verify Vercel env vars and deployment settings only after approval.
- Verify `noproblemo.tech` custom domain and Domeneshop DNS only after approval.
- Verify `david@fideli.no` mailbox or alias setup outside the app.
- Verify RLS with multiple users:
  - User A normal user
  - User B normal user
  - User C admin user
  - group owner/admin/member/viewer where practical
  - outside user
- Verify guest mode remains local until authenticated import.
- Verify dashboard, challenge workspace, guest import, friends, groups, messages, notifications, activity, admin access, and non-admin admin denial.
- Verify all 11 languages and Arabic/Urdu RTL.
- Verify mobile, tablet, and desktop layouts.
- Update verification evidence in:
  - `docs/PRODUCTION_VERIFICATION.md`
  - `docs/SUPABASE_VERIFICATION.md`
  - `docs/MANUAL_TEST_PLAN.md`
  - `docs/LAUNCH_READINESS_REPORT.md`
  - `CURRENT_STATE.md`
  - `docs/CODEX_PROJECT_LOG.md`
  - `docs/CHANGELOG.md`

Out of scope:

- Do not implement payments.
- Do not implement AI features.
- Do not implement email automation, Resend, Vercel Cron, or `CRON_SECRET`.
- Do not add public challenge sharing.
- Do not add organization accounts.
- Do not add voting, comments, attachments, read receipts, typing indicators, reactions, advanced chat threads, calendar integration, PDF export, complex realtime collaboration, enterprise analytics, full moderation, support tickets, or billing.
- Do not redesign the application.
- Do not add large new product features.

Final response:

- Local validation results.
- Audit result.
- Repository safety result.
- Supabase migration/RLS verification results.
- Auth/OAuth verification results.
- Vercel/domain/DNS verification results.
- Manual app flow test results.
- Checks not completed and why.
- Secrets handling confirmation.
- Remaining launch blockers.
- Next recommended action.
