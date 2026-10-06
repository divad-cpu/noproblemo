# Neon migration — 2026-10-06

## Status

Implementation and isolated restore verified. Production cutover and Supabase removal are pending; do not delete the source until final data comparison and production authentication/private-data checks pass.

## Runtime

The existing Next.js app, routes, 11 locales, schema and 60 RLS policies remain. `lib/neon/auth.ts` uses the native managed Neon Auth SDK; `/api/auth/[...path]` proxies same-origin requests. Private server reads first validate the upstream session and then use a user JWT with the Neon Data API. No database owner key or provider management credential is in the app. Guest drafts remain in browser storage.

Email/password remains the visible login method. Google/Apple buttons remain hidden pending dedicated provider setup. Production requires verified email and exact trusted origins, with custom Resend SMTP configured inside Neon. Four existing accounts were explicitly identified by the owner as test accounts; their IDs are mapped privately, and original passwords/sessions are not imported. Existing application data, ownership and profile roles are retained.

## Database setup

Enable Neon Auth and Data API on AWS PostgreSQL 17, exposing only `public`, without automatic default grants. Apply `neon/migrations/001_application_schema.sql` through `004_current_account_deletion.sql` in order. The first file adapts the seven preserved source migrations; `SOURCE_MANIFEST.json` binds their hashes. Refresh the Data API schema cache after applying migrations (`neon data-api refresh-schema`). The later files permit whole-group/account foreign-key cascades while preserving the last-owner membership guard, and provide caller-only account deletion because Managed Auth does not expose `/delete-user`.

Restore only a fresh, consistent source snapshot. Import application records transactionally with user triggers temporarily disabled and foreign keys enforced. Upsert auto-created profiles, restore all records, then re-enable triggers. Compare every typed field and count across all 15 tables, and check policies, triggers and constraints. Never promote disposable rehearsal fixtures.

## Verification evidence

The protected migration folder outside this repository holds source code/history/schema/auth/data backups, hashes, private identity mappings, field comparison results, and native/browser/Preview diagnostics. These files must never be uploaded or committed. Failed runs remain evidence; later passes do not erase them. Native browser password reset (controlled single-use token), password change, login with the new password, logout, caller-only account deletion and owned-data cascade all passed. Anonymous deletion and caller-supplied target IDs were denied. SMTP transport authentication passed without sending a custom message. Password-reset verification uses a controlled single-use fixture token, so that check does not claim mailbox delivery.

Neon SDK versions are pinned in the lockfile. Both packages use beta version labels; revalidate before changing versions. The source migrations and historical QA documents remain preserved under `supabase/` and `docs/qa/`.

## Completion gates

- Fresh source write freeze and full final snapshot.
- Clean production restore and exact field/count verification.
- Production build, trusted domains, email verification and private-data checks.
- Durable app source update before deleting Supabase.
- Source deletion followed by account project inventory showing the freed slot.
