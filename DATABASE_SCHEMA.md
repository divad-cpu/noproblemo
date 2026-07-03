# Database Schema

## Phase 1 Status

No database schema is implemented in Phase 1.

The repository contains a `supabase/` folder, but no migrations are added as part of this phase. This is intentional because product entities, authentication rules, and row-level security policies should be designed together in a later phase.

## Current Files

- `supabase/config.toml`
- `supabase/seed.sql`

## Future Requirements

Before adding migrations, define:

- Core product entities and ownership model
- Authentication provider strategy
- Row-level security policies
- Audit and retention needs
- Seed data policy for local development

## Guardrail

Do not add Supabase migrations during Phase 1.
