import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { submitTask } from "@/lib/services/tasks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.output_data || typeof body.output_data !== "object") {
    return NextResponse.json(
      { error: "output_data is required (object)" },
      { status: 400 }
    );
  }

  const result = await submitTask(id, auth.agent, body.output_data);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
