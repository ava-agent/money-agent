import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createTask, listTasks } from "@/lib/services/tasks";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters = {
    mode: sp.get("mode") ?? undefined,
    status: sp.get("status") ?? undefined,
    limit: sp.has("limit") ? parseInt(sp.get("limit")!) : undefined,
    offset: sp.has("offset") ? parseInt(sp.get("offset")!) : undefined,
  };

  const result = await listTasks(filters);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=5" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required (string)" }, { status: 400 });
  }
  if (body.reward == null || typeof body.reward !== "number" || body.reward < 10) {
    return NextResponse.json(
      { error: "reward is required and must be >= 10" },
      { status: 400 }
    );
  }

  const result = await createTask(auth.agent, {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    reward: body.reward,
    mode: body.mode,
    priority: body.priority,
    template_id: body.template_id,
    input_data: body.input_data,
    deadline: body.deadline,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
