import { expect, test } from "@playwright/test";
import { monitorBrowserErrors } from "./helpers";

test("root redirects to the default English locale", async ({ page }) => {
  const errors = monitorBrowserErrors(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Turn a messy challenge into a clearer next step.",
    }),
  ).toBeVisible();
  errors.expectNone();
});

test("landing page heading levels do not skip in document order", async ({ page }) => {
  await page.goto("/en");
  const levels = await page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName[1])));

  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  }
});

test("landing navigation reaches guest, signup, login, and support routes", async ({
  page,
}) => {
  const errors = monitorBrowserErrors(page);
  await page.goto("/en");

  await page.getByRole("link", { name: "Start solving now as guest" }).click();
  await expect(page).toHaveURL(/\/en\/solve$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Start a problem-solving session",
  );

  await page.getByRole("link", { name: "Back to landing page" }).click();
  await page.getByRole("link", { name: "Create account", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/signup$/);

  await page.getByRole("link", { name: "Already have an account? Log in" }).click();
  await expect(page).toHaveURL(/\/en\/login$/);

  await page.getByRole("link", { name: "Support" }).click();
  await expect(page).toHaveURL(/\/en\/support$/);
  await expect(page.getByRole("link", { name: "david@fideli.no" }).first()).toHaveAttribute(
    "href",
    "mailto:david@fideli.no",
  );
  errors.expectNone();
});

test("language switching preserves the current route and query", async ({ page }) => {
  await page.goto("/en?status=signed-out");
  await page.getByRole("combobox", { name: "Language" }).selectOption("nb");
  await expect(page).toHaveURL(/\/nb\?status=signed-out$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nb");
});
