import { createHash, timingSafeEqual } from "node:crypto";
import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";
import { getNeonAuth } from "@/lib/neon/auth";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/neon/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

function secretsMatch(received: string, expected: string) {
  const receivedDigest = createHash("sha256").update(received).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();

  return timingSafeEqual(receivedDigest, expectedDigest);
}

export async function GET(request: NextRequest) {
  const keepaliveSecret = process.env.NOPROBLEMO_KEEPALIVE_SECRET;

  if (!keepaliveSecret) {
    console.error("Database health check configuration is incomplete.");
    return jsonResponse({ status: "unavailable" }, 503);
  }

  const authorization = request.headers.get("authorization");
  const bearerPrefix = "Bearer ";

  if (
    !authorization?.startsWith(bearerPrefix) ||
    !secretsMatch(authorization.slice(bearerPrefix.length), keepaliveSecret)
  ) {
    return jsonResponse({ status: "unauthorized" }, 401);
  }

  const dataApiUrl = process.env.NEON_DATA_API_URL;

  if (!dataApiUrl) {
    console.error("Database health check configuration is incomplete.");
    return jsonResponse({ status: "unavailable" }, 503);
  }

  try {
    const supabase = new NeonPostgrestClient<Database>({
      dataApiUrl,
      options: { global: { fetch: fetchWithToken(async () => {
        const { data, error } = await getNeonAuth().getAnonymousToken();
        if (error || !data?.token) throw new Error("Health check authentication unavailable.");
        return data.token;
      }, (input, init) => fetch(input, { ...init, cache: "no-store" })) } },
    });
    const { data, error } = await supabase.rpc("noproblemo_health_check");

    if (error || data !== true) {
      console.error("Database health check RPC failed.");
      return jsonResponse({ status: "unavailable" }, 503);
    }

    return jsonResponse(
      {
        status: "ok",
        neon: "reachable",
        checkedAt: new Date().toISOString(),
      },
      200,
    );
  } catch {
    console.error("Database health check request failed.");
    return jsonResponse({ status: "unavailable" }, 503);
  }
}
