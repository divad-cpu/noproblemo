import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);

test("group creation commits before reading the trigger-authorized row", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const createGroup = actions.slice(
    actions.indexOf("export async function createGroup"),
    actions.indexOf("export async function updateGroup"),
  );
  const insertBoundary = createGroup.slice(
    createGroup.indexOf('from("groups")'),
    createGroup.indexOf("if (insertError)"),
  );
  const verificationBoundary = createGroup.slice(
    createGroup.indexOf("data: createdGroup"),
  );

  assert.match(createGroup, /const groupId = crypto\.randomUUID\(\)/);
  assert.match(
    insertBoundary,
    /insert\(\{ id: groupId, owner_id: user\.id, name, description \}\)/,
  );
  assert.doesNotMatch(insertBoundary, /\.select\(/);
  assert.match(verificationBoundary, /\.select\("id"\)/);
  assert.match(verificationBoundary, /\.eq\("id", groupId\)/);
  assert.match(verificationBoundary, /\.eq\("owner_id", user\.id\)/);
  assert.match(createGroup, /failure=insert/);
  assert.match(createGroup, /failure=verification/);
  assert.doesNotMatch(createGroup, /from\("group_members"\)/);
});
