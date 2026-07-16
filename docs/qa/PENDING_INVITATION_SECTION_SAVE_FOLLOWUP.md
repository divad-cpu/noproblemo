# Pending Invitation And Section Save Follow-up

Date: 2026-07-16

Status: **IMPLEMENTED — PRODUCTION DEPLOYMENT PENDING**

## Release Boundary

This focused application release consumes database behavior that was already applied and production-verified in `20260716120000_full_application_audit_security_repairs.sql`. It includes no migration, policy, grant, function, trigger, constraint, or schema change.

The release contains only:

1. The authenticated groups page consumer for `public.pending_group_invitations()`.
2. One bounded `23505` recovery update for concurrent first saves of challenge sections.
3. Manual typing for the existing RPC and focused application/database/Preview regressions.

Production remains on application commit `91cac6d` until this release is staged and explicitly promoted. This branch must not run a production deployment, Vercel alias change, linked database write, or migration operation.

## Pending Invitation Consumer

The protected groups page continues to read ordinary memberships and member-visible base `groups` rows through the authenticated Supabase server client. Pending invitation state and accept/decline actions continue to use the caller's RLS-protected `group_invitations` rows.

Pending group identity now comes from the argument-free `pending_group_invitations()` RPC. RPC results are keyed by invitation ID and cross-checked against the invitation's group ID before the returned group name or invited role is shown. The consumer depends only on invitation ID, group ID, group name, and invited role.

The page does not use a service-role client and does not query base `groups` rows for pending invitees. If the RPC is unavailable, returns an error, or has no matching row, the existing localized `Unnamed group` fallback remains. Supabase errors are not rendered. Accept/decline forms and localized notification destinations remain unchanged.

## Challenge Section Conflict Recovery

`saveChallengeSections` preserves its existing authenticated `requireOwnedChallenge` editor check, RLS client, validation, section ordering, revalidation, redirects, and privacy-safe error key.

For a missing section, the action first attempts the existing insert. Only PostgreSQL error code `23505` activates recovery. Recovery performs exactly one update constrained by the same challenge ID and section key through the same authenticated client. The update requests only the resulting row ID and must return exactly one visible row; an update error or missing row follows the existing privacy-safe `sections-save-failed` path. All other insert errors fail immediately, and no loop or service-role client is introduced.

The applied `(challenge_id, section_key)` unique index remains authoritative. Sequential existing-row saves keep their previous update path. Concurrent first saves can therefore converge on one database row while both normal action requests receive a deterministic success or privacy-safe failure result.

## Focused Coverage

- `tests/security/pending-invitation-section-followup.test.mjs` checks the RPC consumer, member-only base group query, invitation-ID mapping, fallback, actions, notification route, manual RPC shape, exact `23505` branch, bounded recovery, authorization order, exact-key predicates, final-row verification, and safe error handling.
- `supabase/tests/database/pending_invitation_section_followup.test.sql` exercises member and pending-invitee RLS, exact four-field RPC output, unrelated-caller isolation, initial insert, `23505` classification, exact-key recovery, sequential update, and one-row uniqueness.
- `tests/e2e/pending-invitation-section-followup.spec.ts` is explicitly gated to a non-production Vercel Preview. It uses separate disposable-account browser contexts, UI-supported invitation/member cleanup, preserved section content, concurrent action requests, and user-scoped read-only row-count verification.

## Validation Record

Local validation completed against only the local Supabase stack:

- The empty local database reset applied all six existing migrations; no migration was added or changed.
- The focused pgTAP file passed 10/10 assertions, and the complete three-file database suite passed 45/45.
- Warning-level local database lint reported no schema errors.
- `npm run test:security` passed 3/3 files.
- The focused one-worker local Playwright subset passed 3/3 with a disposable local Auth account. An additional full auth-repair-file run passed 3/4; its signup-only assertion expected email-confirmation mode, while local Supabase auto-confirmed the account and correctly redirected to the dashboard. No auth code or test was changed for that environment-specific mismatch.
- `npm run typecheck`, `npm run lint`, the production build, and `git diff --check` passed. The build used local Supabase configuration and required the documented sandbox escape for Turbopack's internal local port.
- The local Supabase stack was stopped, and no matching container remained running.

The exact pushed commit, Preview URL, disposable-account verification, cleanup result, and any unavoidable `CODEX-QA-` or blank-section history will be recorded in the final handoff after Preview verification completes.

## Deployment Recommendation

Do not promote this release until all local validation, exact-commit Preview checks, and supported cleanup complete. No Supabase migration or remote database write is required for deployment because the RPC and unique index are already active in production.
