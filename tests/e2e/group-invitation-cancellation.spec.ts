import { expect, test, type BrowserContext, type Page, type Request } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database, GroupRole } from "../../lib/supabase/types";

type AccountName = "A" | "B" | "C" | "D" | "E" | "F";

function account(name: AccountName) {
  const email = process.env[`E2E_USER_${name}_EMAIL`];
  const password = process.env[`E2E_USER_${name}_PASSWORD`];

  if (!email || !password) {
    throw new Error(`Disposable User ${name} credentials are not configured.`);
  }

  return { email, password };
}

function isServerAction(request: Request) {
  return request.method() === "POST" && Boolean(request.headers()["next-action"]);
}

async function login(page: Page, name: AccountName) {
  const credentials = account(name);
  await page.goto("/en/login");
  await page.getByRole("textbox", { name: "Email" }).fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/app(?:[/?]|$)/);
}

async function openInvitationForm(page: Page, groupPath: string, inviteeId: string) {
  await page.goto(`${groupPath}?inviteSearch=${encodeURIComponent(inviteeId)}`);
  const inviteeInput = page.locator(`input[name="inviteeId"][value="${inviteeId}"]`);
  await expect(inviteeInput).toHaveCount(1, { timeout: 10_000 });
  return inviteeInput.locator("xpath=ancestor::form[1]");
}

async function invite(
  page: Page,
  groupPath: string,
  inviteeId: string,
  role: Exclude<GroupRole, "owner">,
) {
  const form = await openInvitationForm(page, groupPath, inviteeId);
  await form.getByLabel("Role").selectOption(role);
  await form.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("Group invitation sent.")).toBeVisible();
}

function invitationCard(page: Page, groupName: string) {
  return page.getByText(groupName, { exact: true }).locator("xpath=ancestor::div[1]");
}

function cancelButton(page: Page) {
  return page
    .locator('form:has(input[name="response"][value="canceled"])')
    .getByRole("button", { name: /^Cancel invite/ });
}

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("group invitation cancellation authorization", () => {
  test.skip(
    process.env.E2E_INVITATION_CANCELLATION !== "true" ||
      !process.env.E2E_BASE_URL ||
      !process.env.E2E_PRODUCTION_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.E2E_USER_A_EMAIL ||
      !process.env.E2E_USER_A_PASSWORD ||
      !process.env.E2E_USER_B_EMAIL ||
      !process.env.E2E_USER_B_PASSWORD ||
      !process.env.E2E_USER_C_EMAIL ||
      !process.env.E2E_USER_C_PASSWORD ||
      !process.env.E2E_USER_D_EMAIL ||
      !process.env.E2E_USER_D_PASSWORD ||
      !process.env.E2E_USER_E_EMAIL ||
      !process.env.E2E_USER_E_PASSWORD ||
      !process.env.E2E_USER_F_EMAIL ||
      !process.env.E2E_USER_F_PASSWORD,
    "Explicit local/Preview configuration and six disposable accounts are required.",
  );

  test("inviter and non-inviter admin cancellation align with role and terminal-state UI", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const baseURL = process.env.E2E_BASE_URL!;
    const productionURL = process.env.E2E_PRODUCTION_URL!;
    const base = new URL(baseURL);
    const isIsolatedHost =
      base.hostname === "localhost" ||
      base.hostname === "127.0.0.1" ||
      base.hostname.endsWith(".vercel.app");
    expect(base.origin).not.toBe(new URL(productionURL).origin);
    expect(base.hostname).not.toBe("noproblemo.tech");
    expect(base.hostname).not.toBe("www.noproblemo.tech");
    expect(isIsolatedHost).toBe(true);

    const api = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const contexts: BrowserContext[] = [];
    const pages = {} as Record<AccountName, Page>;
    const userIds = {} as Record<AccountName, string>;
    let groupId = "";
    let primaryError: unknown;

    try {
      for (const name of ["A", "B", "C", "D", "E", "F"] as const) {
        const identity = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data, error } = await identity.auth.signInWithPassword(account(name));
        expect(error).toBeNull();
        expect(data.user).not.toBeNull();
        userIds[name] = data.user!.id;
        await identity.auth.signOut();

        const context = await browser.newContext({ baseURL });
        contexts.push(context);
        pages[name] = await context.newPage();
        await login(pages[name], name);
      }

      const { error: ownerSignInError } = await api.auth.signInWithPassword(account("A"));
      expect(ownerSignInError).toBeNull();

      const groupName = `CODEX-INVITE-CANCEL-${Date.now().toString(36)}-${process.pid}`;
      await pages.A.goto("/en/app/groups/new");
      await pages.A.getByLabel("Group name").fill(groupName);
      await pages.A.getByRole("button", { name: "Create group" }).click();
      await expect(pages.A).toHaveURL(
        /\/en\/app\/groups\/[0-9a-f-]+\?status=group-created$/,
      );
      const groupPath = new URL(pages.A.url()).pathname;
      groupId = groupPath.split("/").at(-1)!;

      for (const [name, role] of [
        ["B", "admin"],
        ["C", "member"],
        ["D", "viewer"],
      ] as const) {
        await invite(pages.A, groupPath, userIds[name], role);
        await pages[name].goto("/en/app/groups");
        await invitationCard(pages[name], groupName)
          .getByRole("button", { name: "Accept" })
          .click();
        await expect(pages[name].getByText("Group invitation accepted.")).toBeVisible();
      }

      await test.step("the original inviter gets pending protection and localized feedback", async () => {
        await invite(pages.A, groupPath, userIds.F, "member");
        await pages.A.goto(groupPath);
        const button = cancelButton(pages.A);
        await expect(button).toHaveCount(1);

        let release = () => {};
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        await pages.A.route(`**${groupPath}**`, async (route) => {
          if (isServerAction(route.request())) await gate;
          await route.continue();
        });

        const click = button.click();
        await expect(button).toBeDisabled();
        release();
        await click;
        await pages.A.unrouteAll({ behavior: "wait" });
        await expect(pages.A.getByText("Group invitation canceled.")).toBeVisible();
        await expect(cancelButton(pages.A)).toHaveCount(0);
      });

      await test.step("a different accepted admin can cancel", async () => {
        await invite(pages.A, groupPath, userIds.F, "member");
        await pages.B.goto(groupPath);
        await expect(pages.B.getByText("Your role: Admin", { exact: true })).toBeVisible();
        await cancelButton(pages.B).click();
        await expect(pages.B.getByText("Group invitation canceled.")).toBeVisible();
      });

      await test.step("member, viewer, unrelated user, and invitee get no cancellation control", async () => {
        await invite(pages.A, groupPath, userIds.F, "member");

        for (const name of ["C", "D"] as const) {
          await pages[name].goto(groupPath);
          await expect(cancelButton(pages[name])).toHaveCount(0);
        }

        const unrelatedResponse = await pages.E.goto(groupPath);
        expect(unrelatedResponse?.status()).toBe(404);
        await pages.E.goto("/en/app/groups");
        await expect(pages.E.getByText(groupName, { exact: true })).toHaveCount(0);

        await pages.F.goto("/en/app/groups");
        const pendingCard = invitationCard(pages.F, groupName);
        await expect(pendingCard.getByRole("button", { name: "Accept" })).toBeVisible();
        await expect(pendingCard.getByRole("button", { name: "Decline" })).toBeVisible();
        await expect(cancelButton(pages.F)).toHaveCount(0);
        await pendingCard.getByRole("button", { name: "Decline" }).click();
        await expect(pages.F.getByText("Group invitation declined.")).toBeVisible();

        await pages.A.goto(groupPath);
        await expect(cancelButton(pages.A)).toHaveCount(0);
      });

      await test.step("accepted and declined invitations cannot later expose cancellation", async () => {
        await invite(pages.A, groupPath, userIds.F, "member");
        await pages.F.goto("/en/app/groups");
        await invitationCard(pages.F, groupName)
          .getByRole("button", { name: "Accept" })
          .click();
        await expect(pages.F.getByText("Group invitation accepted.")).toBeVisible();

        await pages.A.goto(groupPath);
        await expect(cancelButton(pages.A)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
    } finally {
      if (groupId) {
        const { error: cleanupError } = await api
          .from("groups")
          .delete()
          .eq("id", groupId)
          .eq("owner_id", userIds.A);
        if (!primaryError && cleanupError) primaryError = cleanupError;
      }
      await api.auth.signOut();
      await Promise.all(contexts.map((context) => context.close()));
    }

    if (primaryError) throw primaryError;
  });
});
