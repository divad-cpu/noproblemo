import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { getNeonAuth } from "./lib/neon/auth";

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Complete the SDK's OAuth/email verifier exchange before locale routing.
  if (request.nextUrl.searchParams.has("neon_auth_session_verifier")) {
    const locale = routing.locales.find((item) => request.nextUrl.pathname.startsWith(`/${item}/`)) ?? routing.defaultLocale;
    return getNeonAuth().middleware({ loginUrl: `/${locale}/login` })(request);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-noproblemo-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return handleI18nRouting(new NextRequest(request, { headers: requestHeaders }));
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
