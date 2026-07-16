import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "small laptop", width: 1280, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow mobile", width: 320, height: 568 },
];

for (const viewport of viewports) {
  test(`${viewport.name} has no horizontal overflow on representative public pages`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const route of ["/en", "/en/login", "/en/signup", "/en/solve"]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
}
