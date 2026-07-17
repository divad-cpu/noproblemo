# Security Migration Production Verification

Date: 2026-07-16

Application follow-up closed: 2026-07-17

Status: **MIGRATION VERIFIED — APPLICATION FOLLOW-UPS COMPLETED**

## Recorded Production State

The forward-only migration `20260716120000_full_application_audit_security_repairs.sql` was manually applied to production Supabase project `jxjoyugkozbldwimqjuw` on 2026-07-16. This source-alignment change records that existing database state in Git; it does not apply the migration again.

The approved and applied migration SHA-256 is:

```text
a3a4c87061a845a04529e3cc0c328df386ad79b49de1b31b90559648fcd05c53
```

The file recorded in `supabase/migrations/` matches that checksum byte for byte.

## Migration Guarantees

The applied migration preserves these reviewed boundaries:

- Pending invitees cannot select the base `groups` row.
- `pending_group_invitations()` is argument-free, scopes internally through `auth.uid()`, and returns exactly invitation ID, group ID, group name, and invited role.
- The RPC is `SECURITY DEFINER`, owned by `postgres`, uses a fixed empty `search_path`, denies execution to `PUBLIC` and `anon`, and grants execution only to `authenticated`.
- Browser execution of `notify_user` is denied.
- Direct browser inserts into `friendships` and `group_members` are revoked so trusted acceptance/owner triggers remain authoritative.
- Identity and ownership columns are not directly browser-mutable.
- The last group owner cannot be removed or demoted.
- A group challenge link can be created only for a challenge owned by the caller.
- `(challenge_id, section_key)` is unique for challenge sections.
- The migration performs no destructive data rewrite, deletion, truncation, or silent duplicate cleanup. The unique index fails on conflicting pre-existing data instead of rewriting it.

## Verification Evidence

- All six migrations align in local and linked production migration history.
- A post-apply `supabase db push --dry-run --linked` reports that the remote database is up to date and has no pending migrations.
- The complete empty local migration chain applies successfully through the recorded security migration.
- The focused migration regression suite passes 29 of 29 pgTAP assertions.
- Local warning-level database lint reports no schema errors.
- `npm run test:security` passes 2 of 2 tests.
- `npm run typecheck`, `npm run lint`, and the production build pass. The build generated all 180 static pages using command-scoped non-secret placeholders because this isolated worktree intentionally has no `.env.local`.
- `git diff --check`, the focused secret-value scan, and the generated-artifact scan pass.
- Production verification passed with the recorded result **MIGRATION VERIFIED WITH FOLLOW-UP**.

## Application Boundary And Completed Follow-ups

At the time of this migration verification, the production application was on commit `91cac6d`. This source-alignment branch added no application behavior and did not deploy.

Two application changes were deliberately separate from the migration record:

1. Update the pending-invitation UI to consume `pending_group_invitations()` and add only the corresponding generated/manual database typing needed by that consumer.
2. Add a focused concurrent-save retry for challenge-section `23505` conflicts created by the new uniqueness guarantee.

Neither follow-up was included in this migration branch. They were subsequently merged through PR #4 in application commit `264a435`, which contained no migration, then deployed and production-verified through deployment `dpl_Bfo7GChwmpZh2oUeYvC1pXJNZKc7`. See `docs/qa/PENDING_INVITATION_SECTION_SAVE_FOLLOWUP.md` for the application release evidence.

## Remote Safety Record

The source-alignment work used only the approved read-only linked checks: migration history listing and database-push dry run. It did not run a linked push or reset, migration repair, remote SQL write, deployment, Vercel alias change, environment change, or account/role change.
