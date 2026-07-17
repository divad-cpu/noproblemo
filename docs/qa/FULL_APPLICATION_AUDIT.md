# Full Application Audit

Audit date: 2026-07-16  
Branch: `qa/full-application-audit`  
Production domain: `https://noproblemo.tech`

## 1. Audit scope

This audit combined six specialist reviews with Playwright browser automation, source inspection, Supabase migration/RLS review, responsive and internationalization matrices, focused repair work, and full project validation.

The inventory covers 23 route templates, 154 unique visible JSX control render sites, 42 form sites, three navigation landmarks, and one dialog. Locale expansion produces 233 canonical URL templates before dynamic challenge/group IDs.

No commit, push, merge, deployment, remote migration, account deletion, or destructive production operation was performed.

## 2. Environments tested

| Environment | Use | Result |
|---|---|---|
| Local `http://localhost:3000` | Public, guest, anonymous protection, responsive, a11y, i18n, negative cases | PASS |
| Production `https://noproblemo.tech` | Non-destructive smoke and public/auth route matrix | PASS, with production still showing defects repaired only in this worktree |
| Local/remote Supabase | Source and migration inspection only | BLOCKED: `.env.local` values cannot be read, so the target project could not be proven non-production |

No `E2E_USER_*` or `E2E_ADMIN_*` credential variables were available. Database writes were therefore prohibited.

## 3. Routes discovered

| Route template | Access | Audit status |
|---|---|---|
| `/` | Public redirect | PASS |
| `/[locale]` | Public landing | PASS |
| `/[locale]/solve` | Public guest workspace | FIXED AND VERIFIED |
| `/[locale]/support` | Public support | PASS |
| `/[locale]/login` | Public auth | FIXED AND VERIFIED |
| `/[locale]/signup` | Public auth | FIXED AND VERIFIED |
| `/[locale]/forgot-password` | Public auth | PASS for application-controlled states |
| `/[locale]/reset-password` | Public recovery | PASS for invalid/empty states; valid recovery BLOCKED |
| `/[locale]/auth/callback` | Auth callback handler | FIXED AND VERIFIED for safe invalid/canonical redirects; valid exchange BLOCKED |
| `/[locale]/auth/logout` | POST handler | GET rejection PASS; authenticated POST BLOCKED |
| `/[locale]/app` | Protected dashboard | Anonymous protection PASS; authenticated page BLOCKED |
| `/[locale]/app/challenges/new` | Protected create | Anonymous protection PASS; write flow BLOCKED |
| `/[locale]/app/challenges/[id]` | Protected workspace | Anonymous protection PASS; authenticated lifecycle BLOCKED |
| `/[locale]/app/challenges/[id]/print` | Protected print | Anonymous protection PASS; authenticated pagination BLOCKED |
| `/[locale]/app/friends` | Protected friends | Anonymous protection PASS; two-user flow BLOCKED |
| `/[locale]/app/groups` | Protected groups | Anonymous protection PASS; multi-user flow BLOCKED |
| `/[locale]/app/groups/new` | Protected group create | Anonymous protection PASS; write flow BLOCKED |
| `/[locale]/app/groups/[id]` | Protected group detail | Anonymous protection PASS; role flow BLOCKED |
| `/[locale]/app/notifications` | Protected notifications | Anonymous protection PASS; live notification flow BLOCKED |
| `/[locale]/app/settings` | Protected settings | Anonymous protection PASS; authenticated mutations BLOCKED |
| `/[locale]/app/admin` | Admin-only | Anonymous protection PASS; admin/non-admin browser roles BLOCKED |
| `/[locale]/app/admin/settings` | Admin-only | Anonymous protection PASS; admin browser role BLOCKED |
| `/api/health/supabase` | Bearer-protected handler | Unauthorized response PASS; authorized RPC BLOCKED |

No missing `href` target, empty handler, true orphan UI route, `href="#"`, TODO, or FIXME was found in application source.

## 4. User roles tested

| Role/state | Method | Status |
|---|---|---|
| Anonymous visitor | Local and production browser | PASS |
| Guest workspace user | Local browser with persistence/error injection | FIXED AND VERIFIED |
| Authenticated ordinary user | Source/RLS only | BLOCKED |
| Friend-request sender/receiver | Source/RLS only | BLOCKED |
| Group owner/admin/member/viewer | Source/RLS only | BLOCKED |
| Challenge owner/group collaborator/viewer | Source/RLS only | BLOCKED |
| Admin/non-admin | Source/RLS only | BLOCKED |

## 5. Viewports tested

- 1440 × 900 desktop
- 1280 × 720 small laptop
- 768 × 1024 tablet
- 390 × 844 mobile
- 320 × 568 narrow mobile

The automated matrix found no horizontal overflow on the landing, login, signup, or guest workspace at any required viewport. A broader agent pass executed 112 local page/viewport checks and 40 safe production page/viewport checks.

## 6. Locales tested

Application boot, public/auth/guest/support routes, `lang`, `dir`, missing-key markers, locale-preserving links, and anonymous protected redirects were checked for:

`en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`.

Arabic and Urdu rendered RTL. Message-key parity passes for all 11 catalogs with 722 leaf keys. Translation quality is not a pass: nine catalogs still contain extensive generic placeholder copy and require native review.

## 7. Functional test matrix

| Domain | Executed behavior | Status |
|---|---|---|
| Landing/navigation | Root redirect, CTA/link destinations, support mail link, locale/query preservation | PASS |
| Authentication | Labels, native validation, known/unknown feedback, unsafe `next`, invalid callback/recovery states | FIXED AND VERIFIED |
| Guest challenge | Five fields, Unicode/Norwegian/HTML-like input, reload, navigation, Markdown copy/download, malformed storage | FIXED AND VERIFIED |
| Guest failure states | Quota/security write failure and delayed hydration | FIXED AND VERIFIED |
| Protected routes | 12 representative anonymous paths plus 66 locale-expanded checks | FIXED AND VERIFIED |
| Health route | Missing Bearer token returns generic 401 | PASS |
| Friends/groups/messages/notifications | Source/RLS and anonymous route protection | BLOCKED for authenticated operations |
| Challenge cloud workspace | Source/RLS and anonymous route protection | BLOCKED for authenticated operations |
| Admin/settings | Source authorization and anonymous protection | BLOCKED for authenticated role checks |
| Responsive | Five required viewports | PASS on public surfaces |
| Accessibility | Public labels, focus, dialog keyboard flow, heading hierarchy, duplicate IDs | FIXED AND VERIFIED |
| Production smoke | Root, EN/NB landing, login/signup/forgot, protected redirect, assets, desktop/mobile, console | PASS |

## 8. Confirmed defects

Twenty-five defect groups were confirmed. Twenty were corrected in the worktree; five remain unresolved or require a real test database:

1. Deep protected routes lost their post-login destination.
2. Auth `next` validation accepted canonicalized `..` traversal into another locale.
3. Password textbox names included the show/hide button label.
4. Login/signup/resend/reset submissions lacked pending protection.
5. Temporary login failures were misreported as invalid credentials.
6. Guest storage write failures crashed the page.
7. Delayed guest hydration overwrote early typing.
8. Guest dialog lacked focus entry/trap, Escape close, and focus restoration.
9. Existing task fields and friend search lacked persistent accessible names.
10. Landing heading order skipped from H1 to H3.
11. Playwright's `127.0.0.1` default conflicted with Next.js 16 development-origin rules.
12. Friend/group acceptance duplicated trigger writes and displayed failure after success.
13. Group collaborators could update a linked challenge's `owner_id` and take ownership.
14. A group member could link another user's private challenge by UUID.
15. Invitees could alter invitation group/role/identity fields during acceptance.
16. `notify_user` was a callable public security-definer RPC.
17. Friendship and group membership consent could be bypassed by direct inserts.
18. A group admin could manufacture an owner membership, and the last owner could be demoted.
19. Pending invitees could not read the invited group name; related notification destinations were unsafe or absent.
20. Group invitation cancellation and admin member-removal controls disagreed with RLS/action rules.
21. Nine locale catalogs contain extensive placeholder-quality copy. **UNRESOLVED**.
22. Some social mutations still need affected-row assertions to avoid false success on RLS-filtered IDs. **UNRESOLVED / database verification required**.
23. Direct activity-event insertion remains broader than ideal. **UNRESOLVED hardening**.
24. Security-definer access helper RPCs expose low-severity relationship oracles for known UUIDs. **UNRESOLVED hardening**.
25. Concurrent first section saves and unguarded non-auth mutation forms need idempotency/uniqueness verification. **UNRESOLVED / database verification required**.

## 9. Root causes

- Shared protected layout hardcoded `/app` instead of receiving the request path.
- Redirect checks validated raw strings rather than canonical URLs.
- Interactive buttons were nested inside labels.
- Browser storage writes were unguarded and hydration was timer-deferred while inputs were enabled.
- Supabase table-wide grants allowed identity/ownership column updates.
- RLS policies checked group role without challenge ownership or immutable invitation fields.
- Trigger-owned consent flows were duplicated in server actions and also exposed through direct INSERT grants.
- A security-definer trigger helper retained PostgreSQL's default public execute privilege.
- Product UI conditions and RLS role rules had drifted.

## 10. Corrections implemented

- Added canonical localized redirect validation in `lib/auth/safe-redirect.ts`.
- Passed the request path through the Next.js 16 proxy and preserved deep protected destinations.
- Corrected shared password labeling and auth pending states.
- Classified invalid credentials separately from temporary login unavailability.
- Hardened guest storage/hydration and dialog keyboard/focus behavior.
- Added accessible names for task fields and friend search; repaired landing heading hierarchy.
- Enforced app-layer challenge editor-role checks and made viewer mutation forms inert.
- Removed duplicate acceptance inserts and aligned group control visibility/cancellation behavior.
- Corrected friend/group-invitation notification destinations.
- Added forward-only migration `20260716120000_full_application_audit_security_repairs.sql` to restrict mutable columns, preserve consent/ownership, validate challenge linking, expose pending invite group names, preserve a last owner, and revoke notification RPC execution.

The migration is not applied locally or remotely and must follow the project's approved migration workflow.

## 11. Regression tests added

- 43 Playwright cases generated at runtime across seven E2E files.
- Two logical security regression subtests in one Node test file.
- Coverage files: public, auth, guest, permissions, i18n, responsive, production smoke, and authorization migration/action invariants.
- Failure-only screenshots and traces are configured. Video is omitted because system Chrome was reused without downloading Playwright FFmpeg.

## 12. Security and authorization results

| Control | Result |
|---|---|
| Anonymous protected-route access | PASS |
| Internal auth redirects | FIXED AND VERIFIED |
| Service-role browser exposure | PASS source review |
| Current-user account deletion identity | PASS source review; destructive test BLOCKED |
| Challenge ownership/group link RLS | FIXED LOCALLY; migration application and live verification BLOCKED |
| Invitation identity/role immutability | FIXED LOCALLY; live verification BLOCKED |
| Trigger-only friendship/membership consent | FIXED LOCALLY; live verification BLOCKED |
| Public notification RPC | FIXED LOCALLY; deployed ACL verification BLOCKED |
| Admin role self-promotion | PASS source review |
| Message/notification privacy | PASS source/RLS review; two-user browser verification BLOCKED |
| Secret/log scan | PASS; no tracked `.env.local`, credential logging, or client service-role import found |

There were five high-severity authorization findings in unapplied migration logic. All have focused local corrections, but production remains at risk until the migration is reviewed, applied, and verified.

## 13. Accessibility observations

- Password field accessible names are repaired.
- Guest dialog now receives/traps/restores focus and closes on Escape.
- Task description/responsible/deadline and friend search have accessible names.
- Landing heading hierarchy no longer skips a level.
- Public browser matrices found no unnamed visible controls, duplicate IDs, or missing meaningful image alt text.
- Authenticated protected UI remains browser-blocked.

## 14. Responsive-layout observations

- No horizontal overflow at the five requested viewports on representative public pages.
- Public forms, CTAs, language selector, support page, and guest dialog remained usable at 320 px.
- Long public copy wrapped without overlap.
- Authenticated challenge/group/settings layouts remain source-reviewed only.

## 15. Production smoke-test results

**PASS** for the explicitly non-destructive smoke test:

- Root redirected to English.
- English and Norwegian landing pages rendered.
- Login, signup, and forgot-password pages rendered.
- Anonymous protected access redirected to login.
- Static assets loaded.
- Desktop/mobile landing layouts had no horizontal overflow.
- No major browser console errors were observed.

Production still loses protected deep-link destinations and contains the old password labeling because this audit did not deploy the local fixes.

## 16. Blocked tests and exact reasons

- Successful login/signup/logout: no disposable credentials.
- Email confirmation/resend/password recovery: no disposable inboxes or valid artifacts; rate limits must not be bypassed.
- Challenge cloud CRUD/autosave/print/cross-user IDOR: no authenticated users and unknown Supabase target.
- Friends/groups/invitations/messages/notifications: two disposable users unavailable.
- Admin/non-admin checks: admin credentials unavailable.
- Account/challenge/group deletion: destructive tests prohibited without a proven non-production database.
- Authorized health RPC: secret unavailable and must not be printed.
- Migration/RLS execution: environment target cannot be identified without reading prohibited `.env.local` values; Docker/Supabase database was unavailable to agents.

## 17. Remaining manual tests

Use a dedicated preview/test Supabase project and `E2E_USER_A_*`, `E2E_USER_B_*`, and `E2E_ADMIN_*` variables to execute the full challenge, friend, group, message, notification, settings, admin, and cross-user authorization matrices. Apply the new migration only after review. Have fluent reviewers replace placeholder copy in the nine affected locale catalogs. Verify authenticated print-to-PDF pagination in Chromium and Firefox.

## 18. Final validation command results

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:security` | PASS |
| `E2E_BASE_URL=http://localhost:3000 npm run test:e2e -- --workers=2` | 42 PASS, 1 production-gated SKIP |
| `E2E_BASE_URL=https://noproblemo.tech E2E_PRODUCTION_URL=https://noproblemo.tech npx playwright test tests/e2e/production-smoke.spec.ts --workers=1` | 1 PASS |
| Affected final Playwright rerun (`auth`, `guest`, `public`) | 13 PASS |
| 11-locale JSON parse/key parity | PASS: 722 leaf keys |
| `npm run build` | PASS: 180 static pages generated |
| `git diff --check` | PASS |

## 19. Residual risks

- The security migration is unapplied; deployed RLS/function ACL state is unknown.
- Production has not received any fixes from this audit.
- Authenticated workflows and cross-user privacy were not browser-verified.
- Nine locale catalogs contain substantial placeholder content.
- Direct activity insert permissions and helper RPC metadata exposure merit a follow-up hardening migration.
- Mutation idempotency and affected-row verification need database-backed regression tests.
- `challenge_sections` has no database uniqueness guarantee for `(challenge_id, section_key)`.
- Dependency installation reported the two already-documented moderate Next.js/PostCSS advisories; the unsafe forced downgrade was not applied.

## 20. Recommended next QA priorities

1. Review and apply the audit security migration to a dedicated test/preview Supabase project.
2. Run the two-user/admin Playwright matrix with disposable accounts and clean up `CODEX-QA-` records.
3. Add direct Supabase REST/RPC integration tests for every repaired RLS boundary.
4. Add idempotency/affected-row checks for remaining mutation actions.
5. Replace placeholder translations with fluent human-reviewed copy.
6. Re-run the complete suite on a Vercel Preview before any production deployment.

## 21. Production disposable-account continuation — 2026-07-16

### Safety boundary and accounts

- The linked project reference and the ignored E2E configuration both match the expected production project `jxjoyugkozbldwimqjuw`.
- `.env.e2e.local` is ignored, untracked, and permission mode `600`. All required variable names are present. No credential value, cookie, token, key, or connection string was added to the repository or report.
- Browser attempts identified the configured accounts only as User A, User B, and User C.
- No remote reset, truncation, SQL authorization test, migration application, deployment, commit, push, merge, password change, recovery request, account deletion, or role change was performed.

### Local migration result

**PASS.** Docker 29.6.1 and Supabase CLI 2.109.1 were available. `supabase start` started only the local stack. `supabase db reset --local` applied all six migrations in order, including `20260716120000_full_application_audit_security_repairs.sql`. The complete chain passed before and after the pending migration correction.

Local inspection confirmed 61 RLS policies and 27 public-schema triggers. A 32-assertion pgTAP suite passes for challenge ownership, linked challenge editor/viewer boundaries, invitation immutability, friendship and membership insert restrictions, last-owner preservation, self-promotion prevention, notification RPC privileges, activity insertion scope, message and notification privacy, section uniqueness, and affected-row behavior. `supabase db lint --local` reports no schema errors.

The pending forward migration was corrected without changing historical migrations:

- Revoke browser-role `TRUNCATE`, `REFERENCES`, and `TRIGGER` table privileges, which RLS does not protect.
- Restrict updateable child-record columns so challenge relationships are not client-mutable.
- Add unique `(challenge_id, section_key)` enforcement.
- Remove default anonymous/public function execution and re-grant only intended RPCs.
- Retain the existing `notify_user` denial.
- Pair the uniqueness rule with a duplicate-key retry in section saves for deterministic repeated/concurrent saves.

### Remote migration review

**PASS, dry run only.** `supabase migration list --linked` shows the first five migrations on both local and remote history. `20260716120000` is the only local-only migration. `supabase db push --dry-run --linked` reports that only `20260716120000_full_application_audit_security_repairs.sql` would be applied.

No remote migration was applied. The exact manual apply command is:

```bash
supabase db push --linked
```

Before approval, a trusted operator should check production for duplicate `(challenge_id, section_key)` rows because the new unique index intentionally fails rather than deleting or rewriting existing data.

### Authentication results

Five distinct production authentication cases were executed with one worker and credential-bearing traces/screenshots disabled:

- User A login: **BLOCKED**, production returned the privacy-safe invalid-credentials state.
- User B login: **BLOCKED**, same result.
- User C login: **BLOCKED**, same result.
- Protected deep-link preservation: **FAIL on deployed production**; `/en/app/challenges/new` was reduced to `/en/app` before login. The branch already contains the undeployed correction.
- Incorrect-password/pending-state check: incorrect credentials were rejected safely, but the deployed submit button remained enabled while the request was held. The branch already contains the undeployed pending-state correction.

Both shell loading and Node's dotenv parser produced the same three-account login result. No successful session was established. Session persistence, authenticated redirect away from login/signup, and logout therefore remain blocked. Password recovery was not invoked.

### Authenticated workflow results

| Domain | Result |
|---|---|
| Challenge lifecycle, autosave, explicit saves, sections, solutions, tasks, summary | BLOCKED: no disposable account could authenticate |
| Friends request/accept/remove/decline matrix | BLOCKED: no disposable account could authenticate |
| Groups invitations and owner/admin/member/viewer controls | BLOCKED: no disposable account could authenticate |
| Group-linked challenges and collaborator/viewer behavior | BLOCKED in production; PASS in the 32-test local database suite |
| Messages, Unicode/multiline/order/reload/privacy | BLOCKED in production; privacy and empty-message boundaries PASS locally |
| Notifications, read state, and destination links | BLOCKED in production; privacy and RPC ACL boundaries PASS locally |
| Admin positive/negative browser checks | BLOCKED: User C's role could not be determined without a session; no role was changed |
| Cross-user private challenge/group/message access | BLOCKED in production; representative RLS boundaries PASS locally |
| Print layout and PDF rendering | BLOCKED: no authenticated challenge could be opened |

No multi-user production test could begin. No unexpected real-user data became visible.

### Defects found and local repair status

1. **Confirmed locally and fixed in the pending migration:** browser roles retained non-DML table privileges not protected by RLS.
2. **Confirmed locally and fixed in the pending migration/application:** challenge sections lacked database uniqueness and deterministic duplicate-save recovery.
3. **Confirmed in deployed production, already fixed on this branch:** protected deep links collapse to `/app`.
4. **Confirmed in deployed production, already fixed on this branch:** login submit has no pending/duplicate-submit protection.
5. **Blocking prerequisite, not yet classified as an application defect:** all three configured disposable credentials are rejected by production.

Remaining security risks include the unapplied migration, authenticated relationship helper RPC oracles for known UUIDs, client-authorized activity-event inserts that can create permitted-scope noise, and server actions that may report success after an RLS-filtered zero-row mutation. These require follow-up hardening or authenticated production verification; they were not broadened into unapproved production SQL tests.

### Cleanup and disposable records

- Production records created: **none**.
- Production records deleted or modified: **none**.
- Disposable records left behind by this continuation: **none**.
- Stored browser authentication state: **none created**.
- Failure artifacts from credential-bearing attempts: **deleted**.
- Local pgTAP fixture rows: rolled back by the test transaction.

### Validation commands and results

| Command | Result |
|---|---|
| `supabase start` | PASS, local stack only |
| `supabase db reset --local` | PASS before and after migration correction; six migrations applied |
| `supabase test db --local supabase/tests/database/full_application_audit.test.sql` | PASS, 32 tests |
| `supabase db lint --local` | PASS, no schema errors |
| `supabase migration list --linked` | PASS, only `20260716120000` is local-only |
| `supabase db push --dry-run --linked` | PASS, would apply only the expected migration |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:security` | PASS |
| `npm run test:e2e -- --workers=2 --reporter=list` | 41 PASS, 6 SKIP, 1 transient Spanish dev-server failure |
| `npx playwright test tests/e2e/i18n.spec.ts --workers=1 --reporter=list --grep 'es boots'` | PASS on focused rerun |
| `node --env-file=.env.e2e.local node_modules/@playwright/test/cli.js test tests/e2e/production-smoke.spec.ts --workers=1 --reporter=list` | PASS, 1 test |
| Production authenticated spec with Node dotenv loading and one worker | 5 FAIL: three invalid-credential blockers plus two confirmed deployed regressions |
| 11-locale JSON parse/key parity | PASS, 722 leaf keys |
| `npm run build` | PASS, 180 static pages generated |
| `git diff --check` | PASS |

### Residual production risks and decision

- Production still lacks the pending RLS/ACL/uniqueness migration and all undeployed application repairs on this branch.
- The unique-index migration is locally valid, but manual approval should include a duplicate-row preflight that does not mutate data.
- Authenticated, multi-user, admin, notification-link, and print/PDF behavior remains unverified because the disposable credentials do not authenticate.
- The migration is ready for security review and conditional manual production approval after the duplicate-row preflight.
- Application changes are ready for code review, lint/type/build validation, and preview testing, but not for production deployment approval until working disposable credentials allow the blocked matrix to complete.

## 22. Corrected-credential authenticated production continuation — 2026-07-16

### Safety and account precheck

- User A, User B, and User C all authenticated successfully from the ignored `.env.e2e.local` file. No credential value, cookie, token, key, or stored browser-authentication state was printed or committed.
- `.env.e2e.local` remains ignored and permission mode `600`; the configured production reference and URL still match `jxjoyugkozbldwimqjuw` and `https://noproblemo.tech`.
- Every stateful production run used one Playwright worker and a separate browser context for each user.
- No remote reset, truncation, direct production SQL authorization test, migration application, deployment, commit, push, merge, password change, recovery request, account deletion, or role change was performed.
- During the focused local group regression, `supabase start` printed its standard disposable local-development credentials to the terminal. No production credential was exposed, copied into a file, or committed.

### Counts and authentication results

Thirteen distinct authenticated production Playwright cases were defined and executed: six authentication cases, one complete User A challenge/print case, five admin/inventory cases, and one stateful three-user case. The stateful multi-user case completed the friend and private-challenge steps but stopped at group creation. Three temporary profile-recovery executions were cleanup-only and are not included in the authenticated test count.

| Case | Result |
|---|---|
| User A login, reload persistence, logout | PASS |
| User B login, reload persistence, logout | PASS |
| User C login, reload persistence, logout | PASS |
| Authenticated redirect away from login/signup | FAIL on deployed production; fixed locally in both server pages with a focused regression |
| Protected deep-link restoration | FAIL on deployed production; existing undeployed branch repair retained |
| Incorrect-password, pending, duplicate-submit behavior | Incorrect password PASS; pending/duplicate prevention FAIL on deployed production; existing undeployed branch repair retained |

### Challenge and print/PDF results

**PASS with cleanup limitation.** User A created an owned `CODEX-QA-` challenge, edited title/description/status, saved all eight workflow sections, used Norwegian characters, Chinese text and multiline content, repeated section saves conservatively, and verified reload persistence. Solution scores/pros/cons/priority/resources and a task/deadline/responsible person were created and then deleted through the UI. Sequential repeated saves remained stable. The UI has explicit saves but no autosave; an unsaved summary edit correctly disappeared after reload.

The protected print route rendered the saved summary, hid both application chrome and print controls under print media, and generated a non-empty A4 PDF in memory. No screenshot or credential-bearing PDF artifact was retained. The application has no challenge-delete action, so owned challenge rows and their sections remain.

### Friends, notifications and privacy results

- Self-request prevention: PASS; the current profile was not actionable.
- Friend request creation and duplicate prevention: PASS; the duplicate normal-UI request was rejected.
- Accept, remove and second-request decline: PASS by final application state.
- Accept feedback: FAIL on deployed production; the friendship appeared correctly but the page displayed `friend-response-failed` instead of the success state. This is consistent with the deployed affected-row/status mismatch already identified as a risk.
- Friend-request notification generation and read-state mutation: PASS.
- Friend-request notification destination: FAIL on deployed production; the rendered card had no destination link. The current branch source already renders the friends destination, so production contains older behavior.
- User B direct navigation to User A's unlinked private challenge: PASS denial with HTTP 404.
- User C remained unrelated to the A/B workflow. No unexpected real-user content became visible.

### Groups, linked challenges, messages and broader notifications

**BLOCKED by production group creation.** User A submitted the normal create-group form with an owned `CODEX-QA-` name and production returned `group-create-failed`. Read-only inventory confirmed that no prefixed group was created. The test stopped the dependent invitation, role, linked-challenge, group-message and group-notification branches instead of bypassing the application.

The newly relevant local regression passes: under the authenticated database role, an owner can insert a group and the trusted trigger creates exactly one owner membership. The focused pgTAP file now passes 34 assertions. This isolates the blocker to deployed production state/application behavior rather than the pending migration chain. Because no group could be created, editor/viewer browser checks, removed-member access, multiline group messages, message order/reload, third-user conversation privacy and group notification destinations remain blocked in production. Their database authorization boundaries continue to pass locally.

### Admin results

User A, User B and User C are ordinary users. All three were denied the admin overview with HTTP 404 and none received an Admin navigation link. User C is not an intentionally configured disposable administrator, so administrator-positive testing remains blocked. No admin role or real-user data was changed or opened.

### Defects and local repairs

1. Authenticated login/signup pages did not redirect an existing session. Fixed locally by checking the server Supabase session and redirecting to the sanitized destination; a security regression covers both pages.
2. Protected deep-link restoration and login pending/duplicate-submit behavior still fail in production; both already have undeployed branch repairs.
3. Friend acceptance reaches the correct relationship state but reports failure in production. The deployed result remains unresolved; no speculative local database change was made.
4. Friend-request notification destination links are missing in production. The current branch already renders them.
5. Normal production group creation fails. The same authenticated create plus owner-trigger path passes locally, so the pending migration was not changed.
6. Autosave and challenge/group deletion are not implemented, limiting requested behavior and cleanup.

### Cleanup and records remaining

- Temporary `CODEX-QA-` display names were cleared/restored; no password or account was changed.
- No prefixed group, group membership, group invitation, or message was created.
- The completed solution and task were deleted through the application.
- The friend workflow ended without an intended active friendship or pending request. Historical disposable request and notification rows remain because the application exposes no history-delete control.
- Four owned challenges remain because the application exposes no challenge-delete control:
  - User A: `CODEX-QA-mrnmjn7j-153286-challenge-A`
  - User A: `CODEX-QA-mrnlzp4u-149985-utfordring-æøå-你好`
  - User A: `CODEX-QA-mrnlyfe3-149680-utfordring-æøå-你好`
  - User B: `CODEX-QA-mrnmjn7j-153286-challenge-B-private`
- No stored authentication-state file was created. Generated Playwright failure output is ignored and will be removed after the final validation summary is captured.

### Exact validation results

| Command | Result |
|---|---|
| Production authenticated account spec, one worker | 3 PASS login/session/logout; 3 FAIL deployed redirect/deep-link/pending regressions |
| Production User A challenge/print spec, one worker | 1 PASS after one selector-only aborted setup |
| Production stateful three-user spec, one worker | 1 PARTIAL/FAIL: friends and private challenge denial completed; group creation blocked remaining steps |
| Production admin/inventory spec, one worker | 5 PASS; all users ordinary, owned prefixed inventory only |
| Focused User C admin rerun | 1 PASS, ordinary user denied |
| `supabase test db --local supabase/tests/database/full_application_audit.test.sql` | PASS, 34 tests including authenticated group creation and owner membership |
| `npm run test:security` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `node node_modules/@playwright/test/cli.js test tests/e2e/auth.spec.ts --workers=1 --reporter=list` | PASS, 5 tests |
| `npm run build` | PASS, 180 static pages generated |
| `git diff --check` | PASS |

The previously completed remote review was not repeated: `20260716120000_full_application_audit_security_repairs.sql` remains the only intended pending migration from the successful dry run. No remote migration was applied. The exact manual command remains:

```bash
supabase db push --linked
```

Do not run it without manual approval and the documented duplicate `(challenge_id, section_key)` preflight. The migration remains ready for conditional manual production approval. Application changes are ready for code review, but production deployment approval remains blocked by the reproducible group-creation failure and the uncompleted group/message/viewer/editor matrix.

## 23. Production group-creation blocker diagnosis and local repair — 2026-07-16

### Safety boundary and exact failure

The investigation used the existing production browser result, a schema-only read of the linked production database, and rollback-scoped/local database tests. It did not query production row data or execute a production write. No remote reset, truncation, migration application, deployment, configuration change, commit, push, or merge occurred.

The safe failure category is `42501 / returning-row-select-denied`. The failing operation was the deployed `createGroup` server action's single PostgREST request:

```text
INSERT groups (...) RETURNING id
```

The INSERT policy permits an authenticated user to create a group whose `owner_id` matches `auth.uid()`. The SELECT policy permits the row only after `is_group_member(id, auth.uid())` is true. Owner membership is created by an after-insert security-definer trigger. PostgreSQL applies returned-row RLS before that trigger-created membership can authorize the returned representation, so `RETURNING id` is rejected with `42501`. The statement and all trigger work are transactional: the group, owner membership, group-created activity and member-joined activity are all rolled back. This matches the production inventory result of no prefixed group or partial side-effect data.

### Production/local metadata comparison

The schema-only production dump and the local schema after all six migrations agree on the blocker-relevant database objects:

- `groups` and `group_members` columns, UUID defaults, foreign keys and the four-value group-role check are equivalent. UUID generation uses `gen_random_uuid()`; no sequence privilege is involved.
- RLS is enabled on both tables. Production and local both have `groups_insert_owner` and the membership-dependent `groups_select_member` policy.
- Both have `groups_create_owner_member`, `groups_activity_created` and `group_members_activity_joined` after-insert triggers.
- `create_owner_group_member()` and `create_group_activity()` are owned by `postgres`, are `SECURITY DEFINER`, and set `search_path` to `public` in both environments.
- Group ownership and membership reference `auth.users`; group creation has no profile-row dependency. The successful local ordinary-user test deliberately has no matching profile row.
- Production grants authenticated users group INSERT capability. Its broader table/function grants and direct membership-insert policy are narrowed by the pending audit migration, while local also has the pending-invitee group SELECT policy. Those expected pending-migration differences do not affect the reproduced `INSERT ... RETURNING` failure.
- The owner-membership and activity trigger bodies are identical in production and local. Duplicate group names are allowed, defaults are present, and the trusted owner trigger uses `ON CONFLICT` defensively.

The pending migration is therefore not the cause of group creation failure and was not changed for this repair.

### Local correction and regression coverage

`createGroup` now generates an explicit UUID, performs the group insert without requesting a returned representation, then makes a separate owner-scoped SELECT for that exact UUID. Success is reported only after that verification finds the expected row. It continues to rely on the trusted owner-membership trigger and does not insert a membership from application code.

Insert failures and post-insert verification failures now produce distinct safe query categories (`failure=insert` and `failure=verification`) for controlled regression diagnosis. The translated production-facing error remains the existing generic `group-create-failed` message; no database detail, row data, credential, token, or SQL text is exposed.

The database regression suite now proves all of the following:

- authenticated `INSERT ... RETURNING id` fails with `42501` under the current secure policy/trigger design;
- that rejected statement leaves zero partial group rows;
- a minimal authenticated insert succeeds for a user with no profile row;
- the owner trigger creates exactly one owner membership;
- a separate owner-scoped statement can read the group after trigger completion; and
- both expected group/member activity events commit.

The focused application security regression asserts the explicit ID, minimal insert, separate ID-and-owner verification read, distinct safe failure categories, and absence of a duplicate application-side membership insert.

### Release dependency and remaining blocker

This is an application-code defect, not a database, migration, or external-configuration defect. Application deployment is required; migration application is not required to fix group creation. They do not need to be released atomically. Recommended order:

1. Review and deploy the application correction through the normal approved workflow.
2. Re-run one `CODEX-QA-` group creation through the normal production application and verify the owner membership/activity UI.
3. Resume the invitation, accept/decline, owner/admin/member, linked-challenge, editor/viewer, messaging, third-user privacy and group-notification matrix with one worker.
4. Review and apply the independent pending security migration only after its documented duplicate-section preflight and separate manual approval.

The production group creation attempt was not repeated because production cannot contain this local correction without the prohibited deployment. The dependent collaboration matrix remains blocked for the same reason. No new production data was created, so no additional cleanup was required.

### Exact validation results

| Command or check | Result |
|---|---|
| Local authenticated `INSERT ... RETURNING id` reproduction | PASS: safely reproduced SQLSTATE `42501` and transaction rollback |
| Read-only production/local public-schema comparison | PASS: blocker-relevant tables, constraints, policies, triggers and function security settings match; only expected pending-migration differences found |
| `supabase test db supabase/tests/database/full_application_audit.test.sql --local` | PASS, 38/38 |
| `supabase db lint --local --level warning` | PASS, no schema errors |
| `npm run test:security` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, 180 static pages generated |
| Focused production Playwright group rerun | Not run: would exercise the unchanged deployed action and cannot validate the prohibited undeployed correction |

Changed for this repair: `app/[locale]/app/actions.ts`, `supabase/tests/database/full_application_audit.test.sql`, `tests/security/authorization-hardening.test.mjs`, `CURRENT_STATE.md`, and this audit report. The pending migration was unchanged by the group repair.

## 24. Post-hotfix production collaboration continuation — 2026-07-16

### Safety, accounts, and test count

- Production behavior from hotfix source commit `28ababe8ae134d46b4fea597d3b15f289ccf14db` is active: normal application group creation completed without `group-create-failed`, and no migration was needed for that result.
- User A, User B, and User C all authenticated from the ignored, mode-`600` `.env.e2e.local` file. Each user had an isolated browser context and the stateful workflow used one Playwright worker.
- No password, token, cookie, key, connection string, or stored authentication state was printed or persisted. No unexpected real-user data became visible.
- The authenticated suite remains 13 distinct production cases cumulatively. This continuation completed the one distinct stateful three-user case through all seven test steps; repeated harness-resume attempts are not counted as additional tests.
- No deployment, commit, push, merge, remote reset, direct production SQL, production configuration change, account/admin-role change, or migration application occurred. The only role transitions were the explicitly requested disposable group-member checks.

### Group creation and collaboration results

The normal production UI created `CODEX-QA-mrnoqjsw-192105-group` (`4d7bb92a-d008-4079-b0be-127c9f551594`). The detail route opened, User A was Owner, the group appeared in inventory, group-created and member-joined activity were visible, reload persistence passed, and non-member User C received a 404. The hotfix therefore resolves the original production blocker without the pending migration.

| Area | Production result |
|---|---|
| Invitation create and duplicate prevention | PASS; the first invite persisted and a second pending invite was rejected |
| Invitation cancel and decline | PASS; both states disappeared from the invitee inventory after bounded reload polling |
| Invitation accept | PARTIAL; membership and the assigned role were created, but the deployed action displayed `group-invitation-response-failed` because it performs a redundant membership insert after the trigger |
| Pending invitation identity | FAIL; Users B/C saw `Unnamed group` because the pending-invitee group SELECT policy is still only in the unapplied migration |
| Owner/member/admin controls | PASS; User A remained Owner, Member B had no management/self-promotion controls, Admin B could edit group settings but could not assign roles, and User A restored B to Member |
| Last-owner behavior | PASS through the normal UI; User A had no self-demotion, self-removal, or leave control |
| Non-member access | PASS; User C received 404 before invitation acceptance and Users B/C received 404 for the group and linked challenge after removal |
| Linked challenge eligibility | PASS; each user saw only their own eligible private challenge, and User A linked only User A's challenge |
| Editor boundary | PASS; User B's editor update persisted and no ownership mutation input was exposed |
| Viewer boundary | SECURITY PASS / UI FAIL; User C could read but not send messages, the attempted detail mutation did not persist after reload, and no ownership input was exposed, but the deployed page still exposed an editable/save form |
| Group messages | PASS; empty HTML validation, normal text, multiline Norwegian/Unicode, sender identity, newest-first order, reload persistence, and message notification behavior passed |
| Removed-member message/privacy boundary | PASS; removed users lost group/challenge access and User C received no notification for the post-removal message |
| Activity | PASS; group creation was verified before it aged out of the recent window; later reads confirmed group update, member join/removal, challenge-link, and group-message activity |
| Admin | PASS negative / BLOCKED positive; A, B, and C are ordinary disposable users and were denied admin access; no production role was changed |

### Notifications and existing friend issue

- Friend request creation, duplicate/self prevention, read state, friendship creation, removal, a second request, and decline all passed.
- Friend acceptance feedback still fails: the friendship is created by the database trigger, but deployed production reports `friend-response-failed` after its redundant friendship insert.
- Friend-request notifications still have no destination link. The QA branch's notification link correction remains undeployed.
- Group-invitation notifications are generated, but their deployed destination is the private group route. A pending invitee cannot open that route, so the safe destination must be the group invitation list. The QA branch contains that application correction.
- Group acceptance/decline response notifications and group-message notifications were present for the disposable accounts. Group-message destination/read-state checks passed.

### Defects and local repair status

No new application code repair was needed during this continuation. The run reconfirmed four undeployed QA repairs and one migration-dependent display repair:

1. Friend acceptance reports failure after successfully creating the friendship; the QA action already relies on the trigger instead of performing a duplicate insert.
2. Friend-request notifications lack a destination; the QA notification page routes them to `/app/friends`.
3. Group acceptance reports failure after successfully creating membership; the QA action already relies on the trigger instead of performing a duplicate insert.
4. Group-invitation notifications point at an unreadable private group; the QA notification page routes pending invitations to `/app/groups`.
5. At the time of this continuation, pending invitees could not read the group name and the reviewed migration used `groups_select_pending_invitee`; section 25 replaces that broad base-table policy with a minimal RPC.
6. The deployed viewer challenge page exposes mutation controls even though RLS prevents persistence; the QA branch's inert-viewer UI remains undeployed.

Focused production-spec corrections added in this continuation cover interrupted-state normalization, retained-group/challenge reuse, bounded invitation-list refresh, and the viewer persistence assertion. They do not alter production application behavior.

### Cleanup and retained disposable records

- PASS through normal application actions: friendship/request state, all pending invitations, B/C memberships, linked challenge, and all generated group messages were removed. Profile display names were restored.
- Read-only final inventory: zero cancelable invitations, zero B/C removal controls, zero invitee accept/decline controls, zero linked challenges, and zero prefixed message articles for the audit group.
- Production has no group-delete UI, so these proven disposable groups remain:

| Group name | Group id | Source |
|---|---|---|
| `CODEX-QA-mrnoqjsw-192105-group` | `4d7bb92a-d008-4079-b0be-127c9f551594` | This production continuation |
| `CODEX-QA-HOTFIX-mrno52nv` | `8ea4421a-0e31-4475-8c9a-2e7bccdb9558` | Prior hotfix Preview verification against the same production Supabase project |

- Ten prefixed disposable challenges remain across the five known A/B challenge pairs (`mrnmjn7j`, `mrnoqjsw`, `mrnovzgc`, `mrnp2fli`, and `mrnp7gb5`). The final run reused the `mrnp7gb5` pair instead of creating more.
- Disposable notification and activity history remains because the UI exposes no delete action. All such records belong to the three disposable accounts and the proven disposable group/challenges.

### Exact validation results

| Command or check | Result |
|---|---|
| Production multi-user Playwright spec with the existing group/challenge overrides and `--workers=1` | Completed all seven steps and cleanup; test process FAIL only because eight expected production defects were retained as soft assertions |
| Final normal-UI cleanup inventory | PASS: no pending invites, B/C membership controls, linked challenge, or prefixed messages remain |
| `npm run test:security` | PASS, 1/1 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, 180 static pages generated |
| `git diff --check` | PASS after documentation update |

The isolated group-creation hotfix is ready to merge into `main`. The broader QA branch is ready for review, but not for a blind production release: the application fixes above need preview/release review, and the independent pending migration still requires its documented duplicate-section preflight and separate manual approval.

## 25. Final least-privilege migration preflight — 2026-07-16

### Pending invitation correction

The unapplied audit migration no longer grants pending invitees a `groups` SELECT policy. It now defines the argument-free, stable, `SECURITY DEFINER` RPC `pending_group_invitations()` with an empty fixed `search_path`, explicit `postgres` ownership, and explicit execution revocation from `PUBLIC`, `anon`, and `authenticated` before re-granting only to `authenticated`.

The function filters internally on `auth.uid()`, requires `pending` status, and returns only invitation ID, group ID, group name, and invited role. It exposes no owner ID, description, group timestamps, arbitrary user argument, membership data, challenge data, or message data.

The QA groups page keeps its RLS-protected pending-invitation query so it can render the existing localized `Unnamed group` fallback before the migration exists. It calls the minimal RPC for pending invitation identity when available and queries base `groups` rows only for actual memberships. Group-invitation notifications continue linking to the localized group invitation list. No service-role or privileged browser client was added.

### Local and production-safe evidence

| Command or check | Result |
|---|---|
| Complete empty local six-migration chain | PASS |
| `supabase test db --local supabase/tests/database/full_application_audit.test.sql` | PASS, 50/50 |
| Pending invitee base group read | PASS denial |
| Minimal RPC own-pending filtering and output shape | PASS |
| Anonymous RPC execution | PASS denial |
| Existing member group read and invitation accept/decline | PASS |
| `supabase db lint --local --level warning` | PASS, no schema errors |
| `npm run test:security` | PASS, 1/1 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, 180 static pages generated |
| `git diff --check` | PASS |
| Secret-value scan | PASS, zero matches |
| Generated-artifact scan | PASS, no tracked output |
| Production duplicate refresh | PASS: 21 rows, zero duplicate groups |
| Fresh linked migration history | BLOCKED: Supabase CLI access token unavailable |
| Fresh linked dry run | BLOCKED: Supabase CLI access token unavailable |
| Fresh roles/schema/data backup | BLOCKED: Supabase CLI access token unavailable |

No migration, deployment, production write, credential change, commit, push, merge, or history repair was performed. The local Supabase stack was stopped after validation. Manual production migration approval remains blocked until a trusted operator provides CLI authentication and successfully completes the linked history check, expected-only dry run, and fresh external backup.

## Generated files excluded from Git

- `test-results/`
- `playwright-report/`
- `blob-report/`
- `.playwright-mcp/`
- Agent screenshots and scripts under `/tmp/noproblemo-agent5-audit`

No authenticated browser state, cookies, passwords, tokens, or videos are tracked.
