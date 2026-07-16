import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);
const groupsPagePath = new URL(
  "../../app/[locale]/app/groups/page.tsx",
  import.meta.url,
);
const notificationsPagePath = new URL(
  "../../app/[locale]/app/notifications/page.tsx",
  import.meta.url,
);
const typesPath = new URL("../../lib/supabase/types.ts", import.meta.url);

function functionSlice(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end));
}

test("pending invitations use the caller-scoped RPC without widening group reads", async () => {
  const [groupsPage, notificationsPage, types] = await Promise.all([
    readFile(groupsPagePath, "utf8"),
    readFile(notificationsPagePath, "utf8"),
    readFile(typesPath, "utf8"),
  ]);
  const rpcType = functionSlice(
    types,
    "pending_group_invitations:",
    "search_profiles:",
  );

  assert.match(groupsPage, /createServerSupabaseClient\(\)/);
  assert.match(groupsPage, /supabase\.rpc\("pending_group_invitations"\)/);
  assert.match(groupsPage, /\.from\("group_invitations"\)/);
  assert.match(groupsPage, /\.eq\("invitee_id", user\.id\)/);
  assert.match(groupsPage, /\.eq\("status", "pending"\)/);
  assert.match(groupsPage, /const memberGroupIds = \(memberships \?\? \[\]\)/);
  assert.match(
    groupsPage,
    /from\("groups"\)\.select\("\*"\)\.in\("id", memberGroupIds\)/,
  );
  assert.doesNotMatch(groupsPage, /\.in\("id", groupIds\)/);
  assert.match(
    groupsPage,
    /\(invitation\) => \[invitation\.invitation_id, invitation\]/,
  );
  assert.match(
    groupsPage,
    /pendingDetails\?\.group_id === invitation\.group_id/,
  );
  assert.match(
    groupsPage,
    /safePendingDetails\?\.group_name \?\? t\("unnamed"\)/,
  );
  assert.match(groupsPage, /pendingInvitationDetails \?\? \[\]/);
  assert.match(groupsPage, /\["accepted", "declined"\]/);
  assert.match(groupsPage, /action=\{respondGroupInvitation\}/);
  assert.doesNotMatch(groupsPage, /createAdminSupabaseClient|service.role/i);
  assert.doesNotMatch(groupsPage, /pendingInvitationError|\.message/);

  assert.match(rpcType, /Args: Record<PropertyKey, never>/);
  for (const field of [
    "invitation_id",
    "group_id",
    "group_name",
    "invited_role",
  ]) {
    assert.match(rpcType, new RegExp(`${field}:`));
  }
  assert.doesNotMatch(
    rpcType,
    /owner_id|description|created_at|membership|challenge|message/,
  );
  assert.match(
    notificationsPage,
    /notification\.type === "group_invitation"[\s\S]*href="\/app\/groups"/,
  );
});

test("section saves recover once only after a first-insert 23505", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const sectionSave = functionSlice(
    actions,
    "export async function saveChallengeSections",
    "export async function saveSolution",
  );
  const existingBranch = functionSlice(
    sectionSave,
    "if (existingId)",
    "} else {",
  );
  const insertBranch = sectionSave.slice(sectionSave.indexOf("} else {"));

  const authorizationIndex = sectionSave.indexOf(
    "requireOwnedChallenge(challengeId)",
  );
  const firstMutationIndex = sectionSave.indexOf('.from("challenge_sections")');
  assert.ok(authorizationIndex >= 0 && authorizationIndex < firstMutationIndex);
  assert.match(sectionSave, /if \(!challenge\)[\s\S]*auth-required/);

  assert.match(existingBranch, /\.update\(\{ content, position \}\)/);
  assert.match(existingBranch, /\.eq\("id", existingId\)/);
  assert.match(existingBranch, /if \(error\)[\s\S]*sections-save-failed/);
  assert.doesNotMatch(existingBranch, /23505|recoveredSection|recoveryError/);

  assert.match(insertBranch, /\.insert\(\{[\s\S]*challenge_id: challengeId/);
  assert.equal([...sectionSave.matchAll(/23505/g)].length, 1);
  assert.match(insertBranch, /if \(error\?\.code === "23505"\)/);
  assert.match(
    insertBranch,
    /from\("challenge_sections"\)[\s\S]*\.update\(\{ content, position \}\)[\s\S]*\.eq\("challenge_id", challengeId\)[\s\S]*\.eq\("section_key", sectionKey\)/,
  );
  assert.match(insertBranch, /\.select\("id"\)[\s\S]*\.maybeSingle\(\)/);
  assert.match(insertBranch, /recoveryError \|\| !recoveredSection/);
  assert.match(insertBranch, /else if \(error\)[\s\S]*sections-save-failed/);
  assert.doesNotMatch(sectionSave, /while\s*\(|do\s*\{/);
  assert.doesNotMatch(sectionSave, /owner_id|userId|formData\.get\("user/);
  assert.doesNotMatch(sectionSave, /error\.message|error\.details|constraint/i);
  assert.equal(
    [...insertBranch.matchAll(/\.update\(\{ content, position \}\)/g)].length,
    1,
  );
});
