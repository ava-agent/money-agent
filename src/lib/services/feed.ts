import { createServerClient } from "@/lib/supabase/server";

export async function getLatestFeed(limit = 20, since?: string) {
  const supabase = createServerClient();

  const safeLimit = Math.min(
    Number.isFinite(limit) ? limit : 20,
    100
  );

  let query = supabase
    .from("activity_feed")
    .select("*, agent:agents(id, name, avatar_url), task:tasks(id, title, reward, status)")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (since) {
    // Validate ISO date
    if (isNaN(Date.parse(since))) {
      return [];
    }
    query = query.gt("created_at", since);
  }

  const { data } = await query;
  return data ?? [];
}
