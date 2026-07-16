import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../app/[locale]/app/actions.ts", import.meta.url);
const challengePath = new URL(
  "../../app/[locale]/app/challenges/[id]/page.tsx",
  import.meta.url,
);
const layoutPath = new URL("../../app/[locale]/app/layout.tsx", import.meta.url);
const loginPath = new URL("../../app/[locale]/login/page.tsx", import.meta.url);
const signupPath = new URL("../../app/[locale]/signup/page.tsx", import.meta.url);
const authActionsPath = new URL(
  "../../app/[locale]/auth/actions.ts",
  import.meta.url,
);
const notificationsPath = new URL(
  "../../app/[locale]/app/notifications/page.tsx",
  import.meta.url,
);
const pendingButtonPath = new URL(
  "../../app/[locale]/_components/pending-submit-button.tsx",
  import.meta.url,
);
const proxyPath = new URL("../../proxy.ts", import.meta.url);

function functionSlice(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end));
}

test("acceptance actions rely on triggers and verify the final state", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const friendResponse = functionSlice(
    actions,
    "export async function respondFriendRequest",
    "export async function removeFriend",
  );
  const groupResponse = functionSlice(
    actions,
    "export async function respondGroupInvitation",
    "export async function removeGroupMember",
  );

  assert.doesNotMatch(friendResponse, /from\("friendships"\)\.insert/);
  assert.match(friendResponse, /from\("friendships"\)[\s\S]*\.select\("id"\)/);
  assert.match(friendResponse, /\.eq\("user_one_id", pair\.user_one_id\)/);
  assert.match(friendResponse, /friendshipError \|\| !friendship/);
  assert.match(friendResponse, /status=friend-\$\{response\}/);

  assert.doesNotMatch(groupResponse, /from\("group_members"\)\.insert/);
  assert.match(groupResponse, /from\("group_members"\)[\s\S]*\.select\("role"\)/);
  assert.match(groupResponse, /membership\?\.role !== invitation\.role/);
  assert.match(groupResponse, /status=group-invitation-\$\{response\}/);
});

test("notification destinations are safe and resource-aware", async () => {
  const page = await readFile(notificationsPath, "utf8");
  const links = page.slice(page.indexOf("function RelatedLink"));

  assert.match(links, /notification\.type === "friend_request"[\s\S]*href="\/app\/friends"/);
  assert.match(links, /notification\.type === "group_invitation"[\s\S]*href="\/app\/groups"/);
  assert.match(links, /href=\{\x60\/app\/groups\/\$\{notification\.related_group_id\}\x60\}/);
  assert.match(links, /href=\{\x60\/app\/challenges\/\$\{notification\.related_challenge_id\}\x60\}/);
  assert.ok(
    links.indexOf('notification.type === "group_invitation"') <
      links.indexOf("if (notification.related_group_id)"),
  );
});

test("viewer mutation forms are inert while editor actions remain available", async () => {
  const [actions, page] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile(challengePath, "utf8"),
  ]);
  const authorization = functionSlice(
    actions,
    "async function requireOwnedChallenge",
    "async function logChallengeActivity",
  );

  assert.match(authorization, /\["owner", "admin", "member"\]\.includes/);
  assert.doesNotMatch(authorization, /\["owner", "admin", "member", "viewer"\]/);
  assert.match(page, /data-viewer-read-only="true"/);
  assert.match(page, /action=\{canEdit \? updateChallengeDetails : undefined\}/);
  assert.match(page, /action=\{canEdit \? saveChallengeSections : undefined\}/);
  assert.match(page, /action=\{canEdit \? saveSolution : undefined\}/);
  assert.match(page, /action=\{canEdit \? deleteSolution : undefined\}/);
  assert.match(page, /action=\{canEdit \? saveTask : undefined\}/);
  assert.match(page, /action=\{canEdit \? deleteTask : undefined\}/);
  assert.match(page, /inert=\{!canEdit\}/);
  assert.match(page, /<fieldset disabled=\{!canEdit\} className="contents">/);
  assert.match(page, /canDelete=\{canEdit && message\.sender_id === user\.id\}/);
});

test("authenticated auth pages and protected layouts preserve safe destinations", async () => {
  const [login, signup, authActions, layout, proxy] = await Promise.all([
    readFile(loginPath, "utf8"),
    readFile(signupPath, "utf8"),
    readFile(authActionsPath, "utf8"),
    readFile(layoutPath, "utf8"),
    readFile(proxyPath, "utf8"),
  ]);

  for (const page of [login, signup]) {
    assert.match(page, /getSafeLocalizedPath/);
    assert.match(page, /supabase\.auth\.getUser\(\)/);
    assert.match(page, /if \(user\) \{\s*redirect\(nextPath\);\s*\}/s);
  }
  assert.match(authActions, /return getSafeLocalizedPath\(firstString\(value\), locale\)/);
  assert.match(proxy, /x-noproblemo-pathname/);
  assert.match(proxy, /request\.nextUrl\.pathname/);
  assert.match(proxy, /request\.nextUrl\.search/);
  assert.match(layout, /requestHeaders\.get\("x-noproblemo-pathname"\)/);
  assert.match(layout, /next: nextPath/);
});

test("safe redirects retain localized deep links and reject traversal", async () => {
  const { getSafeLocalizedPath } = await import(
    "../../lib/auth/safe-redirect.ts"
  );

  const safePaths = [
    "/en/app/challenges/new",
    "/en/app/challenges/123?tab=messages",
    "/en/app/groups?filter=pending",
    "/en/app/settings?section=profile",
  ];
  for (const path of safePaths) {
    assert.equal(getSafeLocalizedPath(path, "en"), path);
  }

  for (const path of [
    "https://example.com/steal",
    "//example.com/steal",
    "/nb/app",
    "/en/../../nb/signup",
    "/en/%2e%2e/%2e%2e/nb/signup",
    "/en\\app\\settings",
  ]) {
    assert.equal(getSafeLocalizedPath(path, "en"), "/en/app");
  }
});

test("login and signup expose pending duplicate-submit protection", async () => {
  const [button, login, signup] = await Promise.all([
    readFile(pendingButtonPath, "utf8"),
    readFile(loginPath, "utf8"),
    readFile(signupPath, "utf8"),
  ]);

  assert.match(button, /useFormStatus\(\)/);
  assert.match(button, /disabled=\{pending\}/);
  assert.match(button, /pending \? pendingLabel : idleLabel/);
  assert.match(login, /<PendingSubmitButton/);
  assert.match(signup, /<PendingSubmitButton/g);
});
