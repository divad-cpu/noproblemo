import { expect, test, type BrowserContext, type Page, type Request } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/types";

type AccountName = "A" | "B" | "C";

const sectionKeys = [
  "problem_title",
  "short_description",
  "background_context",
  "who_is_affected",
  "why_it_matters",
  "possible_causes",
  "final_recommendation",
  "summary",
] as const;

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

function waitForSectionSaveResponse(page: Page, challengePath: string) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === challengePath &&
      isServerAction(response.request()),
    { timeout: 30_000 },
  );
}

async function login(page: Page, name: AccountName) {
  const credentials = account(name);
  await page.goto("/en/login");
  await page.getByRole("textbox", { name: "Email" }).fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/app(?:[/?]|$)/);
}

async function setDisplayName(page: Page, displayName: string) {
  await page.goto("/en/app/settings");
  const input = page.getByLabel("Display name");
  const original = await input.inputValue();
  await input.fill(displayName);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile settings were saved.")).toBeVisible();
  return original.startsWith("CODEX-QA-") ? "" : original;
}

async function restoreDisplayName(page: Page, displayName: string) {
  await page.goto("/en/app/settings");
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile settings were saved.")).toBeVisible();
}

async function openInvitationForm(page: Page, groupPath: string, inviteeId: string) {
  await page.goto(`${groupPath}?inviteSearch=${encodeURIComponent(inviteeId)}`);
  const inviteeInput = page.locator('input[name="inviteeId"]');
  await expect(inviteeInput).toHaveCount(1, { timeout: 10_000 });
  return inviteeInput.locator("xpath=ancestor::form[1]");
}

function memberRow(page: Page, displayName: string) {
  return page.getByText(displayName, { exact: true }).locator("..").locator("..");
}

async function safeCleanup(
  action: () => Promise<void>,
  failures: string[],
  label: string,
) {
  try {
    await action();
  } catch {
    failures.push(label);
  }
}

test.use({ trace: "retain-on-failure", screenshot: "only-on-failure" });

test.describe("pending invitation and section conflict Preview follow-up", () => {
  test.skip(
    process.env.E2E_FOLLOWUP_PREVIEW !== "true" ||
      !process.env.E2E_BASE_URL ||
      !process.env.E2E_PRODUCTION_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.E2E_USER_A_EMAIL ||
      !process.env.E2E_USER_A_PASSWORD ||
      !process.env.E2E_USER_B_EMAIL ||
      !process.env.E2E_USER_B_PASSWORD ||
      !process.env.E2E_USER_C_EMAIL ||
      !process.env.E2E_USER_C_PASSWORD,
    "Explicit Preview URL, Supabase anon configuration, and disposable accounts are required.",
  );

  test("three disposable users verify invitation identity and a bounded concurrent first save", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const baseURL = process.env.E2E_BASE_URL!;
    const productionURL = process.env.E2E_PRODUCTION_URL!;
    expect(new URL(baseURL).origin).not.toBe(new URL(productionURL).origin);
    expect(new URL(baseURL).hostname).toMatch(/\.vercel\.app$/);

    const runId = `${Date.now().toString(36)}-${process.pid}`;
    const prefix = `CODEX-QA-${runId}`;
    const names = {
      A: `${prefix}-User-A`,
      B: `${prefix}-User-B`,
      C: `${prefix}-User-C`,
    } as const;
    const contexts: BrowserContext[] = [];
    const pages = {} as Record<AccountName | "A2" | "B2", Page>;
    const originalNames = {} as Partial<Record<AccountName, string>>;
    const cleanupFailures: string[] = [];
    let groupPath = "";
    let groupName = "";
    let groupDescription = "";
    let challengePath = "";
    let targetSection: (typeof sectionKeys)[number] | null = null;
    let originalSections: Record<string, string> | null = null;
    let primaryError: unknown;

    const api = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const identityApi = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    try {
      const { data: signedIn, error: signInError } = await api.auth.signInWithPassword(
        account("A"),
      );
      expect(signInError).toBeNull();
      expect(signedIn.user).not.toBeNull();
      const userAId = signedIn.user!.id;
      const { data: userBIdentity, error: userBIdentityError } =
        await identityApi.auth.signInWithPassword(account("B"));
      expect(userBIdentityError).toBeNull();
      expect(userBIdentity.user).not.toBeNull();
      const userBId = userBIdentity.user!.id;

      for (const name of ["A", "B", "C"] as const) {
        const context = await browser.newContext({ baseURL });
        contexts.push(context);
        const page = await context.newPage();
        pages[name] = page;
        await login(page, name);
        originalNames[name] = await setDisplayName(page, names[name]);
      }

      const a2Context = await browser.newContext({ baseURL });
      contexts.push(a2Context);
      pages.A2 = await a2Context.newPage();
      await login(pages.A2, "A");
      let sectionApi = api;
      let sectionPrimaryPage = pages.A;
      let sectionSecondaryPage = pages.A2;

      const { data: reusableGroups, error: groupReadError } = await api
        .from("groups")
        .select("id, name, description")
        .eq("owner_id", userAId)
        .ilike("name", "CODEX-QA-%")
        .order("created_at", { ascending: false })
        .limit(1);
      expect(groupReadError).toBeNull();

      if (reusableGroups?.[0]) {
        groupPath = `/en/app/groups/${reusableGroups[0].id}`;
        groupName = reusableGroups[0].name;
        groupDescription = reusableGroups[0].description ?? "";
      } else {
        groupName = `${prefix}-followup-group`;
        groupDescription = `${prefix}-description`;
        await pages.A.goto("/en/app/groups/new");
        await pages.A.getByLabel("Group name").fill(groupName);
        await pages.A.getByLabel("Description").fill(groupDescription);
        await pages.A.getByRole("button", { name: "Create group" }).click();
        await expect(pages.A).toHaveURL(
          /\/en\/app\/groups\/[0-9a-f-]+\?status=group-created$/,
        );
        groupPath = new URL(pages.A.url()).pathname;
      }

      await test.step("pending invitation names come from the caller-scoped RPC", async () => {
        await pages.A.goto(groupPath);
        for (const name of [names.B, names.C]) {
          const row = memberRow(pages.A, name);
          const remove = row.getByRole("button", { name: "Remove member" });
          if ((await remove.count()) > 0) {
            await remove.click();
            await pages.A.goto(groupPath);
          }
          const pending = pages.A
            .getByText(name, { exact: true })
            .locator("xpath=../..");
          const cancel = pending.getByRole("button", { name: "Cancel invite" });
          if ((await cancel.count()) > 0) {
            await cancel.click();
            await pages.A.goto(groupPath);
          }
        }

        const invite = await openInvitationForm(pages.A, groupPath, userBId);
        await invite.getByLabel("Role").selectOption("member");
        await invite.getByRole("button", { name: "Invite" }).click();
        await expect(pages.A.getByText("Group invitation sent.")).toBeVisible();

        await pages.B.goto("/en/app/groups");
        const invitationCard = pages.B
          .getByText(groupName, { exact: true })
          .locator("xpath=ancestor::div[1]");
        await expect(invitationCard).toBeVisible();
        await expect(invitationCard.getByRole("button", { name: "Accept" })).toBeVisible();
        await expect(invitationCard.getByRole("button", { name: "Decline" })).toBeVisible();
        await expect(pages.B.getByText("Unnamed group", { exact: true })).toHaveCount(0);
        await expect(pages.B.getByText(userAId, { exact: true })).toHaveCount(0);
        if (groupDescription) {
          await expect(pages.B.getByText(groupDescription, { exact: true })).toHaveCount(0);
        }

        await pages.C.goto("/en/app/groups");
        await expect(pages.C.getByText(groupName, { exact: true })).toHaveCount(0);

        await pages.B.goto("/en/app/notifications");
        const notification = pages.B
          .getByRole("heading", { level: 3, name: "Group invitation", exact: true })
          .first()
          .locator("xpath=ancestor::article[1]");
        await expect(notification.getByRole("link", { name: "Group invitation" })).toHaveAttribute(
          "href",
          "/en/app/groups",
        );

        await pages.B.goto("/en/app/groups");
        await pages.B.getByText(groupName, { exact: true }).locator("xpath=ancestor::div[1]")
          .getByRole("button", { name: "Decline" }).click();
        await expect(pages.B.getByText("Group invitation declined.")).toBeVisible();

        await (await openInvitationForm(pages.A, groupPath, userBId))
          .getByRole("button", { name: "Invite" })
          .click();
        await expect(pages.A.getByText("Group invitation sent.")).toBeVisible();
        await pages.B.goto("/en/app/groups");
        await pages.B.getByText(groupName, { exact: true }).locator("xpath=ancestor::div[1]")
          .getByRole("button", { name: "Accept" }).click();
        await expect(pages.B.getByText("Group invitation accepted.")).toBeVisible();
        await pages.B.goto(groupPath);
        await expect(pages.B.getByText("Your role: Member", { exact: true })).toBeVisible();
      });

      const { data: challenges, error: challengeReadError } = await api
        .from("challenges")
        .select("id, title")
        .eq("owner_id", userAId)
        .ilike("title", "CODEX-QA-%")
        .order("updated_at", { ascending: false });
      expect(challengeReadError).toBeNull();

      for (const challenge of challenges ?? []) {
        const { data: sections, error: sectionReadError } = await api
          .from("challenge_sections")
          .select("section_key")
          .eq("challenge_id", challenge.id);
        expect(sectionReadError).toBeNull();
        const existingKeys = new Set((sections ?? []).map((section) => section.section_key));
        const missingKey = sectionKeys.find((key) => !existingKeys.has(key));
        if (missingKey) {
          challengePath = `/en/app/challenges/${challenge.id}`;
          targetSection = missingKey;
          break;
        }
      }

      if (!challengePath) {
        const { data: userBChallenges, error: userBChallengeReadError } = await identityApi
          .from("challenges")
          .select("id, title")
          .eq("owner_id", userBId)
          .ilike("title", "CODEX-QA-%")
          .order("updated_at", { ascending: false });
        expect(userBChallengeReadError).toBeNull();

        for (const challenge of userBChallenges ?? []) {
          const { data: sections, error: sectionReadError } = await identityApi
            .from("challenge_sections")
            .select("section_key")
            .eq("challenge_id", challenge.id);
          expect(sectionReadError).toBeNull();
          const existingKeys = new Set((sections ?? []).map((section) => section.section_key));
          const missingKey = sectionKeys.find((key) => !existingKeys.has(key));
          if (missingKey) {
            challengePath = `/en/app/challenges/${challenge.id}`;
            targetSection = missingKey;
            sectionApi = identityApi;
            sectionPrimaryPage = pages.B;
            const b2Context = await browser.newContext({ baseURL });
            contexts.push(b2Context);
            pages.B2 = await b2Context.newPage();
            await login(pages.B2, "B");
            sectionSecondaryPage = pages.B2;
            break;
          }
        }
      }

      expect(
        challengePath,
        "A reusable CODEX-QA challenge with an empty section key is required",
      ).not.toBe("");
      expect(targetSection).not.toBeNull();

      await test.step("two contexts recover deterministically from a concurrent first save", async () => {
        await Promise.all([
          sectionPrimaryPage.goto(challengePath),
          sectionSecondaryPage.goto(challengePath),
        ]);
        originalSections = Object.fromEntries(
          await Promise.all(
            sectionKeys.map(async (key) => [
              key,
              await sectionPrimaryPage.locator(`textarea[name="${key}"]`).inputValue(),
            ]),
          ),
        );
        const firstValue = `${prefix}-concurrent-first`;
        const secondValue = `${prefix}-concurrent-second`;
        await sectionPrimaryPage.locator(`textarea[name="${targetSection}"]`).fill(firstValue);
        await sectionSecondaryPage.locator(`textarea[name="${targetSection}"]`).fill(secondValue);

        let arrivals = 0;
        let release = () => {};
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        for (const page of [sectionPrimaryPage, sectionSecondaryPage]) {
          await page.route(`**${challengePath}**`, async (route) => {
            if (isServerAction(route.request())) {
              arrivals += 1;
              await gate;
            }
            await route.continue();
          });
        }

        const firstSave = sectionPrimaryPage
          .getByRole("button", { name: "Save sections" })
          .click();
        const secondSave = sectionSecondaryPage
          .getByRole("button", { name: "Save sections" })
          .click();
        await expect.poll(() => arrivals).toBe(2);
        release();
        await Promise.all([firstSave, secondSave]);
        await expect(
          sectionPrimaryPage.getByText("Challenge sections were saved."),
        ).toBeVisible();
        await expect(
          sectionSecondaryPage.getByText("Challenge sections were saved."),
        ).toBeVisible();

        const challengeId = challengePath.split("/").at(-1)!;
        const { data: savedSections, error: savedSectionsError } = await sectionApi
          .from("challenge_sections")
          .select("id, section_key, content")
          .eq("challenge_id", challengeId);
        expect(savedSectionsError).toBeNull();
        const counts = new Map<string, number>();
        for (const section of savedSections ?? []) {
          counts.set(section.section_key, (counts.get(section.section_key) ?? 0) + 1);
        }
        expect(counts.get(targetSection!)).toBe(1);
        expect([...counts.values()].every((count) => count === 1)).toBe(true);

        await sectionPrimaryPage.unrouteAll({ behavior: "wait" });
        await sectionSecondaryPage.unrouteAll({ behavior: "wait" });
        await sectionPrimaryPage.reload();
        const sequentialValue = `${prefix}-sequential`;
        await sectionPrimaryPage
          .locator(`textarea[name="${targetSection}"]`)
          .fill(sequentialValue);
        await Promise.all([
          waitForSectionSaveResponse(sectionPrimaryPage, challengePath),
          sectionPrimaryPage.getByRole("button", { name: "Save sections" }).click(),
        ]);
        await expect(
          sectionPrimaryPage.getByText("Challenge sections were saved."),
        ).toBeVisible();

        const { data: sequentialRows, error: sequentialError } = await sectionApi
          .from("challenge_sections")
          .select("id, content")
          .eq("challenge_id", challengeId)
          .eq("section_key", targetSection!);
        expect(sequentialError).toBeNull();
        expect(sequentialRows).toHaveLength(1);
        expect(sequentialRows?.[0].content).toBe(sequentialValue);

        await sectionPrimaryPage.goto(challengePath);
        for (const key of sectionKeys) {
          await sectionPrimaryPage
            .locator(`textarea[name="${key}"]`)
            .fill(originalSections![key]);
        }
        await Promise.all([
          waitForSectionSaveResponse(sectionPrimaryPage, challengePath),
          sectionPrimaryPage.getByRole("button", { name: "Save sections" }).click(),
        ]);
        await expect(
          sectionPrimaryPage.getByText("Challenge sections were saved."),
        ).toBeVisible();
      });
    } catch (error) {
      primaryError = error;
    } finally {
      const restorationPage = pages.B2 ? pages.B : pages.A;
      if (challengePath && originalSections && restorationPage) {
        await safeCleanup(async () => {
          await restorationPage.goto(challengePath);
          for (const key of sectionKeys) {
            await restorationPage
              .locator(`textarea[name="${key}"]`)
              .fill(originalSections![key]);
          }
          await Promise.all([
            waitForSectionSaveResponse(restorationPage, challengePath),
            restorationPage.getByRole("button", { name: "Save sections" }).click(),
          ]);
          await expect(
            restorationPage.getByText("Challenge sections were saved."),
          ).toBeVisible();
        }, cleanupFailures, "challenge section restoration");
      }

      if (groupPath && pages.A) {
        await safeCleanup(async () => {
          await pages.A.goto(groupPath);
          const row = memberRow(pages.A, names.B);
          const remove = row.getByRole("button", { name: "Remove member" });
          if ((await remove.count()) > 0) await remove.click();
          await pages.A.goto(groupPath);
          const pending = pages.A
            .getByText(names.B, { exact: true })
            .locator("xpath=../..");
          const cancel = pending.getByRole("button", { name: "Cancel invite" });
          if ((await cancel.count()) > 0) await cancel.click();
        }, cleanupFailures, "User B invitation or membership cleanup");
      }

      for (const name of ["A", "B", "C"] as const) {
        if (pages[name] && originalNames[name] !== undefined) {
          await safeCleanup(
            () => restoreDisplayName(pages[name], originalNames[name]!),
            cleanupFailures,
            `User ${name} display-name restoration`,
          );
        }
      }

      await api.auth.signOut();
      await identityApi.auth.signOut();
      await Promise.all(contexts.map((context) => context.close()));
    }

    if (primaryError) throw primaryError;
    expect(cleanupFailures, `Cleanup failures: ${cleanupFailures.join(", ")}`).toEqual([]);
  });
});
