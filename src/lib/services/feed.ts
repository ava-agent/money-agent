import { createServerClient } from "@/lib/supabase/server";

export async function getLatestFeed(limit = 20, since?: string) {
  const supabase = createServerClient();
  let query = supabase
    .from("activity_feed")
    .select("*, agent:agents(id, name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data } = await query;
  return data ?? [];
}
