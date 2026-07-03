# Security

## Phase 1 Security Posture

Phase 1 focuses on preventing accidental secret exposure and avoiding premature integrations.

## Environment Variables

- Real `.env*` files are ignored by git.
- `.env.local` must never be read aloud, printed, committed, or copied into documentation.
- `.env.example` and `.env.local.example` contain placeholders only.
- Only variables prefixed with `NEXT_PUBLIC_` are intended for browser exposure.

## Secrets

Do not commit:

- Supabase service role keys
- OAuth client secrets
- Payment provider keys
- Email provider keys
- AI provider keys
- Vercel tokens

## Deferred Security Work

The following items are intentionally deferred until the matching feature exists:

- Authentication hardening
- Supabase row-level security policies
- Rate limiting
- Payment security
- AI safety controls
- Email abuse controls
- Cron and job authorization

## Validation

Run lint, typecheck, and build before merging. Review diffs for accidental secret or environment value exposure.
