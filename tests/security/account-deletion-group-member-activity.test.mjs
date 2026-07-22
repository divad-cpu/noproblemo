import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const migrationsDirectory = new URL("../../supabase/migrations/", import.meta.url);
const migrationPath = new URL(
  "../../supabase/migrations/20260722120000_fix_group_member_activity_actor.sql",
  import.meta.url,
);
const ownerProtectionPath = new URL(
  "../../supabase/migrations/20260716120000_full_application_audit_security_repairs.sql",
  import.meta.url,
);
const browserClientPath = new URL("../../lib/supabase/client.ts", import.meta.url);

const baseMigrationHashes = new Map([
  ["20260703190000_phase4_supabase_foundation.sql", "48aa33d9cc7c80dc6195cce70a06a1db3a3c58e76466b5937a53a738f129602b"],
  ["20260703210000_phase8_friends_groups.sql", "dd702954288ac75db9f45d7810e7437b7c598970b89bf80b69283d82d5f58df2"],
  ["20260703220000_phase9_messaging_notifications_activity.sql", "d0531f28c73dedc24dbfa7174c2e7acfa226cad1018d330ef92b1fd575682c42"],
  ["20260704090000_phase10_admin_settings_logs.sql", "854717eb2aa4c894f428f93189c44442628349ef4ac40afd81f3f0714e0dbf14"],
  ["20260714120000_supabase_health_check.sql", "f67dc17e0bd879509e1251176c1c91ad3d3ed88515c8aae1d364603939c5e329"],
  ["20260716120000_full_application_audit_security_repairs.sql", "a3a4c87061a845a04529e3cc0c328df386ad79b49de1b31b90559648fcd05c53"],
  ["20260717120000_group_invitation_cancellation_authorization.sql", "fada70b50a2307bf1ca8dc0811bc92c99e7355d33b4cab5c6bb6c05b62538a01"],
]);

test("existing migrations are unchanged and only one additive migration exists", async () => {
  const migrationNames = (await readdir(migrationsDirectory)).sort();
  assert.deepEqual(migrationNames, [
    ...baseMigrationHashes.keys(),
    "20260722120000_fix_group_member_activity_actor.sql",
  ]);

  for (const [name, expectedHash] of baseMigrationHashes) {
    const source = await readFile(new URL(name, migrationsDirectory));
    assert.equal(createHash("sha256").update(source).digest("hex"), expectedHash);
  }
});

test("the migration replaces only membership activity behavior", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(migration, /create or replace function public\.create_group_member_activity\(\)/);
  assert.doesNotMatch(migration, /\b(?:alter|create|drop)\s+table\b/i);
  assert.doesNotMatch(migration, /\b(?:create|alter|drop)\s+policy\b/i);
  assert.doesNotMatch(migration, /\b(?:drop|alter)\s+trigger\b/i);
  assert.doesNotMatch(migration, /service_role|email|display_name|metadata/i);
});

test("removal attribution uses a surviving authenticated actor or null", async () => {
  const migration = await readFile(migrationPath, "utf8");
  const removalBranch = migration.slice(migration.indexOf("select candidate.id"));

  assert.match(removalBranch, /where candidate\.id = auth\.uid\(\)/);
  assert.match(removalBranch, /values\s*\(\s*activity_actor_id,/);
  assert.doesNotMatch(removalBranch, /values\s*\(\s*old\.user_id,/);
  assert.match(migration, /old\.group_id/);
  assert.match(migration, /'Group member removed\.'/);
});

test("owner deletion and demotion protections remain present", async () => {
  const migration = await readFile(ownerProtectionPath, "utf8");

  assert.match(migration, /create or replace function public\.prevent_group_without_owner\(\)/);
  assert.match(migration, /tg_op = 'DELETE' or new\.role <> 'owner'/);
  assert.match(migration, /raise exception 'Group must keep an owner'/);
  assert.match(migration, /group_members_keep_owner_update/);
});

test("browser Supabase code cannot receive the service-role credential", async () => {
  const browserClient = await readFile(browserClientPath, "utf8");

  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(browserClient, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
});
