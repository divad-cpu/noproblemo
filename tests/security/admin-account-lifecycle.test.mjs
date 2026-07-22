import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);
const settingsPath = new URL("../../app/[locale]/app/settings/page.tsx", import.meta.url);
const adminHelperPath = new URL("../../lib/supabase/admin.ts", import.meta.url);
const adminPagePath = new URL("../../app/[locale]/app/admin/page.tsx", import.meta.url);
const adminSettingsPath = new URL("../../app/[locale]/app/admin/settings/page.tsx", import.meta.url);
const phase10MigrationPath = new URL(
  "../../supabase/migrations/20260704090000_phase10_admin_settings_logs.sql",
  import.meta.url,
);

function functionSlice(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end));
}

test("account deletion targets only the authenticated session user and requires explicit confirmation", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const action = functionSlice(
    actions,
    "export async function deleteCurrentAccount",
    "export async function updateChallengeDetails",
  );

  assert.match(action, /deleteConfirmation[\s\S]*=== "DELETE"/);
  assert.match(action, /deleteConfirmed[\s\S]*=== "on"/);
  assert.match(action, /getAuthenticatedUser\(\)/);
  assert.match(action, /admin\.deleteUser\(user\.id\)/);
  assert.doesNotMatch(action, /formData\.get\(["']user_?id["']\)/i);
  assert.doesNotMatch(action, /deleteUser\([^)]*(formData|searchParams|params)/);
  assert.doesNotMatch(action, /error\.(message|details|hint)|JSON\.stringify\(error\)/);
});

test("the settings UI supplies both confirmation factors without a user target", async () => {
  const settings = await readFile(settingsPath, "utf8");

  assert.match(settings, /action=\{deleteCurrentAccount\}/);
  assert.match(settings, /name="deleteConfirmation"/);
  assert.match(settings, /name="deleteConfirmed"/);
  assert.doesNotMatch(settings, /name="user_?id"/i);
});

test("service-role access is isolated in a server-only helper", async () => {
  const [actions, helper] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile(adminHelperPath, "utf8"),
  ]);

  assert.match(helper, /^import "server-only";/);
  assert.match(helper, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(helper, /persistSession: false/);
  assert.match(helper, /autoRefreshToken: false/);
  assert.match(actions, /createAdminSupabaseClient/);
  assert.equal([...actions.matchAll(/createAdminSupabaseClient\(/g)].length, 1);
});

test("admin pages and RPCs share the profiles.role administrator model", async () => {
  const [adminPage, adminSettings, migration] = await Promise.all([
    readFile(adminPagePath, "utf8"),
    readFile(adminSettingsPath, "utf8"),
    readFile(phase10MigrationPath, "utf8"),
  ]);

  for (const page of [adminPage, adminSettings]) {
    assert.match(page, /supabase\.auth\.getUser\(\)/);
    assert.match(page, /\.from\("profiles"\)[\s\S]*\.select\("role"\)/);
    assert.match(page, /profile\?\.role !== "admin"/);
    assert.match(page, /notFound\(\)/);
  }

  assert.match(migration, /p\.role = 'admin'/);
  for (const rpc of [
    "admin_overview_counts",
    "admin_list_profiles",
    "admin_recent_activity",
    "admin_recent_audit_log",
  ]) {
    assert.match(migration, new RegExp(`function public\\.${rpc}`));
  }
  assert.equal([...migration.matchAll(/if not public\.is_admin\(auth\.uid\(\)\)/g)].length, 4);
});

test("admin RPC declarations omit auth credentials and private content columns", async () => {
  const migration = await readFile(phase10MigrationPath, "utf8");
  const rpcSection = migration.slice(migration.indexOf("create or replace function public.admin_overview_counts"));

  assert.doesNotMatch(rpcSection, /auth\.users|encrypted_password|access_token|refresh_token|service_role/i);
  assert.doesNotMatch(rpcSection, /m\.body|messages\.body|challenge_sections\.content/i);
  assert.match(rpcSection, /p\.id, p\.display_name, p\.preferred_locale, p\.role, p\.created_at/);
});
