# Roadmap

## Completed Based On Current Repository State

### Phase 1: Project Foundation

Status: implemented.

- Next.js App Router project
- TypeScript
- Tailwind CSS
- Supabase folder
- Safe environment templates
- Foundation documentation
- Validation scripts

### Phase 2: Internationalization Foundation

Status: implemented.

- `next-intl` installed and configured
- Locale-prefixed routes
- Message files for `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`
- RTL handling for Arabic and Urdu
- Language switcher

### Phase 3: Public Landing Page And Guest Mode

Status: implemented.

- Landing page at `/[locale]`
- Guest workspace at `/[locale]/solve`
- Support/contact page at `/[locale]/support`
- Placeholder login/signup routes
- Guest localStorage drafts
- Markdown copy/export
- Login prompt for save/collaboration actions

## Current Phase

Documentation and project orientation map. This task does not add product features.

## Next Recommended Phase

### Phase 4: Supabase Foundation

Recommended scope:

- Finalize initial database schema.
- Create first Supabase migrations.
- Add RLS policies from the start.
- Add typed Supabase client/server helpers if needed.
- Keep guest workspace local-only unless explicit import/save flow is scoped.
- Do not build full auth UI unless Phase 4 explicitly includes it.

## MVP Path

1. Landing page: implemented.
2. Authentication: planned.
3. Dashboard: planned.
4. Create and save a challenge: planned.
5. Basic challenge workspace: guest-only implemented; saved workspace planned.
6. Friends/invites: planned.
7. Groups: planned.
8. Simple messaging: planned.
9. Basic admin/settings: planned.
10. Deployment: Vercel works; hardening remains ongoing.

## Future Expansion Path

- AI-assisted problem analysis
- Solution scoring
- Templates
- PDF/export reports
- Real-time collaboration
- Comments
- Public/private challenge settings
- Organization accounts
- Voting
- Task assignment
- Calendar/deadlines
- Knowledge library

## Guardrail

Do not pretend planned features are implemented. Add each phase incrementally and update `CURRENT_STATE.md` after completion.
