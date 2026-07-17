import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);
const groupDetailPath = new URL(
  "../../app/[locale]/app/groups/[id]/page.tsx",
  import.meta.url,
);
const migrationPath = new URL(
  "../../supabase/migrations/20260717120000_group_invitation_cancellation_authorization.sql",
  import.meta.url,
);

function functionSlice(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end));
}

test("group invitation cancellation uses the exact pending invitation and verified final state", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const responseAction = functionSlice(
    actions,
    "export async function respondGroupInvitation",
    "export async function removeGroupMember",
  );

  assert.match(responseAction, /supabase\.auth\.getUser| getAuthenticatedUser\(\)/);
  assert.match(responseAction, /\.from\("group_invitations"\)/);
  assert.match(responseAction, /\.eq\("id", invitationId\)/);
  assert.match(responseAction, /\.eq\("status", "pending"\)/);
  assert.match(responseAction, /invitation\.inviter_id === user\.id/);
  assert.match(responseAction, /\.from\("group_members"\)/);
  assert.match(responseAction, /\.eq\("group_id", invitation\.group_id\)/);
  assert.match(responseAction, /\.eq\("user_id", user\.id\)/);
  assert.match(responseAction, /\["owner", "admin"\]\.includes\(managerMembership\.role\)/);
  assert.doesNotMatch(responseAction, /\["owner", "admin", "member"/);
  assert.doesNotMatch(responseAction, /viewer.*canCancel|canCancel.*viewer/s);
  assert.match(
    responseAction,
    /\["accepted", "declined"\]\.includes\(response\)[\s\S]*invitation\.invitee_id === user\.id/,
  );
  assert.match(responseAction, /\.select\("id, status"\)/);
  assert.match(responseAction, /updatedInvitation\?\.status !== response/);
  assert.doesNotMatch(responseAction, /createAdminSupabaseClient|service.role/i);
  assert.doesNotMatch(responseAction, /while\s*\(|do\s*\{|for\s*\(;;\)/);
  assert.doesNotMatch(responseAction, /formData\.get\("groupId"\)|formData\.get\("role"\)/);
});

test("group detail cancellation controls match manager visibility and prevent duplicate submits", async () => {
  const page = await readFile(groupDetailPath, "utf8");
  const invitationSection = page.slice(page.indexOf("{canManage ? ("));

  assert.match(page, /const canManage = \["owner", "admin"\]\.includes\(myMember\.role\)/);
  assert.match(page, /\.eq\("status", "pending"\)/);
  assert.match(invitationSection, /name="response" value="canceled"/);
  assert.match(invitationSection, /<PendingSubmitButton/);
  assert.match(invitationSection, /pendingLabel=\{`\$\{t\("invitations\.cancel"\)\}…`\}/);
});

test("database policy allows only pending invitation transitions for related authorized users", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(migration, /on public\.group_invitations for update to authenticated/);
  assert.match(migration, /using \([\s\S]*status = 'pending'/);
  assert.match(migration, /inviter_id = auth\.uid\(\)[\s\S]*status = 'canceled'/);
  assert.match(migration, /public\.can_manage_group\(group_id, auth\.uid\(\)\)[\s\S]*status = 'canceled'/);
  assert.match(migration, /invitee_id = auth\.uid\(\) and status in \('accepted', 'declined'\)/);
  assert.doesNotMatch(migration, /service_role|security definer/i);
});

test("existing acceptance and bounded section-conflict repairs remain intact", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const groupResponse = functionSlice(
    actions,
    "export async function respondGroupInvitation",
    "export async function removeGroupMember",
  );
  const sectionSave = functionSlice(
    actions,
    "export async function saveChallengeSections",
    "export async function saveSolution",
  );

  assert.doesNotMatch(groupResponse, /from\("group_members"\)\.insert/);
  assert.match(groupResponse, /membership\?\.role !== invitation\.role/);
  assert.equal([...sectionSave.matchAll(/23505/g)].length, 1);
  assert.match(sectionSave, /\.eq\("challenge_id", challengeId\)[\s\S]*\.eq\("section_key", sectionKey\)/);
  assert.doesNotMatch(sectionSave, /while\s*\(|do\s*\{/);
});
