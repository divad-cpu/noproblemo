import "server-only";
import { cache } from "react";
import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";
import { getNeonAuth } from "./auth";
import type { Database } from "./types";

const getSession = cache(() => getNeonAuth().getSession({ query: { disableCookieCache: "true" } }));
const getToken = cache(() => getNeonAuth().token());

export async function createServerNeonClient() {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("Missing Neon Data API configuration.");
  const auth = getNeonAuth();
  const db = new NeonPostgrestClient<Database>({
    dataApiUrl,
    options: {
      global: {
        fetch: fetchWithToken(async () => {
          const { data, error } = await getToken();
          if (error || !data?.token) throw new Error("Authentication required.");
          return data.token;
        }, (input, init) => fetch(input, { ...init, cache: "no-store" })),
      },
    },
  });

  return Object.assign(db, {
    auth: {
      async getUser() {
        // Validate the upstream session before rendering or mutating private data.
        const { data, error } = await getSession();
        const user = !error ? data?.user : null;
        return {
          data: {
            user: user ? {
              id: user.id,
              email: user.email,
              user_metadata: { display_name: user.name, avatar_url: user.image },
            } : null,
          },
          error,
        };
      },
      signOut: () => auth.signOut(),
    },
  });
}
