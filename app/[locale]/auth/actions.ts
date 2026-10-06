"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/neon/auth";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { getSafeLocalizedPath } from "@/lib/auth/safe-redirect";

type OAuthProvider = "google" | "apple";

const authProviders = ["google", "apple"] as const;
const signupErrorMap = {
  invalidEmail: "signup-invalid-email",
  weakPassword: "signup-weak-password",
  rateLimited: "signup-rate-limited",
  existingOrPending: "signup-existing-or-pending",
  providerDisabled: "signup-provider-disabled",
  failed: "signup-failed",
} as const;

function firstString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData): Locale {
  const value = firstString(formData.get("locale"));

  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : defaultLocale;
}

function getSiteUrl() {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function getSafeNextPath(value: FormDataEntryValue | null, locale: Locale) {
  return getSafeLocalizedPath(firstString(value), locale);
}

function authUrl(
  locale: Locale,
  path: "login" | "signup" | "forgot-password" | "reset-password",
  params: URLSearchParams,
) {
  const query = params.toString();

  return `/${locale}/${path}${query ? `?${query}` : ""}`;
}

function withStatus(path: string, status: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("status", status);

  return `${pathname}?${params.toString()}`;
}

function classifySignupError(error: { message?: string; code?: string; status?: number }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (error.status === 429 || message.includes("rate") || code.includes("rate")) {
    return signupErrorMap.rateLimited;
  }

  if (
    message.includes("invalid email") ||
    message.includes("email address is invalid") ||
    code.includes("email")
  ) {
    return signupErrorMap.invalidEmail;
  }

  if (message.includes("password") || code.includes("password")) {
    return signupErrorMap.weakPassword;
  }

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("confirmed") ||
    message.includes("pending")
  ) {
    return signupErrorMap.existingOrPending;
  }

  if (
    message.includes("provider") ||
    message.includes("signup") ||
    message.includes("signups not allowed") ||
    message.includes("disabled")
  ) {
    return signupErrorMap.providerDisabled;
  }

  return signupErrorMap.failed;
}

function warnSignupFailure(reason: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Signup failed: ${reason}`);
  }
}

export async function loginWithEmail(formData: FormData) {
  const locale = getLocale(formData);
  const email = firstString(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"), locale);

  if (!email || !password) {
    const params = new URLSearchParams({
      error: "missing-fields",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  const auth = getNeonAuth();
  const { error } = await auth.signIn.email({
    email,
    password,
  });

  if (error) {
    const params = new URLSearchParams({
      error: "invalid-credentials",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  redirect(nextPath);
}

export async function signUpWithEmail(formData: FormData) {
  const locale = getLocale(formData);
  const displayName = firstString(formData.get("displayName"));
  const email = firstString(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("next"), locale);

  if (!email || !password) {
    const params = new URLSearchParams({
      error: "missing-fields",
      next: nextPath,
    });
    redirect(authUrl(locale, "signup", params));
  }

  if (password.length < 8) {
    const params = new URLSearchParams({
      error: signupErrorMap.weakPassword,
      next: nextPath,
    });
    redirect(authUrl(locale, "signup", params));
  }

  const auth = getNeonAuth();
  const emailRedirectTo = `${getSiteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}&source=email`;
  const { data, error } = await auth.signUp.email({
    email,
    password,
    name: displayName || email.split("@")[0],
    callbackURL: emailRedirectTo,
  });

  if (error) {
    const errorKey = classifySignupError(error);
    warnSignupFailure(errorKey.replace(/^signup-/, "").replaceAll("-", " "));
    const params = new URLSearchParams({
      error: errorKey,
      next: nextPath,
    });
    redirect(authUrl(locale, "signup", params));
  }

  if (data?.token) {
    redirect(withStatus(nextPath, "account-created"));
  }

  const params = new URLSearchParams({
    status: "signup-check-email",
    next: nextPath,
  });
  redirect(authUrl(locale, "signup", params));
}

export async function resendSignupConfirmation(formData: FormData) {
  const locale = getLocale(formData);
  const email = firstString(formData.get("email"));
  const nextPath = getSafeNextPath(formData.get("next"), locale);

  if (!email) {
    redirect(
      authUrl(
        locale,
        "signup",
        new URLSearchParams({ error: "signup-invalid-email", next: nextPath }),
      ),
    );
  }

  const auth = getNeonAuth();
  const emailRedirectTo = `${getSiteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}&source=email`;
  const { error } = await auth.sendVerificationEmail({
    email,
    callbackURL: emailRedirectTo,
  });

  if (error) {
    warnSignupFailure("resend confirmation");
  }

  redirect(
    authUrl(
      locale,
      "signup",
      new URLSearchParams({
        status: "signup-confirmation-resent",
        next: nextPath,
      }),
    ),
  );
}

export async function signInWithOAuth(formData: FormData) {
  const locale = getLocale(formData);
  const provider = firstString(formData.get("provider")) as OAuthProvider;
  const nextPath = getSafeNextPath(formData.get("next"), locale);

  if (!authProviders.includes(provider)) {
    const params = new URLSearchParams({
      error: "oauth-provider",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  const auth = getNeonAuth();
  const redirectTo = `${getSiteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}&source=oauth`;
  const { data, error } = await auth.signIn.social({
    provider,
    callbackURL: redirectTo,
  });

  if (error || !data?.url) {
    const params = new URLSearchParams({
      error: "oauth-start",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  redirect(data.url);
}

export async function requestPasswordReset(formData: FormData) {
  const locale = getLocale(formData);
  const email = firstString(formData.get("email"));

  if (!email) {
    redirect(
      authUrl(
        locale,
        "forgot-password",
        new URLSearchParams({ error: "missing-email" }),
      ),
    );
  }

  const auth = getNeonAuth();
  const redirectTo = `${getSiteUrl()}/${locale}/reset-password`;
  const { error } = await auth.requestPasswordReset({ email, redirectTo });

  if (error) {
    redirect(
      authUrl(
        locale,
        "forgot-password",
        new URLSearchParams({ error: "reset-email-failed" }),
      ),
    );
  }

  redirect(
    authUrl(
      locale,
      "forgot-password",
      new URLSearchParams({ status: "reset-email-sent" }),
    ),
  );
}

export async function resetPassword(formData: FormData) {
  const locale = getLocale(formData);
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect(
      authUrl(
        locale,
        "reset-password",
        new URLSearchParams({ error: "weak-password" }),
      ),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      authUrl(
        locale,
        "reset-password",
        new URLSearchParams({ error: "password-mismatch" }),
      ),
    );
  }

  const auth = getNeonAuth();
  const token = firstString(formData.get("token"));
  if (!token) {
    redirect(authUrl(locale, "reset-password", new URLSearchParams({ error: "reset-link-invalid" })));
  }
  const { error } = await auth.resetPassword({ newPassword: password, token });

  if (error) {
    redirect(
      authUrl(
        locale,
        "reset-password",
        new URLSearchParams({ error: "password-update-failed" }),
      ),
    );
  }

  await auth.signOut();
  redirect(
    authUrl(
      locale,
      "login",
      new URLSearchParams({ status: "password-updated" }),
    ),
  );
}
