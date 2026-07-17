# Production UX and feedback repair release

Date: 2026-07-16

Branch: `fix/production-ux-feedback`

Commit: the branch's single focused repair commit; its exact hash is recorded in the final handoff because a commit cannot contain its own hash.

## Scope

Included application repairs:

- Friend acceptance relies on the existing database trigger, avoids a duplicate friendship insert, verifies the participant-visible friendship row, and reports the successful final state.
- Group invitation acceptance relies on the existing database trigger, avoids a duplicate membership insert, verifies the accepted role, and reports the successful final state.
- Friend-request notifications route through the locale-aware friends page.
- Pending group-invitation notifications route through the locale-aware group invitation list instead of an inaccessible private group.
- Group-message and challenge-message notifications retain their readable resource destinations.
- Viewer challenge workspaces show a localized read-only notice, retain reading/export/print/navigation, and render mutation forms inert with native-disabled controls and no active server actions. Owners, admins, and members retain intended editor actions; server checks and RLS remain authoritative.
- Authenticated users are redirected away from login/signup to a sanitized localized destination or the application dashboard.
- Protected challenge, group, settings, and query-string destinations survive authentication through the existing safe redirect boundary.
- Login, signup, and confirmation-resend submit buttons expose pending state and block duplicate submissions.

Explicitly excluded:

- `groups_select_pending_invitee`, pending-invitee group-name visibility, and every other Supabase migration or schema/RLS/function/ACL change.
- Challenge-section uniqueness, activity/helper hardening, admin-role work, deletion features, autosave, translation rewrites, and unrelated audit repairs.
- Payments, AI, Resend, email automation, and Cron.

At this release boundary, pending invitees could continue to see `Unnamed group` until the separately reviewed security migration and application consumer were released. That follow-up was subsequently completed and production-verified in PR #4 application commit `264a435`; see `docs/qa/PENDING_INVITATION_SECTION_SAVE_FOLLOWUP.md`.

## Changed files

- `.gitignore`: ignores Playwright output.
- `app/[locale]/_components/pending-submit-button.tsx`: shared accessible pending submit state.
- `app/[locale]/app/actions.ts`: trigger-owned acceptance verification and group-editor authorization.
- `app/[locale]/app/challenges/[id]/page.tsx`: inert, native-disabled localized viewer presentation and preserved editor controls.
- `app/[locale]/app/layout.tsx`, `proxy.ts`, and `lib/auth/safe-redirect.ts`: protected destination capture and sanitization.
- `app/[locale]/app/notifications/page.tsx`: safe notification destinations.
- `app/[locale]/auth/actions.ts`, `app/[locale]/login/page.tsx`, and `app/[locale]/signup/page.tsx`: shared redirect safety, authenticated redirects, and pending protection.
- `messages/*.json`: one localized read-only viewer notice in each supported locale.
- `package.json`, `package-lock.json`, and `playwright.config.ts`: focused Playwright regression support without application dependency upgrades.
- `tests/e2e/auth-repairs.spec.ts`: pending, duplicate-submit, authenticated redirect, deep-link, query, and unsafe-next coverage.
- `tests/security/production-ux-repairs.test.mjs`: trigger, final-state, notification, viewer/editor, redirect, and pending structure regressions.
- `CURRENT_STATE.md` and this release note: focused release state and evidence.

No migration file changed.

## Local validation

| Check | Result |
|---|---|
| Focused acceptance/notification/viewer/auth source regressions | PASS |
| `npm run test:security` | PASS, 2/2 test files |
| Focused auth Playwright suite, one worker | PASS, 4/4 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, 180 static pages generated |
| Message JSON/read-only-key validation | PASS, all 11 locales |
| `git diff --check` | PASS |
| Secret-value scan | PASS |
| Generated/environment artifact scan | PASS |

The local build used an ignored temporary `.env.local` symlink to the existing QA configuration. Playwright loaded account credentials only by sourcing the ignored `.env.e2e.local` file and loaded public local configuration from the ignored `.env.local` source. The temporary symlink is removed before staging; no environment file is committed.

## Preview deployment and verification

Stable Preview URL: `https://noproblemo-dajernaes-7941-no-problemo.vercel.app`

Immutable deployment URL: `https://noproblemo-hsak59jvt-no-problemo.vercel.app`

Vercel reported the immutable deployment `Ready` with target `preview`. The project has existing Preview-scoped Supabase variable names for the public URL/key, server anon key, and service-role key; their values were neither read nor printed. No production alias was assigned.

The focused authentication suite passed 4/4 with one worker: unsafe `next` rejection; login and signup pending/duplicate-submit protection with failure recovery; authenticated login/signup redirects; and restoration of challenge-create, challenge-detail, group, settings, and safe query destinations.

The stateful three-account suite passed 1/1 with one worker and separate browser contexts:

- Friends: User A sent User B a request, duplicate submission was rejected, User B's notification linked to `/en/app/friends`, acceptance produced success feedback without `friend-response-failed`, the friendship existed and was removed normally, and a second request was declined.
- Group invitations: the suite reused `CODEX-QA-mrnoqjsw-192105-group`; duplicate invitations were rejected, pending-invite notifications linked to `/en/app/groups` instead of the private group, User B accepted as member, User C accepted as viewer, assigned roles were visible, success feedback appeared without `group-invitation-response-failed`, a second invitation was declined, and both members were removed normally.
- Viewer/editor: User B edited an allowed challenge description and the change persisted. User C could read the linked challenge, saw the localized read-only state, retained Markdown/PDF export, had no ownership input, and all rendered mutation controls were disabled. A direct anon-client update under User C's authenticated session returned an error or no affected row, confirming RLS still rejected the write. The original description was restored.
- Notifications: friend request, group invitation, group-message, and challenge-message destinations were correct and locale-preserving. Group/challenge notifications were marked read successfully. A pending invitee was never linked to the inaccessible private group route.

Normal-UI cleanup passed with no cleanup failures: display names were restored; no friendship, request, pending invitation, User B/User C group membership, linked challenge, or visible prefixed group/challenge message from this run remains; and the reused challenge content was restored. The release verification created no new group or challenge.

The application has no group/challenge/history deletion UI, so the prior two disposable groups and ten prefixed disposable challenges documented by the full audit remain. The run reused the existing group and challenge. Disposable notification/activity history from the audit and this verification also remains under the three disposable accounts; removed messages may retain normal soft-delete/history records.

## Safety status

- No Supabase migration was included, modified, or applied.
- No direct production SQL or linked database push was run.
- No production database configuration, password, role, or real-user data was changed.
- No production Vercel deployment or `noproblemo.tech` alias was created.
- The tested application commit is ready for production deployment approval; production deployment remains a separate manual decision.
