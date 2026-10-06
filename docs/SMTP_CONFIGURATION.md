# Current provider — 2026-10-06

SMTP has been transferred to Neon Auth using the owner-supplied sending key. Host, TLS port, sender address and sending domain remain the same. SMTP authentication has passed; native app password recovery and account operations are separately verified. One owner-authorized verification email was delivered and opened, and the verified account successfully logged in on the live domain.

The following verification records describe the historical Supabase configuration and are preserved unchanged. See `NEON_MIGRATION.md` for current runtime and production gates.

# NoProblemo Custom SMTP and Auth Email Operations

Last verified: 2026-08-01

## Purpose and scope

This document is the operational record for NoProblemo production Auth transactional email. It covers Resend Custom SMTP, Vercel DNS, Supabase Auth email behavior, controlled verification, credential lifecycle, troubleshooting, and rollback. It does not cover marketing email, support-mailbox operations, email automation, or project-log email delivery.

## Service responsibilities

| Responsibility | Service |
| --- | --- |
| Domain registrar | Domeneshop |
| Authoritative DNS | Vercel DNS |
| Web hosting | Vercel |
| Authentication | Supabase Auth |
| Transactional email transport | Resend |
| Credential storage | Password manager and hosted provider settings; never Git |

`noproblemo.tech` uses `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. Domeneshop remains the registrar; it is not the authoritative DNS zone for these records.

## Verified production configuration

| Setting | Verified value |
| --- | --- |
| Production application | `https://noproblemo.tech` |
| Supabase project reference | `jxjoyugkozbldwimqjuw` |
| Resend sending domain | `mail.noproblemo.tech` |
| Sender | `NoProblemo <no-reply@mail.noproblemo.tech>` |
| Resend region | `eu-west-1` |
| SMTP host | `smtp.resend.com` |
| SMTP network port | `465` (implicit TLS) |
| SMTP username | `resend` |
| SMTP password | Permanent restricted Resend sending-only key, present/redacted in hosted read-back |
| Supabase email provider | Enabled |
| Send Email Auth Hook | Disabled |
| Email auto-confirm | Disabled; confirmation is required |
| Secure email change | Enabled |
| Auth email limit | `30` project-wide email-triggering requests per hour |
| Site URL | `https://noproblemo.tech` |
| Production redirect coverage | `https://noproblemo.tech/**` |
| Resend sending | Enabled |
| Resend receiving | Disabled |
| Resend click tracking | Disabled |
| Resend open tracking | Disabled |

The successful Supabase Management API update encoded the SMTP port as the JSON string `"465"`. This is a management-API representation detail; the actual network port is 465. A prior update using numeric `465` received HTTP 400, made no hosted-state change, and had no retained server error body. The JSON-type mismatch was the strongest evidence-supported explanation; it is not proven as the sole server-side cause.

## DNS arrangement

The Resend sending domain is verified. DKIM, return-path MX, and return-path SPF are verified through Resend and were observed through both authoritative Vercel nameservers and public recursive resolvers.

| Purpose | Type | Vercel DNS host | Required value | Status |
| --- | --- | --- | --- | --- |
| DKIM | TXT | `resend._domainkey.mail` | Resend-provided DKIM public key | Verified |
| Return path | MX | `send.mail` | `feedback-smtp.eu-west-1.amazonses.com`, priority `10` | Verified |
| Return-path SPF | TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | Verified |

Do not copy, reformat, or manually reconstruct the DKIM value. Retrieve the current value from the verified Resend domain before any DNS repair. Do not change registrar nameservers to configure this email domain. The more-specific Resend records coexist with Vercel platform apex and wildcard records; they do not replace those records.

## Credential model

| Credential role | Intended state | Use |
| --- | --- | --- |
| `NoProblemo Supabase SMTP` Resend key | Retain | Permanent `sending_access` key restricted to `mail.noproblemo.tech`; used as the Supabase SMTP password |
| `NoProblemo SMTP setup` Resend key | Revoked 2026-08-01 | Former Full-access setup, domain-management, and read-only evidence credential; no longer active or required for ordinary operation |
| `NoProblemo Auth configuration audit` Supabase PAT | Revoked 2026-08-01 | Former 30-day configuration and verification credential; no longer active or required by the running application |

Never store these values, fragments, hashes, or lengths in Git, documentation, terminal history, or logs. Resend secrets are displayed only at key creation and cannot be recovered later.

## Auth route behavior

NoProblemo supports localized routes. English was used for the controlled production test; other supported locales follow the same route shape.

| Flow | Route behavior |
| --- | --- |
| Signup | `/[locale]/signup` calls Supabase signup with an `emailRedirectTo` callback URL |
| Confirmation callback | `/[locale]/auth/callback` exchanges a confirmation code and safely redirects to localized app or login state |
| Login | `/[locale]/login` redirects a successful password sign-in to the safe localized next path, normally `/[locale]/app` |
| Sign-out | `/[locale]/auth/logout` ends the browser session and returns to localized login |
| Recovery request | `/[locale]/forgot-password` requests a reset link with `redirectTo` set to `/[locale]/reset-password` |
| Password update | `/[locale]/reset-password` establishes the recovery session in the browser, updates the password, signs out, and returns to localized login |

In the verified confirmation flow, Supabase confirmed the account and the callback used the documented localized login-required fallback. This is an expected safe result when the callback cannot exchange the session code. No localhost or preview deployment redirect was observed.

## Verification record — 2026-08-01

| Check | Method | Result | Limitation |
| --- | --- | --- | --- |
| DNS records | Vercel read-back, authoritative nameservers, and public resolvers | Required DKIM, MX, and SPF records visible exactly once | Snapshot, not continuous monitoring |
| Resend domain | Authenticated Resend read-back | Domain, DKIM, return-path MX, and SPF verified; sending enabled; receiving/tracking disabled | Provider state can change later |
| SMTP authentication | TLS SMTP connection, AUTH, and NOOP only | Implicit TLS and sending-key authentication accepted; no message submitted | Did not test arbitrary SMTP clients |
| Supabase SMTP | Management API read-back | Resend host, port, sender, and confirmation safeguards verified; password present/redacted | Password value intentionally not exposed |
| Rate limit | One-field hosted configuration update and read-back | `rate_limit_email_sent` changed from 2 to 30; no inspected configuration drift | Not a capacity or abuse test |
| Direct delivery | One idempotent Resend API send and GET-only status check | Provider reported delivered; visible inbox placement, sender, subject, and plain-text body confirmed; no duplicate | One controlled recipient only |
| Signup confirmation | One disposable production signup | One confirmation email delivered and visible; localized production completion verified | One locale and one account |
| Login and logout | Manual browser test | Initial password sign-in reached app; sign-out reached login | One browser/session |
| Password recovery | One disposable recovery request | One recovery email delivered and visible; reset route, password update, and replacement-password sign-in verified | One locale and one account |
| Disposable-user cleanup | Supabase Dashboard and profile-table check | Auth user absent, profile absent, and fresh sign-in rejected | Existing JWTs are subject to normal expiry behavior |

`delivered` means the recipient mail server accepted a message. Visible inbox placement was separately confirmed for the direct delivery test and both Auth messages.

## Operational validation procedure

Use one controlled pass and stop on unexpected behavior.

1. Read the Resend domain state; do not recreate a verified domain.
2. Check the three exact DNS records through Vercel and public DNS before requesting Resend verification.
3. Read back Supabase Auth SMTP settings and confirmation safeguards without exposing the password.
4. Confirm the current project-wide Auth-email limit; do not raise it merely to test delivery.
5. Send no more than one idempotent direct Resend test email to an approved disposable address.
6. If Auth behavior must be tested, use one disposable account, request exactly one confirmation and one recovery email, then delete that account through the Dashboard after separate approval.
7. Retain only owner-only evidence reports that have been individually reviewed for recipient redaction before their filenames or hashes are documented. Runtime evidence is ephemeral and is not a repository artifact.
8. After successful validation, revoke only the temporary setup credentials used for that setup; retain the permanent restricted SMTP sending key.

Stop rather than retrying blindly on duplicate email, HTTP 429, HTTP 500, bounce, complaint, wrong sender, wrong redirect, or an unverified Resend record.

## Key rotation

1. Create one replacement Resend key with `sending_access` restricted to `mail.noproblemo.tech`.
2. Update only the Supabase SMTP password through a reviewed, approved configuration workflow.
3. Read back the hosted SMTP configuration and confirm confirmation, secure email change, Site URL, and redirects are unchanged.
4. Perform one controlled delivery verification.
5. Revoke the old permanent sending key only after the replacement is verified.
6. Keep overlapping permanent keys only for the shortest necessary transition.

Never place a Resend key in source control, environment examples, documentation, shell arguments, or ordinary logs.

## Rollback

If Custom SMTP must be removed or replaced, use the Supabase SMTP Settings UI unless the current Management API clear/null contract has been independently verified.

1. Preserve email confirmation, secure email change, Site URL, and redirect settings.
2. Clear or replace Custom SMTP using a reviewed provider-supported workflow.
3. Read back the hosted Auth configuration to confirm only intended fields changed.
4. Restore an email-limit posture appropriate to the active provider; do not assume the Custom SMTP limit applies after fallback.
5. Verify one controlled Auth email before considering the rollback complete.
6. Retain the Resend domain and DNS records until the intended fallback is confirmed. Do not delete unrelated Vercel DNS records.

## Troubleshooting

| Symptom | Safe evidence and next check | Do not do |
| --- | --- | --- |
| HTTP 400 while configuring SMTP | Confirm field names and JSON types; retain only a sanitized error category; read back hosted state | Blindly retry or change multiple fields |
| `Too many signup attempts` or rate-limit response | Check current hosted email limit and endpoint cooldown; wait rather than resubmit | Create more users or exhaust limits |
| Resend domain pending | Compare exact DKIM, MX, and SPF records at authoritative and public resolvers | Recreate records or verification requests repeatedly |
| DKIM pending while MX/SPF pass | Compare the full DKIM value from Resend with authoritative DNS | Reconstruct a wrapped key manually |
| Delivered but not visible | Check spam/junk and sender reputation; compare provider event with recipient observation | Treat delivery as guaranteed inbox placement |
| Wrong confirmation redirect | Check Site URL, redirect allowlist, and source-built callback URL | Paste links or tokens into tickets/logs |
| Recovery redirect mismatch | Check the browser-built localized reset URL and redirect allowlist | Request repeated recovery emails |
| SMTP authentication failure | Verify hostname, TLS mode, port, username, and restricted-key state | Test other ports or credentials without review |
| Duplicate Auth email | Stop and inspect request count, cooldowns, and provider events | Send another confirmation or recovery request |
| Runtime evidence unavailable after reboot | Use the documented result and fresh controlled verification if justified | Treat missing ephemeral files as proof of failure |

Conceptual log locations: Resend email events provide send and delivery evidence; Supabase Auth logs provide signup, recovery, callback, and SMTP/provider failures. Inspect only sanitized fields and never copy credentials, full email addresses, URLs with tokens, or raw responses into Git.

## Security and hardening backlog

The following are recommendations, not completed controls:

- Enable CAPTCHA before broader public exposure.
- Enable leaked-password protection where product support permits.
- Review the password-minimum and broader password policy.
- Review broad redirect-allowlist entries for `www` and Vercel domains, and the known truncated explicit `hi` callback entry.
- Keep secure email change enabled.
- Monitor bounce and complaint events.
- Reassess the Auth email limit before growth or campaign-like activity.
- Establish a key-rotation cadence.
- Ensure a monitored support/reply address exists before public launch.

## Evidence provenance

The following source artifacts were owner-only runtime reports under `/run/user/1000/`. Their filenames and checksums are evidence identifiers; report contents were not copied into Git. Runtime storage may be cleared by logout or reboot.

| Purpose | Sanitized report filename | SHA-256 | Date |
| --- | --- | --- | --- |
| Initial hosted Auth audit | `noproblemo-supabase-auth-readonly-audit-20260801.json` | `a3aab51940814fe57800255a631dcfa0612c3c8eaeccf33a45ec6ecfe3d6259d` | 2026-08-01 |
| Verified Resend domain state | `noproblemo-resend-domain-status-20260801.json` | `2ac437993e28f982f901b609784ae7c9faa9938a0d386cf84641762ad357f402` | 2026-08-01 |
| SMTP authentication without sending | `noproblemo-resend-smtp-auth-465-20260801.json` | `d2a6a5b9a1c70888312d0221c1ea4c463e10472520ca83f469c234323d032b75` | 2026-08-01 |
| Successful Custom SMTP update, before | `noproblemo-supabase-smtp-retry2-before-20260801.json` | `bc94854ca4413ffda21f3fdeb58f1d9928309839ac617e82c88e8511d7db71ec` | 2026-08-01 |
| Successful Custom SMTP update, after | `noproblemo-supabase-smtp-retry2-after-20260801.json` | `e142afb9af7d3c5a664aa8ba5bc453df1c210860bdaf2be0cffe87b2229202ad` | 2026-08-01 |
| Email-limit update, before | `noproblemo-supabase-email-rate-limit-30-before-20260801.json` | `d53db0cff1d8c424c6a17247cb189929b52e1e46b2b5cba863c13c15f9e7faf3` | 2026-08-01 |
| Email-limit update, after | `noproblemo-supabase-email-rate-limit-30-after-20260801.json` | `7c6dc2729e948500490e37db95b754d214fd935acbba0a549b42bf168e0d60a5` | 2026-08-01 |
The four owner-only runtime delivery reports were deleted during pre-commit privacy remediation after incomplete recipient redaction was identified. They were never committed, and their deletion does not change the verified delivery or production Auth-flow outcomes.

On 2026-08-01, the temporary `NoProblemo SMTP setup` Resend Full-access key and `NoProblemo Auth configuration audit` Supabase PAT were revoked after Dashboard verification. No temporary Management API credential from this setup remains active. The permanent `NoProblemo Supabase SMTP` sending-only key is retained.
