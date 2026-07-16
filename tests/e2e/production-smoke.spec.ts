import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, monitorBrowserErrors } from "./helpers";

test.describe("non-destructive production smoke", () => {
  test.skip(
    !process.env.E2E_PRODUCTION_URL,
    "Set E2E_PRODUCTION_URL to explicitly enable production smoke tests.",
  );

  test("root, English, Norwegian, auth, assets, and responsive landing work", async ({
    page,
  }) => {
    const productionUrl = process.env.E2E_PRODUCTION_URL!;
    const errors = monitorBrowserErrors(page);

    await page.goto(productionUrl);
    await expect(page).toHaveURL(/\/en\/?$/);

    for (const path of [
      "/en",
      "/nb",
      "/en/login",
      "/en/signup",
      "/en/forgot-password",
    ]) {
      const response = await page.goto(new URL(path, productionUrl).toString());
      expect(response?.ok(), `${path} response`).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }

    await page.goto(new URL("/en/app", productionUrl).toString());
    await expect(page).toHaveURL(/\/en\/login\?error=auth-required/);

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(new URL("/en", productionUrl).toString());
      await expectNoHorizontalOverflow(page);
    }
    errors.expectNone();
  });
});
