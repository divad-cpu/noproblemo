# Account Deletion Group-Member Activity Repair

Date: 2026-07-22

Status: local repair verified; production unchanged

## Scope

This repair addresses only account-deletion rollback for an ordinary accepted group member or a non-owner group administrator. It does not change group-owner deletion policy, invent ownership transfer, alter RLS, weaken a foreign key, delete retained history, or change application source.

## Confirmed Root Cause

Deleting an Auth user cascades to `profiles` and `group_members` in the same transaction. The `group_members_activity_removed` trigger then called `create_group_member_activity()`, which inserted `OLD.user_id` as `activity_events.actor_id`. That value was the removed subject, not necessarily the initiator. During Auth-user deletion it also referenced the parent Auth row being deleted, so `activity_events_actor_id_fkey` raised `23503` and PostgreSQL rolled the entire account deletion back. No partial deletion or orphaned data was observed.

## Repair Semantics

- Actor: for an intentional authenticated membership deletion, use the surviving `auth.uid()` only when that Auth row still exists.
- Subject: the removed membership remains the subject of the generic `Group member removed.` event. No email, display name, profile field, or new subject identifier is retained.
- System-driven cascade: the server-only Auth Admin deletion request has no surviving application actor, so the event uses `actor_id = NULL`.

`activity_events.actor_id` was already nullable and already used `ON DELETE SET NULL`. The migration preserves that FK and changes only `public.create_group_member_activity()`. Join activity behavior is unchanged. Manual owner/admin removal now records the actual authenticated manager instead of the removed member. Supported self-removal retains the self actor while the Auth row remains valid.

## Ownership And Retained History

Deletion of a group creator/owner remains blocked even when another owner exists. Deletion of the last owner remains blocked. No automatic ownership transfer was added and no ownerless group was produced.

Messages retain their bodies where the existing model retains them and anonymize a deleted sender through `ON DELETE SET NULL`. Existing activity and admin-audit rows similarly anonymize deleted actors. Notifications addressed to a deleted user, relationships, invitations, owned challenges, and nested challenge data retain their existing cascade behavior. Activity and notification RLS remains unchanged.

## Local Runtime Evidence

The additive eight-migration chain was applied only to the disposable Docker-based local Supabase stack. The focused pgTAP suite passed 27/27. The required seven-file matrix passed 134/134 across:

- account-deletion group-member activity;
- positive admin authorization;
- account-deletion lifecycle;
- group creation;
- security migration alignment;
- pending invitation/challenge-section behavior;
- group invitation cancellation.

Every SQL suite used `BEGIN`/`ROLLBACK`, deterministic UUIDs, and `.invalid` emails.

The explicitly gated loopback-only Auth Admin harness passed:

- ordinary group-member account deletion;
- non-owner group-administrator account deletion;
- Auth-user, profile, and membership removal;
- surviving group and owner validity;
- null system activity attribution and FK integrity;
- co-owner creator deletion remains blocked;
- last-owner deletion remains blocked;
- zero fixture users, profiles, memberships, and groups after cleanup.

The harness rejects non-loopback HTTP API URLs, `noproblemo.tech`, and production project reference `jxjoyugkozbldwimqjuw`. It does not print generated passwords, tokens, connection strings, or service-role values.

## Validation And Cleanup

- `git diff --check`: passed.
- `npm run lint`: passed after installing the lockfile-defined dependencies with `npm ci`.
- `npm run typecheck`: passed.
- `npm run test:security`: passed 6/6 test files.
- `npm run build`: passed with non-secret loopback placeholders. The first attempt was blocked by missing public Supabase environment names; a sandboxed retry was blocked when Turbopack could not bind its internal worker port; the approved local retry passed.
- Focused pgTAP: passed 27/27 after correcting one RLS-context assertion in the test itself.
- Complete requested pgTAP matrix: passed 134/134.
- Auth Admin harness: passed all scenarios and cleanup.
- SQL cleanup: zero `.invalid` fixture users, fixture groups, fixture memberships, or idle transactions remained before stack shutdown.
- Docker cleanup: the local stack was stopped with no backup; zero NoProblemo Supabase containers, volumes, or networks remained; no generated Supabase runtime metadata remained.

The installed Next.js package did not contain the project-mandated `node_modules/next/dist/docs/` directory, so that guide inspection was blocked. No Next.js application code changed.

## Application And Release Impact

No application source change is required. The existing settings action remains session-derived and calls the server-only admin helper. The repair requires applying `20260722120000_fix_group_member_activity_actor.sql` through a separately approved database release.

Production was not changed or tested. Pending release steps are: review and merge the repair PR, verify the migration checksum, apply only the new migration through an approved production workflow, confirm migration-history alignment, deploy the unchanged-compatible application revision if required by release process, and exercise disposable ordinary-member and non-owner-admin deletion without claiming broader production coverage.
