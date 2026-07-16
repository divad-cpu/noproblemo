import { expect, test } from "@playwright/test";

const locales = [
  "en",
  "zh-CN",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt-BR",
  "id",
  "ur",
  "nb",
] as const;

for (const locale of locales) {
  test(`${locale} boots public, auth, and guest routes with locale metadata`, async ({ page }) => {
    for (const route of ["", "/login", "/signup", "/solve", "/support"]) {
      await page.goto(`/${locale}${route}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("body")).not.toContainText(
        /MISSING_MESSAGE|Home\.|Auth\.|Solve\.|Support\./,
      );
    }

    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" || locale === "ur" ? "rtl" : "ltr",
    );
  });
}
