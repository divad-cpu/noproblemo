import { expect, test, type Page, type Request } from "@playwright/test";

const userA = {
  email: process.env.E2E_USER_A_EMAIL,
  password: process.env.E2E_USER_A_PASSWORD,
};

function isServerAction(request: Request) {
  return request.method() === "POST" && Boolean(request.headers()["next-action"]);
}

async function login(page: Page) {
  await page.getByRole("textbox", { name: "Email" }).fill(userA.email ?? "");
  await page.locator('input[name="password"]').fill(userA.password ?? "");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/login\?status=signed-out/);
}

test("unsafe next destinations are replaced with the localized dashboard", async ({
  page,
}) => {
  for (const destination of [
    "https://example.com/steal",
    "//example.com/steal",
    "/nb/app",
    "/en/../../nb/signup",
    "/en/%2e%2e/%2e%2e/nb/signup",
  ]) {
    await page.goto("/en/login?next=" + encodeURIComponent(destination));
    await expect(page.locator('input[name="next"]')).toHaveValue("/en/app");
  }
});

test("login pending state blocks duplicate requests and recovers after failure", async ({
  page,
}) => {
  let releaseRequest = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  let actionRequests = 0;

  await page.route("**/en/login**", async (route) => {
    if (isServerAction(route.request())) {
      actionRequests += 1;
      await gate;
    }
    await route.continue();
  });

  await page.goto("/en/login");
  await page.getByRole("textbox", { name: "Email" }).fill(userA.email ?? "");
  await page.locator('input[name="password"]').fill("CODEX-QA-wrong-password");
  const submit = page
    .locator("form")
    .filter({ has: page.locator('input[name="password"]') })
    .locator('button[type="submit"]');
  await submit.evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(() => actionRequests).toBe(1);
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("button", { name: "Log in…", exact: true })).toBeVisible();
  await submit.evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(100);
  expect(actionRequests).toBe(1);
  releaseRequest();

  await expect(page).toHaveURL(/\/en\/login\?error=invalid-credentials/);
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeEnabled();
});

test("signup pending state blocks duplicate requests and recovers", async ({ page }) => {
  const { email, password } = userA;
  test.skip(!email || !password, "Disposable User A credentials are required.");
  if (!email || !password) {
    return;
  }

  let releaseRequest = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  let actionRequests = 0;

  await page.route("**/en/signup**", async (route) => {
    if (isServerAction(route.request())) {
      actionRequests += 1;
      await gate;
    }
    await route.continue();
  });

  await page.goto("/en/signup");
  await page.getByRole("textbox", { name: "Email", exact: true }).first().fill(email);
  await page.locator('input[name="password"]').fill(password);
  const submit = page
    .locator("form")
    .filter({ has: page.locator('input[name="password"]') })
    .locator('button[type="submit"]');
  await submit.evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(() => actionRequests).toBe(1);
  await expect(submit).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Create account…", exact: true }),
  ).toBeVisible();
  await submit.evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(100);
  expect(actionRequests).toBe(1);
  releaseRequest();

  await expect(page).toHaveURL(/\/en\/signup\?.*(status|error)=/);
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeEnabled();
});

test("authenticated auth redirects and protected deep links are restored", async ({
  page,
}) => {
  test.skip(!userA.email || !userA.password, "Disposable User A credentials are required.");

  await page.goto("/en/login");
  await login(page);
  await expect(page).toHaveURL(/\/en\/app(?:\?|$)/);

  await page.goto("/en/login?next=" + encodeURIComponent("/en/app/settings?tab=profile"));
  await expect(page).toHaveURL(/\/en\/app\/settings\?tab=profile$/);
  await page.goto("/en/signup?next=" + encodeURIComponent("/en/app/groups?tab=invitations"));
  await expect(page).toHaveURL(/\/en\/app\/groups\?tab=invitations$/);

  await page.goto("/en/app");
  const challengeHref = await page
    .locator('a[href*="/app/challenges/"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .find((href) => Boolean(href && /\/app\/challenges\/[0-9a-f-]+$/.test(href))),
    );
  const destinations = [
    "/en/app/challenges/new?source=auth-regression",
    "/en/app/groups?tab=invitations",
    "/en/app/settings?tab=profile",
  ];
  if (challengeHref) {
    destinations.push(challengeHref + "?tab=discussion");
  }

  for (const destination of destinations) {
    await logout(page);
    await page.goto(destination);
    await expect(page).toHaveURL(/\/en\/login\?/);
    await expect(page.locator('input[name="next"]')).toHaveValue(destination);
    await login(page);
    await expect(page).toHaveURL(destination);
  }
});
