# Pending Invitation And Section Save Follow-up

Date: 2026-07-17

Status: **PRODUCTION RELEASE VERIFIED**

## Release Boundary

This focused application release consumes database behavior that was already applied and production-verified in `20260716120000_full_application_audit_security_repairs.sql`. All six Supabase migrations were applied before this application release. PR #4 includes no migration, policy, grant, function, trigger, constraint, or schema change.

The release contains only:

1. The authenticated groups page consumer for `public.pending_group_invitations()`.
2. One bounded `23505` recovery update for concurrent first saves of challenge sections.
3. Manual typing for the existing RPC and focused application/database/Preview regressions.

The release was merged through PR #4 as commit `264a435` (`Use pending invitation RPC and handle section conflicts (#4)`). It is deployed to production through Vercel deployment `dpl_Bfo7GChwmpZh2oUeYvC1pXJNZKc7` at immutable URL `https://noproblemo-4vprlluxd-no-problemo.vercel.app` and production domain `https://noproblemo.tech`.

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

The production checks below are the durable closeout for the deployed application behavior and replace the earlier pending-deployment note.

## Production Deployment

- `main` and `origin/main` both matched application commit `264a435`.
- Vercel deployment `dpl_Bfo7GChwmpZh2oUeYvC1pXJNZKc7` reported `Ready` with target `production`.
- `noproblemo.tech`, `www.noproblemo.tech`, and the immutable deployment URL returned the expected `/en` locale redirect.
- Production aliases remained unchanged.
- No Vercel error logs were found during or after verification.

Result: **PRODUCTION RELEASE VERIFIED**

## Production Behavior Verification

Pending invitation behavior passed:

- The pending invitee saw the real group name; `Unnamed group` was not shown when the RPC succeeded.
- No owner ID or group description was exposed.
- User C could not see User B's pending invitation.
- Localized notification routing, accept, decline, and accepted-member group listing passed.

Challenge section conflict behavior passed:

- Both concurrent first-save callers succeeded, and exactly one row remained for the tested challenge ID and section key.
- Two sequential saves persisted correctly.
- The original empty content was restored.
- No duplicate section keys or temporary content remained.
- An existing empty challenge materialized eight unique empty section rows through normal first-save behavior. This is verification evidence for section materialization, not a duplicate-data defect.

## Regression Verification

The focused production regression covered and passed:

- login, session persistence, logout, and authenticated redirects;
- protected deep-link restoration;
- group list and challenge workspace;
- disabled/inert viewer controls and editor saving;
- notification destinations; and
- ordinary-user admin denial.

This focused release verification does not claim that every application workflow, locale, device, or browser has been verified. Deliberately configured administrator-positive testing, OAuth provider setup, health endpoint operational verification, support mailbox setup, fluent translation review, and targeted device/browser review remain separate operational work.

## Cleanup And Immutable History

Mutable test cleanup completed with:

- no pending invitations;
- no disposable non-owner memberships;
- no temporary challenge links;
- no temporary profile names;
- no visible test messages;
- no friendship or friend-request state;
- no new disposable groups or challenges; and
- no temporary section content.

Expected immutable history remained:

- 2 accepted invitation records;
- 1 declined invitation record;
- 3 invitation notifications;
- 6 group activity records; and
- no soft-deleted messages.

## Production Safety Record

- No migration was added or applied; all six migrations predated PR #4.
- No direct production SQL was used.
- No deployment, alias, environment, or configuration change occurred during verification.
- All database mutations used supported application actions.
- No reports, traces, screenshots, auth-state files, temporary scripts, or secret-value matches remained.
