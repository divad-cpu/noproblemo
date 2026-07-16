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

## Generated files excluded from Git

- `test-results/`
- `playwright-report/`
- `blob-report/`
- `.playwright-mcp/`
- Agent screenshots and scripts under `/tmp/noproblemo-agent5-audit`

No authenticated browser state, cookies, passwords, tokens, or videos are tracked.
