import { expect, test } from "@playwright/test";

test("login exposes labeled controls and blocks an empty submission", async ({ page }) => {
  await page.goto("/en/login");

  const email = page.getByRole("textbox", { name: "Email" });
  const password = page.getByLabel("Password", { exact: true });
  await expect(email).toHaveAttribute("type", "email");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(email).toHaveJSProperty("validity.valueMissing", true);
  await expect(page).toHaveURL(/\/en\/login$/);

  await page.getByRole("button", { name: "Show" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide" })).toBeVisible();
});

test("signup validates email and password before any account request", async ({ page }) => {
  await page.goto("/en/signup");
  const email = page.getByRole("textbox", { name: "Email", exact: true }).first();
  const password = page.getByLabel("Password", { exact: true });

  await email.fill("not-an-email");
  await password.fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(email).toHaveJSProperty("validity.typeMismatch", true);
  await expect(password).toHaveJSProperty("validity.tooShort", true);
  await expect(page).toHaveURL(/\/en\/signup$/);
});

test("forgot-password form blocks an empty or malformed email locally", async ({ page }) => {
  await page.goto("/en/forgot-password");
  const email = page.getByRole("textbox", { name: "Email" });
  const submit = page.getByRole("button", { name: "Send reset link" });

  await submit.click();
  await expect(email).toHaveJSProperty("validity.valueMissing", true);
  await email.fill("bad-address");
  await submit.click();
  await expect(email).toHaveJSProperty("validity.typeMismatch", true);
});

test("untrusted next parameters are replaced with the localized app fallback", async ({
  page,
}) => {
  await page.goto("/en/login?next=https://example.com/steal");
  await expect(page.locator('input[name="next"]')).toHaveValue("/en/app");

  await page.goto("/en/signup?next=//example.com/steal");
  await expect(page.locator('input[name="next"]').first()).toHaveValue("/en/app");

  await page.goto("/en/login?next=/en/../../nb/signup");
  await expect(page.locator('input[name="next"]')).toHaveValue("/en/app");

  await page.goto("/en/login?next=/en/%2e%2e/%2e%2e/nb/signup");
  await expect(page.locator('input[name="next"]')).toHaveValue("/en/app");
});

test("known auth feedback is rendered and unknown feedback is ignored", async ({ page }) => {
  await page.goto("/en/login?error=auth-required&status=signed-out");
  await expect(page.getByText("Log in to access saved work.", { exact: false })).toBeVisible();
  await expect(page.getByText("You have been logged out.")).toBeVisible();

  await page.goto("/en/login?error=login-unavailable");
  await expect(page.getByText("Login is temporarily unavailable.", { exact: false })).toBeVisible();

  await page.goto("/en/login?error=raw-secret-message&status=raw-status");
  await expect(page.getByText("raw-secret-message")).toHaveCount(0);
  await expect(page.getByText("raw-status")).toHaveCount(0);
});
