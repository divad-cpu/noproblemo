# AI Ready

## Purpose

This file makes the project easier for AI coding agents to continue safely.

## Current Scope

Phase 3 public landing page and guest mode are complete. Do not implement cloud, auth, or collaboration features until the user explicitly requests the next phase.

## Read First

1. `AGENTS.md`
2. `README.md`
3. `PROJECT_BRIEF.md`
4. `ARCHITECTURE.md`
5. `ROADMAP.md`
6. The relevant installed Next.js guide in `node_modules/next/dist/docs/`

## Critical Guardrails

- Never read or print `.env.local` values.
- Never commit real secrets.
- Keep `.env.local.example` and `.env.example` placeholders only.
- Do not add real authentication, payments, email, AI, cron, database migrations, cloud saving, or real collaboration without explicit scope.
- Validate with lint, typecheck, and build after changes.

## Current Validation Commands

```bash
npm run lint
npm run typecheck
npm run build
```
