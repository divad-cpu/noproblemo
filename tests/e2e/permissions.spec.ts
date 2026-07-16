import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/en/app",
  "/en/app/challenges/new",
  "/en/app/challenges/CODEX-QA-invalid-id",
  "/en/app/challenges/CODEX-QA-invalid-id/print",
  "/en/app/friends",
  "/en/app/groups",
  "/en/app/groups/new",
  "/en/app/groups/CODEX-QA-invalid-id",
  "/en/app/notifications",
  "/en/app/settings",
  "/en/app/admin",
  "/en/app/admin/settings",
];

for (const route of protectedRoutes) {
  test(`anonymous access to ${route} redirects to login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/en\/login\?error=auth-required/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(route);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Log in");
  });
}

test("Supabase health endpoint rejects an unauthenticated request without details", async ({
  request,
}) => {
  const response = await request.get("/api/health/supabase");
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ status: "unauthorized" });
});
