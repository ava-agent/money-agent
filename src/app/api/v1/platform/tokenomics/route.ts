import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc("get_platform_tokenomics");

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to fetch tokenomics" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=10" },
  });
}
