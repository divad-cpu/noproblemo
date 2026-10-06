import { request, type APIRequestContext } from "@playwright/test";
import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";

// Each disposable test identity gets its own cookie jar and user JWT.
export function createClient<Database>(dataApiUrl: string, baseURL: string) {
  if (new URL(baseURL).origin === new URL(process.env.E2E_PRODUCTION_URL!).origin) {
    throw new Error("Tests must use an isolated application.");
  }
  let context: APIRequestContext | undefined;
  let token: string | null = null;
  const db = new NeonPostgrestClient<Database>({
    dataApiUrl,
    options: { global: { fetch: fetchWithToken(async () => token) } },
  });
  return Object.assign(db, {
    auth: {
      async signInWithPassword(credentials: { email: string; password: string }) {
        context ??= await request.newContext({ baseURL, ignoreHTTPSErrors: true, extraHTTPHeaders: { origin: baseURL } });
        const response = await context.post("/api/auth/sign-in/email", { data: credentials });
        const body = await response.json();
        if (!response.ok()) return { data: { user: null }, error: { status: response.status() } };
        const tokenResponse = await context.get("/api/auth/token");
        token = (await tokenResponse.json()).token ?? null;
        return { data: { user: body.user as { id: string } | null }, error: token ? null : { status: tokenResponse.status() } };
      },
      async signOut() {
        if (context) {
          await context.post("/api/auth/sign-out", { data: {} });
          await context.dispose();
          context = undefined;
        }
        token = null;
      },
    },
  });
}
