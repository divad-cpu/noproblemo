import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

type CallbackContext = {
  params: Promise<{ locale: string }>;
};

function getSafeLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

function getSafeNextPath(value: string | null, locale: Locale) {
  const fallback = `/${locale}/app`;
  const localePrefix = `/${locale}`;

  if (
    value &&
    value.startsWith(`${localePrefix}/`) &&
    !value.startsWith("//") &&
    !value.includes("://")
  ) {
    return value;
  }

  return fallback;
}

export async function GET(request: NextRequest, context: CallbackContext) {
  const { locale: rawLocale } = await context.params;
  const locale = getSafeLocale(rawLocale);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"), locale);

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=callback`, request.url),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=callback`, request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
