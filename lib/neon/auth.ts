import { createNeonAuth } from "@neondatabase/auth/next/server";

// The SDK resolves the request's cookies each time; only configuration is shared.
let auth: ReturnType<typeof createNeonAuth> | undefined;

export function getNeonAuth() {
  if (auth) return auth;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) throw new Error("Missing Neon Auth configuration.");
  auth = createNeonAuth({
    baseUrl,
    cookies: { secret, sessionDataTtl: 1 },
    logLevel: "silent",
  });
  return auth;
}
