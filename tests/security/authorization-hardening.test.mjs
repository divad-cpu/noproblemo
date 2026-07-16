import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../supabase/migrations/20260716120000_full_application_audit_security_repairs.sql",
  import.meta.url,
);
const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);

test("the audit migration closes direct consent and ownership bypasses", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(migration, /revoke update on table public\.challenges/);
  assert.match(migration, /grant update \(title, short_description, status, visibility\)/);
  assert.match(migration, /c\.owner_id = auth\.uid\(\)/);
  assert.match(migration, /revoke insert on table public\.friendships/);
  assert.match(migration, /revoke insert on table public\.group_members/);
  assert.match(migration, /grant update \(status, responded_at\).*friend_requests/s);
  assert.match(migration, /grant update \(status, responded_at\).*group_invitations/s);
  assert.match(migration, /revoke execute on function public\.notify_user/s);
  assert.match(migration, /from public, anon, authenticated/);
});

test("acceptance actions rely on the database triggers exactly once", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const friendResponse = actions.slice(
    actions.indexOf("export async function respondFriendRequest"),
    actions.indexOf("export async function removeFriend"),
  );
  const groupResponse = actions.slice(
    actions.indexOf("export async function respondGroupInvitation"),
    actions.indexOf("export async function removeGroupMember"),
  );

  assert.doesNotMatch(friendResponse, /from\("friendships"\)\.insert/);
  assert.doesNotMatch(groupResponse, /from\("group_members"\)\.insert/);
});
