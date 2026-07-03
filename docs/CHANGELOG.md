# Changelog

## 2026-07-03

- Established Phase 1 project foundation documentation.
- Added `.env.local.example` with placeholder-only Supabase public variables.
- Updated `.gitignore` to keep real `.env*` files ignored while allowing safe templates.
- Added `npm run typecheck`.
- Updated README and AGENTS project guidance.
- Replaced default Next.js scaffold content with a minimal NoProblemo foundation page.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 2

- Installed and configured `next-intl`.
- Added locale-prefixed routing for all supported Phase 2 locales.
- Added message catalogs for `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, and `nb`.
- Added a simple language switcher.
- Added RTL document direction for Arabic and Urdu.
- Updated project documentation for the Phase 3 handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 3

- Added a localized public landing page.
- Added guest problem-solving workspace at `/[locale]/solve`.
- Added localStorage draft persistence for guest work.
- Added Markdown summary copy and export actions.
- Added login prompt for guest actions that require cloud saving or collaboration.
- Added support page at `/[locale]/support` with `support@noproblemo.tech`.
- Added placeholder login and signup routes without implementing authentication.
- Updated documentation for Phase 4 Supabase foundation handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Project Map

- Added `CURRENT_STATE.md`.
- Added `docs/CODEX_PROJECT_MAP.md`.
- Added `docs/PHASE_HANDOFF_TEMPLATE.md`.
- Updated core project documentation for durable Codex handoff.
- Clarified implemented versus planned product areas.
- Confirmed lint, typecheck, and production build pass.
