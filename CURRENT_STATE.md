# Current State

Last updated: 2026-07-03

Future Codex sessions must read this file first, then `docs/CODEX_PROJECT_MAP.md`, before changing files.

## Current Project Status

NoProblemo has completed:

- Phase 1: project foundation
- Phase 2: internationalization foundation
- Phase 3: public landing page and guest mode

The current task is documentation/project orientation only. Phase 4 Supabase foundation is not implemented.

## Already Implemented

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Locale routing for `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`
- RTL document direction for `ar` and `ur`
- Public landing page at `/[locale]`
- Guest workspace at `/[locale]/solve`
- Support/contact page at `/[locale]/support`
- Placeholder auth routes at `/[locale]/login` and `/[locale]/signup`
- Shared language switcher and footer
- Guest localStorage draft persistence under `noproblemo.guestWorkspace.v1`
- Markdown copy/export for guest drafts
- Login prompt for save/collaboration actions
- Supabase CLI folder with config and seed file
- Documentation baseline and project map

## Partially Implemented

- Problem-solving workflow exists only as guest browser-local form fields.
- Login/signup routes exist only as placeholders.
- Supabase exists only as project configuration, not as app data access.
- Deployment works on Vercel, but production hardening is ongoing.
- Translations currently include complete UI keys, but non-English content quality should be reviewed by fluent speakers before launch.

## Not Yet Implemented

- Real authentication
- Supabase migrations
- Supabase app client/server helpers
- Database tables
- Row-level security policies
- Dashboard
- Saved cloud challenges
- Friends/invites
- Groups
- Simple messaging
- Admin/settings
- Real-time collaboration
- AI features
- Payments
- Resend email
- Vercel Cron

## Important Files And Folders

- `app/[locale]/layout.tsx`: locale layout, metadata, RTL/LTR.
- `app/[locale]/page.tsx`: public landing page.
- `app/[locale]/solve/_components/guest-workspace.tsx`: guest localStorage workspace.
- `app/[locale]/support/page.tsx`: support page.
- `app/[locale]/login/page.tsx`: login placeholder.
- `app/[locale]/signup/page.tsx`: signup placeholder.
- `i18n/routing.ts`: supported locales and RTL logic.
- `messages/*.json`: UI messages.
- `proxy.ts`: locale middleware.
- `supabase/config.toml`: Supabase CLI config.
- `supabase/seed.sql`: empty seed file.
- `docs/CODEX_PROJECT_MAP.md`: central durable project map.
- `docs/PHASE_HANDOFF_TEMPLATE.md`: reusable future prompt template.

## Known Issues

- No real auth or cloud saving exists yet.
- Guest drafts are browser-local and can be lost if localStorage is cleared.
- Non-English translations need human review.
- Supabase `.temp` files exist from linking/local CLI state; do not print their contents.
- `npm run build` may fail inside the sandbox because Turbopack needs to bind a local port. Rerun with approved escalation if that exact sandbox error occurs.

## Current Risks

- Future agents might mistake placeholder auth routes for real authentication.
- Future agents might bypass RLS if database work starts too quickly.
- User-generated problem content may be sensitive; privacy must be designed into auth and database phases.
- Feature expansion could overload the minimal UI if not kept incremental.

## Next Recommended Phase

Phase 4: Supabase foundation.

Recommended first step: finalize the schema and RLS model in `DATABASE_SCHEMA.md` and `SECURITY.md`, then create migrations only if explicitly requested.

## Validation Commands

Run after changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Validation for this documentation map task:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03 after rerunning with escalation for the known Turbopack sandbox port-bind issue.
