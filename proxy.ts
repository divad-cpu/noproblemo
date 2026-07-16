import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
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
