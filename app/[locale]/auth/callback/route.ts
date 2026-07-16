import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { getSafeLocalizedPath } from "@/lib/auth/safe-redirect";

type CallbackContext = {
  params: Promise<{ locale: string }>;
};

function getSafeLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

function getSuccessUrl(request: NextRequest, nextPath: string, source: string | null) {
  const url = new URL(nextPath, request.url);

  if (source === "recovery") {
    url.searchParams.set("status", "recovery-ready");
  } else if (source !== "oauth") {
    url.searchParams.set("status", "email-confirmed");
  }

  return url;
}

function getFailureUrl(request: NextRequest, locale: Locale, source: string | null) {
  if (source === "email") {
    return new URL(
      `/${locale}/login?status=email-confirmed-login-required`,
      request.url,
    );
  }

  if (source === "recovery") {
    return new URL(`/${locale}/reset-password?error=recovery-callback`, request.url);
  }

  return new URL(`/${locale}/login?error=callback`, request.url);
}

export async function GET(request: NextRequest, context: CallbackContext) {
  const { locale: rawLocale } = await context.params;
  const locale = getSafeLocale(rawLocale);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeLocalizedPath(requestUrl.searchParams.get("next"), locale);
  const source = requestUrl.searchParams.get("source");

  if (!code) {
    return NextResponse.redirect(getFailureUrl(request, locale, source));
  }

  const response = NextResponse.redirect(getSuccessUrl(request, nextPath, source));
  const supabase = createRouteHandlerSupabaseClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Auth callback exchange failed");
    }

    return NextResponse.redirect(getFailureUrl(request, locale, source));
  }

  return response;
}
