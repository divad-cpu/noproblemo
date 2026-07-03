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

### Phase 4: Supabase Foundation

Status: implemented locally.

- Supabase migration for profiles and core challenge tables
- Updated-at triggers
- Profile creation trigger after `auth.users` insert
- Owner-only RLS policies
- Browser/server Supabase helper scaffolding
- Manual database types

Needs verification:

- Apply migration to local/linked Supabase.
- Test RLS with authenticated users.
- Confirm profile trigger during Phase 5 signup.

## Current Phase

Phase 4 Supabase foundation has been implemented locally. Authentication is next.

## Next Recommended Phase

### Phase 5: Authentication

Recommended scope:

- Email login
- Signup
- Logout
- Protected app layout
- Profile creation verification
- Google login prepared
- Apple login prepared
- Auth documentation

### Phase 6: Dashboard And Guest Import

Deferred scope:

- Authenticated dashboard
- Saved challenge list
- Create saved challenge
- Optional guest draft import after login
- Initial cloud challenge workspace

## MVP Path

1. Landing page: implemented.
2. Authentication: planned for Phase 5.
3. Dashboard: planned for Phase 6.
4. Create and save a challenge: database foundation implemented; UI planned.
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
