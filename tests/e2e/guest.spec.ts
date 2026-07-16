import { expect, test } from "@playwright/test";
import { monitorBrowserErrors } from "./helpers";

test("guest challenge persists across reload with Unicode and HTML-like input", async ({
  page,
}) => {
  const errors = monitorBrowserErrors(page);
  await page.goto("/en/solve");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const values = {
    "What problem are you solving?": "CODEX-QA-ÆØÅ <script>alert(1)</script>",
    "What context matters?": "Linje én\nLinje to — 日本語",
    "What would a good outcome look like?": "A safe, clear outcome ✅",
    "What options are on the table?": "Option A & option B",
    "What is the next practical step?": "Review with Ola",
  };

  for (const [label, value] of Object.entries(values)) {
    await page.getByRole("textbox", { name: label }).fill(value);
  }
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();

  for (const [label, value] of Object.entries(values)) {
    await expect(page.getByRole("textbox", { name: label })).toHaveValue(value);
  }
  await expect(page.locator("script").filter({ hasText: "alert(1)" })).toHaveCount(0);
  errors.expectNone();
});

test("guest workspace survives local storage write failures", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("CODEX-QA quota", "QuotaExceededError");
    };
  });
  const errors = monitorBrowserErrors(page);

  await page.goto("/en/solve");
  const problem = page.getByRole("textbox", { name: "What problem are you solving?" });
  await problem.fill("CODEX-QA-unsaved-but-usable");
  await expect(problem).toHaveValue("CODEX-QA-unsaved-but-usable");
  await expect(page.getByRole("status")).toContainText("could not save");
  errors.expectNone();
});

test("stored draft hydration cannot overwrite new typing", async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      originalSetTimeout(handler, timeout === 0 ? 1_200 : timeout, ...args)) as typeof window.setTimeout;
    localStorage.setItem(
      "noproblemo.guestWorkspace.v1",
      JSON.stringify({ problem: "CODEX-QA-old" }),
    );
  });

  await page.goto("/en/solve");
  const problem = page.getByRole("textbox", { name: "What problem are you solving?" });
  await problem.fill("CODEX-QA-new-before-load");
  await page.waitForTimeout(1_300);
  await expect(problem).toHaveValue("CODEX-QA-new-before-load");
});

test("account-only guest controls explain the login requirement", async ({ page }) => {
  await page.goto("/en/solve");
  const trigger = page.getByRole("button", { name: "Save cloud project" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(/account|log in/i);
  await expect(page.getByRole("button", { name: "Continue without saving" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
