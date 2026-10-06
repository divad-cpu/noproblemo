import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/neon/auth";
import { getSafeLocalizedPath } from "@/lib/auth/safe-redirect";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

type CallbackContext = { params: Promise<{ locale: string }> };

export async function GET(request: NextRequest, context: CallbackContext) {
  const { locale: rawLocale } = await context.params;
  const locale = routing.locales.includes(rawLocale as Locale) ? rawLocale as Locale : defaultLocale;
  const nextPath = getSafeLocalizedPath(request.nextUrl.searchParams.get("next"), locale);
  const { data, error } = await getNeonAuth().getSession({ query: { disableCookieCache: "true" } });
  if (error || !data?.user) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=email-confirmed-login-required`, request.url));
  }
  return NextResponse.redirect(new URL(nextPath, request.url));
}
