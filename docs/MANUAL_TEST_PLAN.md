# Manual Test Plan

Last updated: 2026-07-04

## Purpose

This plan verifies NoProblemo MVP behavior with real users, real browser sessions, and production-like Supabase/Vercel settings. It should be run after migrations and environment variables are verified.

## Test Users

- User A: normal user and primary challenge/group owner.
- User B: normal user and collaborator.
- User C: admin user assigned manually in Supabase SQL.

Use separate browser profiles, private windows, or separate devices to avoid session confusion.

## Guest Workspace

- Open `/en/solve` while logged out.
- Enter problem, context, outcome, options, and next step.
- Refresh and confirm the draft persists locally.
- Copy Markdown summary.
- Download Markdown summary.
- Click save/collaboration actions and confirm login prompt appears.
- Confirm no Supabase writes occur until an authenticated import is requested.

## Signup, Login, Logout, And Profiles

- Sign up as User A.
- Confirm profile row is created.
- Log out.
- Log in as User A.
- Update display name.
- Update preferred locale.
- Confirm role remains `user`.
- Repeat signup/login/profile checks for User B and User C.
- Assign User C admin manually after profile creation.

## Language Preference And Locale Routes

- Visit all locale roots:
  - `/en`
  - `/zh-CN`
  - `/hi`
  - `/es`
  - `/ar`
  - `/fr`
  - `/bn`
  - `/pt-BR`
  - `/id`
  - `/ur`
  - `/nb`
- Confirm visible UI copy loads.
- Confirm Arabic and Urdu are RTL.
- Confirm other locales are LTR.
- Confirm user-generated challenge/message content is not automatically translated.

## Dashboard And Guest Import

- As User A, open `/en/app`.
- Confirm dashboard loads.
- Import the guest draft.
- Confirm a private draft challenge is created.
- Refresh and confirm duplicate import is prevented for the same browser draft.
- Confirm active/latest challenge cards link correctly.

## Challenge Workspace

- User A creates a challenge.
- Edit challenge title, short description, and status.
- Edit all seven workflow sections.
- Create, edit, and delete a possible solution.
- Set pros, cons, risk, effort, impact, resources, and priority.
- Create, edit, complete, reorder by position, and delete a task.
- Add final recommendation and summary.
- Copy/download Markdown export.
- Refresh and confirm saved content persists.

## Private Challenge Access

- User B opens User A's private challenge URL before sharing.
- Expected result: not found or denied with no private content.
- User B cannot edit User A's private challenge.

## Friend Requests

- User A sends a friend request to User B.
- User B sees incoming request.
- User B declines request.
- User A sends another request.
- User A cancels outgoing request.
- User A sends another request.
- User B accepts request.
- Confirm friendship appears for both users.
- Remove friendship and confirm it disappears for both users.
- Confirm friendship alone does not grant access to private challenges.

## Group Creation And Invitations

- User A creates a group.
- User A invites User B as member.
- User B declines the invitation.
- User A sends another invitation.
- User A cancels the invitation.
- User A sends another invitation.
- User B accepts the invitation.
- Confirm User B appears as group member.

## Group Roles

- As User A owner, set User B role to admin.
- Confirm User B can manage allowed group settings/members.
- Set User B role to member.
- Confirm member collaboration works where expected.
- Set User B role to viewer.
- Confirm viewer can read group data but cannot send group messages or edit linked challenges.
- Confirm owner cannot remove the last owner.

## Group Challenge Linking

- User A links one of User A's challenges to the group.
- User B can open the linked challenge.
- User B's access follows role:
  - owner/admin/member can collaborate where permitted.
  - viewer is read-only.
- User A unlinks the challenge.
- User B loses access unless they own the challenge.
- Confirm an outside user cannot access the group challenge.

## Messages

- User A sends a group message.
- User B reads the group message.
- User B sends a group message as admin/member.
- User B cannot send as viewer.
- Outside user cannot read group messages.
- User A sends a challenge message.
- Authorized collaborator reads/sends challenge messages according to role.
- Outside user cannot read challenge messages.
- Sender soft-deletes their message.
- Group owner/admin soft-deletes a group message.

## Notifications

- Trigger friend request notifications.
- Trigger group invitation notifications.
- Trigger message notifications.
- Confirm each notification appears only for the intended recipient.
- Mark one notification read.
- Mark all notifications read.
- Confirm one user's notification state does not affect another user's notifications.

## Activity Events

- Confirm dashboard recent activity updates after group and challenge events.
- Confirm group activity appears on group detail.
- Confirm challenge activity appears on challenge workspace.
- Confirm outside users cannot see unrelated activity.

## Admin

- User C opens `/en/app/admin`.
- Confirm aggregate counts and limited profile metadata load.
- Confirm no emails, `auth.users`, message bodies, or private challenge content are shown.
- User C opens `/en/app/admin/settings`.
- Confirm readiness checklists and support email display.
- User A and User B attempt `/en/app/admin`.
- Expected result: not found or denied with no admin data.
- User A and User B attempt `/en/app/admin/settings`.
- Expected result: not found or denied with no admin data.

## Mobile, Tablet, And Desktop

- Test at mobile width.
- Test at tablet width.
- Test at desktop width.
- Check landing page, guest workspace, login, signup, dashboard, challenge workspace, friends, groups, group detail, notifications, settings, admin, and admin settings.
- Check long names, long challenge titles, long messages, and long IDs.
- Confirm forms, buttons, cards, tables, and navigation remain readable and usable.

## Accessibility Smoke Test

- Navigate core pages with keyboard.
- Confirm focus is visible.
- Confirm form labels are clear.
- Confirm icon-only or compact controls have accessible labels.
- Confirm error/status messages are visible and understandable.
- Confirm dialogs can be dismissed and do not trap focus unexpectedly.

## Evidence To Record

- Browser/device matrix tested.
- User accounts used, without recording passwords or secrets.
- Locale routes tested.
- Passed/failed scenarios.
- Screenshots only if they do not expose private content.
- Bugs filed with reproduction steps.
