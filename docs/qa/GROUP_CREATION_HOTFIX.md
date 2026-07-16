# Group creation returned-row RLS hotfix

Date: 2026-07-16

Branch: `hotfix/group-creation-returning-rls`

Commit: the branch's single hotfix commit; its exact hash is recorded in the final deployment handoff because a commit cannot include its own hash.

Preview: <https://noproblemo-group-hotfix.vercel.app>

## Scope

Included:

- The `createGroup` server-action correction in `app/[locale]/app/actions.ts`.
- A focused application structure regression in `tests/security/group-creation-returning-rls.test.mjs`.
- A standalone production-baseline pgTAP regression in `supabase/tests/database/group_creation_returning_rls.test.sql`.
- The minimal `test:security` package script required to run the focused regression.
- This release note and the corresponding current-state entry.

Intentionally excluded:

- The pending security migration and every other migration change.
- Unrelated QA-branch authentication, challenge-save, locale, audit, and browser-test changes.
- Dependencies, lockfile changes, credentials, browser state, Vercel link files, build output, and test artifacts.

## Repair

The server action generates the group UUID on the server, performs a minimal insert without `.select()` or another returned representation, and then verifies the exact group in a separate query constrained by both the generated ID and authenticated owner ID. Owner membership remains exclusively trigger-owned. Insert and verification failures use distinct safe categories while the visible failure message remains generic.

## Validation

| Check | Result |
|---|---|
| Lockfile install with `npm ci` | PASS; no dependency or lockfile change |
| Focused application regression | PASS, 1/1 |
| `npm run test:security` | PASS, 1/1 |
| Production-baseline local migration chain | PASS, five existing migrations only |
| Standalone group pgTAP regression | PASS, 6/6 |
| `supabase db lint --local --level warning` | PASS, no schema errors |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| Production build with the existing ignored local application environment | PASS, 180 static pages |

The first isolated build attempt correctly stopped because the new worktree contained no environment file. The successful rerun used a temporary ignored symlink to the existing local application environment; it was removed immediately and was never staged.

## Preview verification

Vercel project metadata confirms the deployment targets the existing `no-problemo/noproblemo` project and uses its Preview-scoped Supabase variable names. Encrypted values were not printed or committed. Successful disposable-account login and database-backed group creation confirm the Preview can reach the intended existing Supabase configuration.

Using one Playwright worker and User A in an isolated browser context:

- Login passed.
- One unique `CODEX-QA-` group was created without `group-create-failed`.
- Navigation reached the group detail route.
- The authenticated user rendered with the Owner role.
- `Group created` and `Group member joined` activity were visible.
- The group appeared in the user's group inventory.
- Reload persistence passed.

The application exposes no group-delete UI, so the safely owned disposable record remains for later approved cleanup:

- `CODEX-QA-HOTFIX-mrno52nv` (`8ea4421a-0e31-4475-8c9a-2e7bccdb9558`)

No Supabase migration was applied or modified. No production deployment occurred, and the Preview was not aliased to `noproblemo.tech`.
