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
- Confirm profile trigger during signup.

### Phase 5: Authentication

Status: implemented.

- Email login through Supabase Auth
- Email signup through Supabase Auth
- Supabase auth callback route
- Logout route
- Minimal protected app layout at `/[locale]/app`
- Auth-aware landing links
- Google OAuth start prepared through Supabase Auth
- Apple OAuth start prepared through Supabase Auth
- Auth documentation

Needs configuration/verification:

- Apply and test the Phase 4 migration.
- Verify profile trigger after signup.
- Configure Google provider in Google Cloud and Supabase.
- Configure Apple provider in Apple Developer and Supabase.

### Phase 6: Dashboard And Guest Import

Status: implemented.

- Protected dashboard at `/[locale]/app`
- Authenticated challenge list and empty/error states
- Guest draft detection from `noproblemo.guestWorkspace.v1`
- Guest import to `challenges` and `challenge_sections`
- Minimal cloud challenge creation
- Minimal saved challenge continuation placeholder
- Profile/settings page
- Display name update
- Preferred locale saving to `profiles.preferred_locale`

Needs verification:

- Apply and test the Phase 4 migration.
- Verify dashboard reads/writes with Supabase RLS.
- Verify guest import against a running Supabase project.
- Verify profile trigger and profile update behavior after signup.

## Current Phase

Phase 6 dashboard and guest import has been implemented. Challenge workspace is next.

## Next Recommended Phase

### Phase 7: Challenge Workspace

Recommended scope:

- Seven-step problem-solving workflow
- Editable challenge sections
- Possible solutions
- Pros and cons
- Risk/effort/impact
- Tasks/actions
- Final recommendation
- Markdown export

## MVP Path

1. Landing page: implemented.
2. Authentication: implemented.
3. Dashboard: implemented.
4. Create and save a challenge: minimal create/list/import implemented; full workspace planned.
5. Basic challenge workspace: guest-only implemented; saved workspace planned for Phase 7.
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
