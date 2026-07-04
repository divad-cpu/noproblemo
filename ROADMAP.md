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

### Phase 7: Challenge Workspace

Status: implemented.

- Protected saved challenge workspace
- Seven-step problem-solving workflow
- Editable challenge details and status
- Editable challenge sections
- Possible solution create/edit/delete
- Pros, cons, risk, effort, impact, resources, and priority fields
- Task/action create/edit/delete
- Completed state, responsible person, deadline, and position fields
- Final recommendation and summary sections
- Markdown copy/download export

Needs verification:

- Apply and test the Phase 4 migration.
- Verify workspace reads/writes with Supabase RLS.
- Verify section create/update behavior with real Supabase data.
- Verify solution/task CRUD against a running Supabase project.

### Phase 8: Friends And Groups

Status: implemented locally.

- Friend requests with send, accept, decline, and cancel flows
- Friendships with remove friend action
- Groups with owner-created membership
- Group invitations with accept, decline, and cancel flows
- Group roles: owner, admin, member, viewer
- 100-member group limit enforced by database trigger
- Group challenge linking through `group_challenges`
- RLS helper functions for group roles and linked challenge access
- Authenticated limited profile search RPC
- Protected friends and groups pages

Needs verification:

- Apply and test the Phase 8 migration.
- Verify friend request and friendship RLS.
- Verify group invitation, role, member removal, and 100-member limit behavior.
- Verify linked challenge access for owner, admin, member, viewer, and outside users.
- Verify profile search exposes only the intended fields.

### Phase 9: Messaging, Notifications And Activity

Status: implemented locally.

- Group messages on protected group detail pages
- Challenge discussion messages on protected challenge workspaces
- Private notifications page
- Basic activity events for groups, group membership, group challenge links, messages, challenge updates, solution updates, and task updates
- Database triggers for notification/activity side effects
- RLS helper functions for challenge read/participation checks
- RLS policies for messages, notifications, and activity events

Needs verification:

- Apply and test the Phase 9 migration.
- Verify group message access for owner, admin, member, viewer, and outside users.
- Verify challenge message access for owners, group collaborators, viewers, and outside users.
- Verify notifications are visible only to recipients.
- Verify activity events are visible only to authorized group/challenge users.

### Phase 10: Admin/Settings And Local Project Logs

Status: implemented locally.

- Protected admin overview at `/[locale]/app/admin`
- Protected admin settings checklist at `/[locale]/app/admin/settings`
- Admin role protection based on `profiles.role = 'admin'`
- Admin navigation link visible only to admin profiles
- Admin-only RPCs for aggregate counts, limited profile metadata, recent activity metadata, and recent audit-log entries
- `admin_audit_log` table with admin-only read policy
- Profile role self-promotion hardening
- Local project log, changelog, and Phase 11 handoff prompt updates
- No email automation, Resend, Vercel Cron, payments, or AI

Needs verification:

- Apply and test the Phase 10 migration.
- Verify admin and non-admin route behavior.
- Verify admin RPC and `admin_audit_log` RLS behavior.
- Verify normal users cannot update their own `profiles.role`.

## Current Phase

Phase 10 admin/settings and local project logs has been implemented locally. Polish, security review and deployment preparation is next.

## Next Recommended Phase

### Phase 11: Polish, Security Review And Deployment Preparation

Recommended scope:

- Mobile polish
- Desktop polish
- Accessibility checks
- Translation and RTL checks
- RLS review
- Deployment documentation
- Final README
- Final validation

## MVP Path

1. Landing page: implemented.
2. Authentication: implemented.
3. Dashboard: implemented.
4. Create and save a challenge: implemented.
5. Basic challenge workspace: implemented.
6. Friends/invites: implemented locally.
7. Groups: implemented locally.
8. Simple messaging: implemented locally.
9. Basic admin/settings: implemented locally.
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
