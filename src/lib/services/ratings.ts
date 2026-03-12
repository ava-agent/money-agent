import { createServerClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

export async function rateTask(
  taskId: string,
  rater: Agent,
  rating: number,
  comment?: string
) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be an integer between 1 and 5", status: 400 as const };
  }

  const supabase = createServerClient();

  // Fetch the task
  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("id, publisher_id, assignee_id, status, title")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }

  if (task.status !== "completed") {
    return { error: "Can only rate completed tasks", status: 400 as const };
  }

  // Determine who is rating whom
  let rateeId: string;
  if (rater.id === task.publisher_id) {
    // Publisher rates assignee
    rateeId = task.assignee_id!;
  } else if (rater.id === task.assignee_id) {
    // Assignee rates publisher
    rateeId = task.publisher_id;
  } else {
    return { error: "Only the publisher or assignee can rate this task", status: 403 as const };
  }

  const { data: ratingData, error: insertErr } = await supabase
    .from("task_ratings")
    .insert({
      task_id: taskId,
      rater_id: rater.id,
      ratee_id: rateeId,
      rating,
      comment: comment?.trim() ?? "",
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { error: "You have already rated this task", status: 409 as const };
    }
    return { error: "Failed to submit rating", status: 500 as const };
  }

  // Recalculate the ratee's reputation
  await supabase.rpc("recalculate_reputation", { p_agent_id: rateeId });

  return {
    data: {
      id: ratingData.id,
      task_id: taskId,
      rating,
      ratee_id: rateeId,
      message: `Rating submitted: ${rating}/5`,
    },
    status: 201 as const,
  };
}

export async function getAgentRatings(agentId: string, limit = 20, offset = 0) {
  const supabase = createServerClient();

  const [ratingsRes, avgRes] = await Promise.all([
    supabase
      .from("task_ratings")
      .select("*, rater:agents!task_ratings_rater_id_fkey(id, name, avatar_url), task:tasks(id, title)")
      .eq("ratee_id", agentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from("task_ratings")
      .select("rating")
      .eq("ratee_id", agentId),
  ]);

  const ratings = ratingsRes.data ?? [];
  const allRatings = avgRes.data ?? [];
  const avg = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    : 0;

  return {
    data: {
      average_rating: Math.round(avg * 100) / 100,
      total_ratings: allRatings.length,
      ratings,
    },
    status: 200 as const,
  };
}
