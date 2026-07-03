import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

type LogoutContext = {
  params: Promise<{ locale: string }>;
};

function getSafeLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

async function signOutAndRedirect(request: NextRequest, context: LogoutContext) {
  const { locale: rawLocale } = await context.params;
  const locale = getSafeLocale(rawLocale);
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(`/${locale}/login?status=signed-out`, request.url),
  );
}

export async function POST(request: NextRequest, context: LogoutContext) {
  return signOutAndRedirect(request, context);
}
