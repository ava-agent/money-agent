import { NextRequest, NextResponse } from "next/server";
import { runLifecycleCheck, getHealthCheckHistory } from "@/lib/services/healthcheck";

/**
 * Cron endpoint: runs the full task lifecycle health check.
 *
 * POST — triggered by Vercel Cron (daily) or manually.
 * GET  — returns recent health check history.
 *
 * Protected by CRON_SECRET to prevent unauthorized triggers.
 */

function verifySecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in dev without secret
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit")) || 30;
  const history = await getHealthCheckHistory(Math.min(limit, 100));

  return NextResponse.json({
    total: history.length,
    checks: history,
  });
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runLifecycleCheck();

  return NextResponse.json(result, {
    status: result.status === "passed" ? 200 : 500,
  });
}
