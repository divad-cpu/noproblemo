import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const productionProjectRef = "jxjoyugkozbldwimqjuw";
const expectedProjectId = 'project_id = "noproblemo"';
const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

function fail(message) {
  process.stderr.write(`LOCAL ACCOUNT DELETION HARNESS REFUSED: ${message}\n`);
  process.exit(2);
}

if (process.env.ALLOW_LOCAL_ACCOUNT_DELETION_TEST !== "1") {
  fail("set ALLOW_LOCAL_ACCOUNT_DELETION_TEST=1 for the disposable local stack");
}

const config = await readFile(new URL("../../supabase/config.toml", import.meta.url), "utf8");
if (!config.includes(expectedProjectId)) {
  fail("unexpected local Supabase project id");
}

const statusText = execFileSync("supabase", ["status", "-o", "json"], {
  cwd: new URL("../..", import.meta.url),
  encoding: "utf8",
  env: {
    ...process.env,
    XDG_CONFIG_HOME: "/tmp/noproblemo-admin-lifecycle-config",
    SUPABASE_TELEMETRY_DISABLED: "1",
  },
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

function assertNoError(error, operation) {
  if (error) {
    throw new Error(`${operation} failed`);
  }
}

async function createFixture(label) {
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email: `account-delete-${label}@fixtures.invalid`,
    password,
    email_confirm: true,
  });
  assertNoError(error, `create ${label} fixture`);
  assert.ok(data.user);
  return data.user.id;
}

const emptyUserId = await createFixture("empty");
const memberUserId = await createFixture("member");
const ownerUserId = await createFixture("owner");

for (const userId of [memberUserId, ownerUserId]) {
  if (!/^[0-9a-f-]{36}$/.test(userId)) {
    fail("Auth returned an invalid fixture identifier");
  }
}

const fixtureSql = `
  insert into public.groups (id, owner_id, name)
  values ('e6000000-0000-0000-0000-000000000001', '${ownerUserId}', 'Local account deletion harness');
  insert into public.group_members (id, group_id, user_id, role)
  values ('e7000000-0000-0000-0000-000000000001', 'e6000000-0000-0000-0000-000000000001', '${memberUserId}', 'member');
`;
execFileSync(
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
    "-c",
    fixtureSql,
  ],
  { stdio: "ignore" },
);

const emptyDeletion = await admin.auth.admin.deleteUser(emptyUserId);
assertNoError(emptyDeletion.error, "empty user deletion");
process.stdout.write("scenario A Auth Admin API deletion: passed\n");

const memberDeletion = await admin.auth.admin.deleteUser(memberUserId);
assert.ok(memberDeletion.error, "group member deletion unexpectedly succeeded");

const memberStillExists = await admin.auth.admin.getUserById(memberUserId);
assertNoError(memberStillExists.error, "member existence check");
assert.equal(memberStillExists.data.user?.id, memberUserId);
process.stdout.write("scenario C Auth Admin API deletion: defective (atomic foreign-key rejection)\n");
process.stdout.write("local service-role isolation gate: passed\n");
process.exitCode = 1;
