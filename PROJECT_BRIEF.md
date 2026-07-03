# Project Brief

## What NoProblemo Is

NoProblemo is a minimalistic, secure, modern web application for structured problem-solving. It should help people define a problem clearly, understand the situation, work alone or with others, discuss options, organize actions, and produce a clear final solution or action plan.

## Who It Is For

- Private users working through personal or practical decisions.
- Small groups that need a shared place to understand and solve a challenge.
- Organizations that need a calm, structured way to capture problems, options, tasks, and conclusions.

## Main User Problem

People often start solving before they understand the problem. Notes, conversations, options, tasks, and decisions get scattered across documents, chats, and memory. NoProblemo should provide one simple place to clarify the challenge and move toward an action plan.

## Core Product Idea

Start with a structured challenge workspace:

- Problem title
- Short description
- Background/context
- Who is affected
- Why the problem matters
- Possible causes
- Possible solutions
- Pros and cons
- Priority/ranking
- Tasks/actions
- Final recommendation
- Summary/export

The product should support guest use first, then add accounts, saved challenges, groups, invites, and collaboration in later phases.

## MVP Scope

The intended MVP path is:

1. Landing page
2. Authentication
3. Dashboard
4. Create and save a challenge
5. Basic challenge workspace
6. Friends/invites
7. Groups
8. Simple messaging
9. Basic admin/settings
10. Deployment hardening

The repository currently has the landing page, locale routing, support page, guest solve workspace, and auth placeholder routes. Real authentication, dashboard, cloud saving, groups, invites, messaging, and admin/settings are planned but not implemented.

## Non-MVP Future Features

- AI-assisted problem analysis
- Solution scoring
- Templates for business, personal, public-sector, and technical problems
- PDF/export reports
- Real-time collaboration
- Comments on each section
- Public/private challenge settings
- Organization accounts
- Voting on solutions
- Task assignment
- Calendar/deadlines
- Knowledge library

## Design Philosophy

NoProblemo should feel calm, practical, professional, and easy to understand. It should avoid visual clutter and heavy enterprise complexity while still being suitable for organizations.

## Product Principles

- Clarify before solving.
- Guest-first, account-later where possible.
- Private by default.
- Collaboration requires explicit access.
- User-generated content is never automatically translated.
- Security and row-level permissions are part of the product, not an afterthought.
- Keep each phase small and verifiable.
