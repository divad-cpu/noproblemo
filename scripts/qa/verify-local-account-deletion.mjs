import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const productionProjectRef = "jxjoyugkozbldwimqjuw";
const expectedProjectId = 'project_id = "noproblemo"';
const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const fixtureGroupIds = [
  "f6000000-0000-0000-0000-000000000001",
  "f6000000-0000-0000-0000-000000000002",
  "f6000000-0000-0000-0000-000000000003",
  "f6000000-0000-0000-0000-000000000004",
];

function fail(message) {
  process.stderr.write(`LOCAL ACCOUNT DELETION HARNESS REFUSED: ${message}\n`);
  process.exit(2);
}

if (process.env.ALLOW_LOCAL_ACCOUNT_DELETION_TEST !== "1") {
  fail("set ALLOW_LOCAL_ACCOUNT_DELETION_TEST=1 for the disposable local stack");
}

const repoRoot = new URL("../..", import.meta.url);
const config = await readFile(new URL("../../supabase/config.toml", import.meta.url), "utf8");
if (!config.includes(expectedProjectId)) {
  fail("unexpected local Supabase project id");
}

const localEnvironment = {
  ...process.env,
  XDG_CONFIG_HOME: "/tmp/noproblemo-account-delete-fix-config",
  SUPABASE_TELEMETRY_DISABLED: "1",
};
const statusText = execFileSync("supabase", ["status", "-o", "json"], {
  cwd: repoRoot,
  encoding: "utf8",
  env: localEnvironment,
  stdio: ["ignore", "pipe", "ignore"],
});

if (statusText.includes(productionProjectRef) || statusText.includes("noproblemo.tech")) {
  fail("production reference detected");
}

const status = JSON.parse(statusText);
const apiUrl = new URL(status.API_URL);
if (apiUrl.protocol !== "http:" || !allowedHosts.has(apiUrl.hostname)) {
  fail("API URL is not a loopback HTTP endpoint");
}
if (!status.SERVICE_ROLE_KEY) {
  fail("local service-role credential is unavailable");
}

const admin = createClient(apiUrl.href, status.SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const fixtureUserIds = [];

function assertNoError(error, operation) {
  if (error) {
    throw new Error(`${operation} failed`);
  }
}

function assertUuid(value) {
  assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

function runSql(sql) {
  return execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_noproblemo",
      "psql",
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-Atqc",
      sql,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
}

function sqlUuidList(values) {
  for (const value of values) assertUuid(value);
  return values.map((value) => `'${value}'::uuid`).join(", ");
}

async function createFixture(label, runId) {
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email: `account-delete-${runId}-${label}@fixtures.invalid`,
    password,
    email_confirm: true,
  });
  assertNoError(error, `create ${label} fixture`);
  assert.ok(data.user);
  assertUuid(data.user.id);
  fixtureUserIds.push(data.user.id);
  return data.user.id;
}

let cleanupFailure;
try {
  const runId = randomBytes(6).toString("hex");
  const ownerId = await createFixture("owner", runId);
  const memberId = await createFixture("member", runId);
  const groupAdminId = await createFixture("group-admin", runId);
  const coOwnerCreatorId = await createFixture("co-owner-creator", runId);
  const lastOwnerId = await createFixture("last-owner", runId);

  runSql(`
    insert into public.groups (id, owner_id, name)
    values
      ('${fixtureGroupIds[0]}', '${ownerId}', 'Local ordinary member deletion'),
      ('${fixtureGroupIds[1]}', '${ownerId}', 'Local administrator deletion'),
      ('${fixtureGroupIds[2]}', '${coOwnerCreatorId}', 'Local co-owned deletion protection'),
      ('${fixtureGroupIds[3]}', '${lastOwnerId}', 'Local last-owner deletion protection');
    insert into public.group_members (group_id, user_id, role)
    values
      ('${fixtureGroupIds[0]}', '${memberId}', 'member'),
      ('${fixtureGroupIds[1]}', '${groupAdminId}', 'admin'),
      ('${fixtureGroupIds[2]}', '${ownerId}', 'owner');
  `);

  const memberDeletion = await admin.auth.admin.deleteUser(memberId);
  assertNoError(memberDeletion.error, "ordinary group member deletion");
  assert.equal(
    runSql(`
      select (
        (select count(*) from auth.users where id = '${memberId}')
        + (select count(*) from public.profiles where id = '${memberId}')
        + (select count(*) from public.group_members where user_id = '${memberId}')
      );
    `),
    "0",
  );
  assert.equal(
    runSql(`
      select count(*)
      from public.groups g
      where g.id = '${fixtureGroupIds[0]}'
        and exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.user_id = '${ownerId}' and gm.role = 'owner'
        );
    `),
    "1",
  );
  assert.equal(
    runSql(`
      select count(*)
      from public.activity_events
      where group_id = '${fixtureGroupIds[0]}'
        and type = 'group_member_removed'
        and actor_id is null;
    `),
    "1",
  );
  process.stdout.write("ordinary member Auth Admin deletion: passed\n");

  const adminDeletion = await admin.auth.admin.deleteUser(groupAdminId);
  assertNoError(adminDeletion.error, "non-owner group administrator deletion");
  assert.equal(
    runSql(`
      select (
        (select count(*) from auth.users where id = '${groupAdminId}')
        + (select count(*) from public.profiles where id = '${groupAdminId}')
        + (select count(*) from public.group_members where user_id = '${groupAdminId}')
      );
    `),
    "0",
  );
  assert.equal(
    runSql(`
      select count(*)
      from public.groups g
      where g.id = '${fixtureGroupIds[1]}'
        and exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.user_id = '${ownerId}' and gm.role = 'owner'
        );
    `),
    "1",
  );
  assert.equal(
    runSql(`
      select count(*)
      from public.activity_events
      where group_id = '${fixtureGroupIds[1]}'
        and type = 'group_member_removed'
        and actor_id is null;
    `),
    "1",
  );
  process.stdout.write("non-owner admin Auth Admin deletion: passed\n");

  assert.ok(
    (await admin.auth.admin.deleteUser(coOwnerCreatorId)).error,
    "group creator deletion unexpectedly succeeded",
  );
  assert.equal(
    runSql(`
      select count(*) from auth.users where id = '${coOwnerCreatorId}';
    `),
    "1",
  );
  assert.equal(
    runSql(`
      select count(*) from public.group_members
      where group_id = '${fixtureGroupIds[2]}' and role = 'owner';
    `),
    "2",
  );
  process.stdout.write("owner-with-co-owner deletion remains blocked: passed\n");

  assert.ok(
    (await admin.auth.admin.deleteUser(lastOwnerId)).error,
    "last-owner deletion unexpectedly succeeded",
  );
  assert.equal(
    runSql(`
      select count(*) from auth.users where id = '${lastOwnerId}';
    `),
    "1",
  );
  assert.equal(
    runSql(`
      select count(*) from public.group_members
      where group_id = '${fixtureGroupIds[3]}' and role = 'owner';
    `),
    "1",
  );
  assert.equal(
    runSql(`
      select count(*) from public.groups g
      where g.id = any (array[${fixtureGroupIds.map((id) => `'${id}'::uuid`).join(", ")}])
        and not exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.role = 'owner'
        );
    `),
    "0",
  );
  assert.equal(
    runSql(`
      select count(*)
      from public.activity_events ae
      where ae.actor_id is not null
        and not exists (select 1 from auth.users au where au.id = ae.actor_id);
    `),
    "0",
  );
  process.stdout.write("last-owner deletion remains blocked: passed\n");
  process.stdout.write("local service-role isolation gate: passed\n");
} finally {
  try {
    runSql(`
      begin;
      alter table public.group_members disable trigger group_members_keep_owner_delete;
      alter table public.group_members disable trigger group_members_activity_removed;
      delete from public.groups
      where id = any (array[${fixtureGroupIds.map((id) => `'${id}'::uuid`).join(", ")}]);
      alter table public.group_members enable trigger group_members_activity_removed;
      alter table public.group_members enable trigger group_members_keep_owner_delete;
      commit;
    `);
    for (const userId of fixtureUserIds) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error && runSql(`select count(*) from auth.users where id = '${userId}';`) !== "0") {
        throw new Error("fixture Auth user cleanup failed");
      }
    }

    const userList = fixtureUserIds.length ? sqlUuidList(fixtureUserIds) : "null::uuid";
    assert.equal(
      runSql(`
        select (
          (select count(*) from auth.users where id in (${userList}))
          + (select count(*) from public.profiles where id in (${userList}))
          + (select count(*) from public.group_members where user_id in (${userList}))
          + (select count(*) from public.groups where id = any (
              array[${fixtureGroupIds.map((id) => `'${id}'::uuid`).join(", ")}]
            ))
        );
      `),
      "0",
    );
    process.stdout.write("local fixture cleanup: passed\n");
  } catch {
    cleanupFailure = new Error("local fixture cleanup failed");
  }
}

if (cleanupFailure) {
  throw cleanupFailure;
}
