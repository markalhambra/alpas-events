import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Light Postgres ping for Supabase Free. A few successful calls per day
 * usually count as activity; this does not guarantee the project stays up.
 * Only a paid plan disables inactivity pausing.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 * Vercel Cron sends this automatically when CRON_SECRET is set on the project.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: true,
      service: "alpas-events-keep-alive",
      ts: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Keep-alive failed";
    console.error("[keep-alive]", message);
    return NextResponse.json({ ok: false, error: "Database ping failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
