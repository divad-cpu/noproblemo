# Architecture

## Current Technical Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl` for locale routing and UI messages
- Supabase Auth/Postgres/RLS foundation
- Vercel production deployment
- Domeneshop planned mainly for domain and DNS

## Current Folder Structure

- `app/[locale]/layout.tsx`: locale root layout, metadata, `lang`, `dir`, and `NextIntlClientProvider`.
- `app/[locale]/page.tsx`: localized public landing page.
- `app/[locale]/solve/page.tsx`: localized guest solve page shell.
- `app/[locale]/solve/_components/guest-workspace.tsx`: client component for localStorage guest drafts, Markdown copy/export, and login prompts.
- `app/[locale]/support/page.tsx`: support/contact page.
- `app/[locale]/login/page.tsx`: email login form and Google/Apple OAuth start buttons.
- `app/[locale]/signup/page.tsx`: email signup form and Google/Apple OAuth start buttons.
- `app/[locale]/auth/actions.ts`: Supabase Auth server actions for email and provider login.
- `app/[locale]/auth/callback/route.ts`: Supabase callback handler for email confirmation, magic link, and OAuth session exchange.
- `app/[locale]/auth/logout/route.ts`: logout handler.
- `app/[locale]/app/layout.tsx`: protected app route boundary with server-side session check and app navigation.
- `app/[locale]/app/page.tsx`: logged-in dashboard with profile summary, saved challenge lists, guest import prompt, and empty/error states.
- `app/[locale]/app/actions.ts`: server actions for creating draft challenges, importing guest drafts, updating profile settings, editing workspace sections, managing solutions, and managing tasks.
- `app/[locale]/app/actions.ts`: server actions for creating draft challenges, importing guest drafts, updating profile settings, editing workspace sections, managing solutions, managing tasks, friend requests, friendships, groups, invitations, member roles, and group challenge links.
- `app/[locale]/app/_components/guest-import-card.tsx`: client component that detects the existing guest localStorage draft and submits it for server-side import.
- `app/[locale]/app/_components/challenge-markdown-export.tsx`: client component for Markdown copy/download export.
- `app/[locale]/app/challenges/new/page.tsx`: minimal protected cloud challenge creation page.
- `app/[locale]/app/challenges/[id]/page.tsx`: protected saved challenge workspace with sections, solutions, tasks, and Markdown export.
- `app/[locale]/app/friends/page.tsx`: protected friend request and friendship management page.
- `app/[locale]/app/groups/page.tsx`: protected groups list and pending group invitations page.
- `app/[locale]/app/groups/new/page.tsx`: protected group creation page.
- `app/[locale]/app/groups/[id]/page.tsx`: protected group detail page with members, invitations, roles, and linked challenges.
- `app/[locale]/app/settings/page.tsx`: protected profile/settings page for display name and preferred locale.
- `app/[locale]/_components/auth-status.tsx`: auth-aware landing links.
- `app/[locale]/_components/language-switcher.tsx`: locale switcher.
- `app/[locale]/_components/site-footer.tsx`: shared footer with support email.
- `app/globals.css`: global Tailwind CSS.
- `i18n/`: `next-intl` routing, navigation, and request configuration.
- `messages/`: UI message catalogs for all supported locales.
- `proxy.ts`: locale negotiation and redirects for unprefixed routes.
- `lib/supabase/`: typed Supabase browser/server helper scaffolding and manual database types.
- `supabase/migrations/`: local SQL migrations.
- `supabase/config.toml`: Supabase CLI configuration.
- `docs/`: Codex logs, handoff prompts, and project map.

No shared top-level `components/` directory currently exists. Add it only when shared components are actually reused across route groups.

## Main Routes

- `/` redirects to a detected locale or `en`.
- `/[locale]` landing page.
- `/[locale]/solve` guest problem-solving workspace.
- `/[locale]/support` support/contact page.
- `/[locale]/login` email login and OAuth start.
- `/[locale]/signup` email signup and OAuth start.
- `/[locale]/auth/callback` Supabase auth callback route handler.
- `/[locale]/auth/logout` logout route handler.
- `/[locale]/app` protected dashboard.
- `/[locale]/app/challenges/new` minimal protected create challenge page.
- `/[locale]/app/challenges/[id]` protected saved challenge workspace.
- `/[locale]/app/friends` protected friends page.
- `/[locale]/app/groups` protected groups list.
- `/[locale]/app/groups/new` protected group creation.
- `/[locale]/app/groups/[id]` protected group detail and challenge linking.
- `/[locale]/app/settings` protected profile/settings page.

Supported locales are `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, and `nb`. Arabic and Urdu use `dir="rtl"`.

## Frontend Structure

Keep App Router pages route-focused. Use colocated `_components` folders for route-specific UI. Add shared top-level `components/` only when a component is reused across multiple route groups. Add `lib/` only for shared utilities such as Supabase clients, validation helpers, and typed data access.

## Supabase Structure

Implemented in Phase 4:

- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`

The migration creates:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`
- updated-at trigger function
- profile creation trigger for new `auth.users`
- owner-only RLS policies

Implemented in Phase 8:

- `supabase/migrations/20260703210000_phase8_friends_groups.sql`
- `friend_requests`
- `friendships`
- `groups`
- `group_members`
- `group_invitations`
- `group_challenges`
- helper functions for group roles and group challenge access
- limited authenticated profile search RPC
- RLS policies for friends, groups, invitations, membership, group challenge links, and linked challenge access

The migrations still need to be applied and verified in Supabase.

## Authentication Flow

Implemented in Phase 5:

1. User signs up or logs in through Supabase Auth using email/password.
2. Supabase database trigger creates a `profiles` row after auth user creation.
3. Supabase callback route exchanges auth codes for a cookie-backed session.
4. Authenticated users can reach `/[locale]/app`.
5. Unauthenticated users are redirected to `/[locale]/login`.
6. Logout clears the Supabase session and redirects to the login page.

Google and Apple OAuth flows are prepared through Supabase Auth provider starts, but they require external provider configuration before production use.

Dashboard and guest import were added in Phase 6. The saved challenge workspace was added in Phase 7.

## Data Flow

Current data flow:

- UI messages load from `messages/*.json`.
- Guest workspace state is stored in browser localStorage under `noproblemo.guestWorkspace.v1`.
- Guest data is not sent to Supabase unless an authenticated user explicitly imports it from the dashboard.
- Supabase helpers are used by auth actions, callback/logout route handlers, auth-aware landing links, and protected route checks.
- Auth server actions validate basic form shape and then call Supabase Auth.
- Dashboard reads the authenticated user's `profiles` and `challenges` rows through the normal Supabase session.
- Guest import creates a private draft `challenges` row and related `challenge_sections` rows through the authenticated Supabase session.
- Minimal create challenge creates a private draft `challenges` row.
- Profile settings update `profiles.display_name` and `profiles.preferred_locale`.
- Workspace saves challenge title, short description, and status to `challenges`.
- Workspace saves structured text to `challenge_sections`, creating missing section rows when needed.
- Workspace creates, edits, and deletes possible solutions in `challenge_solutions`.
- Workspace creates, edits, completes, and deletes tasks/actions in `challenge_tasks`.
- Markdown export is generated client-side from server-fetched challenge data.
- Friends page reads friend requests and friendships involving the authenticated user, and uses a limited profile search RPC for display-name lookup.
- Groups pages read only groups the authenticated user belongs to, pending invitations involving the user, and linked group challenges visible through RLS.
- Group challenge linking marks a linked challenge with `visibility = 'group'` and records the explicit link in `group_challenges`.
- Group members can open linked challenges through the existing workspace route when RLS permits access.

Planned data flow:

- Phase 9: messaging, notifications, and activity events.
- Later: admin policies.

## Deployment Direction

Deploy on Vercel. Configure production environment variables in Vercel, never in git. Domeneshop should be used for domain/DNS pointing to Vercel when the domain is ready.

## What Should Stay Simple During MVP

- No AI until the core challenge workflow is stable.
- No payments until value and account model are clear.
- No complex real-time collaboration before basic saved challenges and permissions exist.
- No broad design system before recurring UI patterns emerge.
- No database shortcuts that bypass RLS.
