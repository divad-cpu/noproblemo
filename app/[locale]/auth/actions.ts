"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

type OAuthProvider = "google" | "apple";

const authProviders = ["google", "apple"] as const;

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
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function getSafeNextPath(value: FormDataEntryValue | null, locale: Locale) {
  const next = firstString(value);
  const localePrefix = `/${locale}`;

  if (
    next.startsWith(`${localePrefix}/`) &&
    !next.startsWith("//") &&
    !next.includes("://")
  ) {
    return next;
  }

  return `${localePrefix}/app`;
}

function authUrl(locale: Locale, path: "login" | "signup", params: URLSearchParams) {
  const query = params.toString();

  return `/${locale}/${path}${query ? `?${query}` : ""}`;
}

export async function loginWithEmail(formData: FormData) {
  const locale = getLocale(formData);
  const email = firstString(formData.get("email"));
  const password = firstString(formData.get("password"));
  const nextPath = getSafeNextPath(formData.get("next"), locale);

  if (!email || !password) {
    const params = new URLSearchParams({
      error: "missing-fields",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
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
  const password = firstString(formData.get("password"));
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
      error: "weak-password",
      next: nextPath,
    });
    redirect(authUrl(locale, "signup", params));
  }

  const supabase = await createServerSupabaseClient();
  const emailRedirectTo = `${getSiteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        display_name: displayName || null,
        preferred_locale: locale,
      },
    },
  });

  if (error) {
    const params = new URLSearchParams({
      error: "signup-failed",
      next: nextPath,
    });
    redirect(authUrl(locale, "signup", params));
  }

  if (data.session) {
    redirect(nextPath);
  }

  const params = new URLSearchParams({
    status: "check-email",
    next: nextPath,
  });
  redirect(authUrl(locale, "signup", params));
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

  const supabase = await createServerSupabaseClient();
  const redirectTo = `${getSiteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    const params = new URLSearchParams({
      error: "oauth-start",
      next: nextPath,
    });
    redirect(authUrl(locale, "login", params));
  }

  redirect(data.url);
}
