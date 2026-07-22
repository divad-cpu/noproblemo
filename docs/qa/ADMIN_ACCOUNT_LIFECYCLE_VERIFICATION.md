# Admin And Account Lifecycle Verification

Date: 2026-07-22

Scope: isolated disposable local Supabase only

Branch: `qa/admin-account-lifecycle-verification`

Base: `origin/main` at `0d2115ecb63cb0de64d27d1d043d888594c82077`

## Outcome

Positive administrator authorization passed. Account deletion has a concrete database lifecycle defect for ordinary group members and non-owner group administrators. No application or migration behavior was changed, and no production, Preview, linked Supabase, Vercel, DNS, provider, or deployment state was accessed or mutated.

## Evidence Classification

| Boundary | Classification | Evidence |
| --- | --- | --- |
| Admin page role model | Source-verified | Both admin pages authenticate server-side and require `profiles.role = 'admin'`. |
| Admin RPC authorization | Locally runtime-verified | Configured admin passed all four RPCs; ordinary user and demoted admin received `42501`. |
| Admin data minimization | Locally runtime-verified | Exact RPC row shapes were asserted; message bodies and challenge content markers were absent. |
| Admin audit-log privacy | Locally runtime-verified | Admin read succeeded; ordinary and demoted users saw zero rows under RLS. |
| Self-promotion denial | Locally runtime-verified | Direct authenticated `profiles.role` update failed with `42501`; settings source has no role input/update. |
| Current-user deletion target | Source-verified | Target comes only from the authenticated session; no client `user_id` is accepted. |
| Service-role isolation | Source-verified and locally runtime-verified | Helper imports `server-only`; the gated harness accepted only loopback local status and used the local service role only for Auth Admin calls. |
| Empty-user deletion | Locally runtime-verified | pgTAP and Auth Admin API deletion passed. |
| Challenge-owner deletion | Locally runtime-verified | Challenge, section, solution, task, and challenge-scoped message cascades passed. |
| Ordinary group member deletion | Defective | Auth Admin API and pgTAP failed atomically with `23503:activity_events_actor_id_fkey`. |
| Non-owner group administrator deletion | Defective | pgTAP failed atomically with the same constraint. |
| Creator with another accepted owner | Locally runtime-verified, safely blocked | `P0001`; Auth user, group, and both owner memberships remained. |
| Last group owner | Locally runtime-verified, safely blocked | `P0001`; Auth user, group, and sole owner membership remained. |
| Relationship/history deletion without membership | Locally runtime-verified | Requests, friendships, invitations, and recipient notifications cascaded; message/activity/audit actor references became `NULL`. |
| Production behavior | Not tested | Explicitly out of scope. |

## Administrator Model And Output

Administrator authority is assigned only by a trusted database operator setting `profiles.role = 'admin'`. The routes and database use the same role source. `admin_overview_counts`, `admin_list_profiles`, `admin_recent_activity`, and `admin_recent_audit_log` are security-definer functions that call `is_admin(auth.uid())` before returning data.

The verified output is limited to aggregate metrics; profile ID, display name, locale, role, and creation time; activity IDs/scope/type/actor display name/time; and audit IDs/action/target/metadata/time. It does not query or return `auth.users`, passwords, tokens, service-role values, private message bodies, or challenge-section content. Removing the fixture administrator role immediately removed RPC and audit-log access.

## Account Deletion Matrix

### A — empty user: passed

The Auth user and triggered profile were deleted. The actual local Auth Admin API path also passed.

### B — challenge owner: passed

The owned challenge cascaded. Its section, solution, task, and challenge-scoped message were removed. No tested challenge orphan remained.

### C — ordinary group member: defective

Deletion failed atomically with `23503:activity_events_actor_id_fkey`. The Auth user, membership, invitation, group, and owner remained unchanged.

### D — group administrator, not owner: defective

Deletion failed atomically with the same constraint. The Auth user and administrator membership remained; the group and original owner were unchanged.

### E — group creator with another accepted owner: safely blocked

Deletion returned `P0001`. Because `groups.owner_id` cascades the group, the group-members cascade eventually reaches the last remaining owner and the last-owner trigger aborts the statement. The transaction left the Auth user, group, and both accepted owners intact. No transfer occurs.

### F — last group owner: safely blocked

Deletion returned `P0001`, with the Auth user, group, and sole owner membership intact. No ownerless group was created.

### G — relationship and communication history: passed when isolated from the membership defect

Friend requests, friendships, invitations involving the user, and notifications addressed to the user cascaded. A group message remained for authorized group history with `sender_id = NULL`; its body remained visible only under the existing group-message RLS boundary. Activity and admin-audit rows remained with `actor_id = NULL`. The surviving group remained. When the same user also has a membership, Scenario C's defect blocks the whole lifecycle before these cascades can complete.

## Root Cause And Severity

Severity: **high functional/privacy-lifecycle defect, with integrity protected by atomic rollback**.

`auth.users` deletion cascades to `group_members`. The `group_members_activity_removed` after-delete trigger calls `create_group_member_activity()`, which inserts a new activity row using `old.user_id` as `actor_id`. That newly inserted reference conflicts with deletion of the same Auth user and raises `23503` on `activity_events_actor_id_fkey`. The statement rolls back fully, so no partial account deletion or ownership corruption was observed.

Affected source:

- `supabase/migrations/20260703220000_phase9_messaging_notifications_activity.sql`
- Existing `activity_events.actor_id` foreign key and `create_group_member_activity()` trigger function
- `app/[locale]/app/actions.ts` surfaces only the generic `account-delete-failed` result; it does not leak the database error.

## Test Evidence

- `admin_positive_authorization.test.sql`: 17/17 passed.
- `account_deletion_lifecycle.test.sql`: 30/35 passed; five expected-success assertions failed across Scenarios C and D, all caused by the same atomic membership-deletion defect. Scenarios E and F passed as safe blocking after exact SQLSTATE handling.
- Local Auth Admin harness: empty user passed; ordinary member reproduced the defect; loopback/service-role gates passed. It intentionally exited nonzero on the defect.
- All pgTAP files use transactions and roll back fixtures.

## Migration Assessment And Follow-up

A focused migration is required. The follow-up should change removal-activity attribution so an Auth-user cascade cannot create a fresh reference to the user being deleted, then rerun this complete matrix. Ownership semantics should remain a separate explicit product decision: do not invent automatic transfer. Suggested branch: `fix/account-deletion-group-member-activity`.

No speculative fix is included in this QA branch.

## Validation And Cleanup

| Command/check | Result |
| --- | --- |
| `git diff --check` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:security` | Passed, 5/5 files |
| `npm run build` | Passed with disposable local public Supabase values injected without output; the first no-env attempt and a sandbox-restricted retry were superseded by this successful run |
| `supabase test db` | Failed as defect evidence: 102/107 passed; only Scenario C/D lifecycle assertions failed |
| Gated local Auth Admin harness | Failed as defect evidence after Scenario A passed and Scenario C reproduced the atomic rejection |
| Fixture cleanup | Passed: zero `.invalid` fixture Auth users and no `test_support` schema before shutdown |
| Stack cleanup | Passed: local stack stopped with no backup; no labeled containers, volumes, or networks remained; generated runtime metadata and secret-bearing temporary status files were removed |
