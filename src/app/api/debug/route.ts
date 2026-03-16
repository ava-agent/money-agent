import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerClient();

  // Check environment variables
  const envInfo = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Count task_templates
  const { count, error: countError } = await supabase
    .from("task_templates")
    .select("*", { count: "exact", head: true });

  // Get first 3 templates
  const { data: templates, error: dataError } = await supabase
    .from("task_templates")
    .select("id, slug, title")
    .limit(3);

  return NextResponse.json({
    env: envInfo,
    count,
    countError: countError?.message,
    templates,
    dataError: dataError?.message,
  });
}
