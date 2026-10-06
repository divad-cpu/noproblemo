import { getNeonAuth } from "@/lib/neon/auth";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

export const GET = (request: Request, context: Context) => getNeonAuth().handler().GET(request, context);
export const POST = (request: Request, context: Context) => getNeonAuth().handler().POST(request, context);
export const PUT = (request: Request, context: Context) => getNeonAuth().handler().PUT(request, context);
export const DELETE = (request: Request, context: Context) => getNeonAuth().handler().DELETE(request, context);
export const PATCH = (request: Request, context: Context) => getNeonAuth().handler().PATCH(request, context);
