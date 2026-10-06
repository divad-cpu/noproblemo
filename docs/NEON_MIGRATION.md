# Neon migration — 2026-10-06

## Status

Completed migration and production cutover on 2026-10-06. Both production domains run on Neon Free. The source Supabase project is paused (`INACTIVE`), preserving its data and releasing its active free-project slot. Permanent source deletion was rejected by automatic approval review as major irreversible destruction despite the owner's explicit request; it was not executed. No workaround for that rejection was attempted.

| Resource | Identity |
| --- | --- |
| Neon organization | `org-bold-hat-08731712` (Free) |
| Neon project | `aged-morning-78099427` (`noproblemo`, AWS Frankfurt, PostgreSQL 17) |
| Production branch | `main`, `br-weathered-bonus-b2zfm5a1` |
| Rehearsal branch | `migration-rehearsal`, `br-proud-paper-b2jkawkh` |
| Vercel project | `prj_r5Zs0h9YwsUPiMpS4bcrYBKh2nAD` |
| Verified application commit | `f37ee364b88731f6310be155ff1af8d23b829fdf` |
| Verified GitHub production deployment | `dpl_pswfw1bAZU7wHFu5UvLoGL3FkXFz` |
| Paused Supabase source | `jxjoyugkozbldwimqjuw` |
| Unchanged active Supabase project | `skrauqdafisqigohqywp` |

[Supabase's quota rules](https://supabase.com/docs/guides/platform/billing-on-supabase) exclude paused projects. The authenticated project list confirmed one active project and the inactive NoProblemo source, freeing one slot.

## Runtime

The existing Next.js app, routes, 11 locales, schema and 60 RLS policies remain. `lib/neon/auth.ts` uses the native managed Neon Auth SDK; `/api/auth/[...path]` proxies same-origin requests. Private server reads first validate the upstream session and then use a user JWT with the Neon Data API. No database owner key or provider management credential is in the app. Guest drafts remain in browser storage.

Email/password remains the visible login method. Google/Apple buttons remain hidden pending dedicated provider setup. The default shared Google provider was removed from production; Apple support must be reassessed before activation. Production requires verified email and exact trusted origins, with custom Resend SMTP configured inside Neon. Four existing accounts were explicitly identified by the owner as test accounts; their IDs are mapped privately, and original passwords/sessions are not imported. Existing application data, ownership and profile roles are retained.

## Database setup

Enable Neon Auth and Data API on AWS PostgreSQL 17, exposing only `public`, without automatic default grants. Apply `neon/migrations/001_application_schema.sql` through `004_current_account_deletion.sql` in order. The first file adapts the seven preserved source migrations; `SOURCE_MANIFEST.json` binds their hashes. Refresh the Data API schema cache after applying migrations (`neon data-api refresh-schema`). The later files permit whole-group/account foreign-key cascades while preserving the last-owner membership guard, and provide caller-only account deletion because Managed Auth does not expose `/delete-user`.

Restore only a fresh, consistent source snapshot. Import application records transactionally with user triggers temporarily disabled and foreign keys enforced. Upsert auto-created profiles, restore all records, then re-enable triggers. Compare every typed field and count across all 15 tables, and check policies, triggers and constraints. Never promote disposable rehearsal fixtures.

## Verification evidence

The protected migration folder outside this repository holds source code/history/schema/auth/data backups, hashes, private identity mappings, field comparison results, and native/browser/Preview diagnostics. These files must never be uploaded or committed. Failed runs remain evidence; later passes do not erase them. Native browser password reset (controlled single-use token), password change, login with the new password, logout, caller-only account deletion and owned-data cascade all passed. Anonymous deletion and caller-supplied target IDs were denied. SMTP transport authentication passed without sending a custom message. Password-reset verification uses a controlled single-use fixture token, so that check does not claim mailbox delivery.

Neon SDK versions are pinned in the lockfile. Both packages use beta version labels; revalidate before changing versions. The source migrations and historical QA documents remain preserved under `supabase/` and `docs/qa/`.

## Completed checks and limits

- Source write freeze (17 guards), full final public/auth schema and COPY data exports, and SHA-256 verification.
- Clean restore: all 557 original records and typed fields across 15 tables matched exactly; four account mappings were unique.
- 60 RLS policies, 15 RLS-enabled tables, zero disabled user triggers and zero unvalidated constraints.
- Lint, TypeScript, four structural security tests, local production build and hosted production builds passed.
- Full group/invitation browser test and pending-invitation/concurrent section-save browser test passed. Initial failures and their diagnoses are preserved privately, including burst-limit pacing, stream-completion waits and the bounded cascade repairs.
- Hosted Preview and live production login/private-page/ownership/notification/admin-denial checks passed for the four original accounts. No source passwords or sessions were imported.
- Native browser recovery with a controlled single-use token, current-password change, logout, new-password login, account deletion and owned-data cascade passed. Anonymous deletion and arbitrary target IDs were denied.
- One owner-authorized signup verification email was delivered, opened and confirmed; unverified login was denied and verified live login passed. The new email-test account is retained, so the destination has five identities. Original records were rechecked separately from new user-created data after cutover.
- The legacy `/api/health/supabase` address remains for compatibility. A bad bearer was denied and the native anonymous token plus Neon health RPC passed. The existing production health secret remains configured and unchanged; its sensitive value cannot be exported by Vercel. A successful bearer-authenticated HTTP response was therefore not directly tested.
- GitHub main and `/home/dj/Projects/noproblemo` contain the migration; original local secret files are preserved unread and unchanged. Locked dependencies are installed locally. Vercel Development uses the isolated rehearsal branch; run local development with `vercel env run -- npm run dev` after verifying that project's link. Production settings stay separate.

## Source retention

Source deletion is still blocked by automatic review. If the owner later removes the paused project manually, select only `noproblemo` (`jxjoyugkozbldwimqjuw`) in [Supabase general settings](https://supabase.com/dashboard/project/jxjoyugkozbldwimqjuw/settings/general). It is unnecessary for freeing the active-project quota.

Do not unpause the source as an application rollback without inspecting the final backups and applying the prepared write-guard rollback script. The current app no longer reads Supabase variables. Old encrypted Vercel bindings, local secret files, source migrations and historic QA records are retained for recovery; do not expose or casually erase them.
