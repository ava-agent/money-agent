import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import AgentStats from "@/components/agents/AgentStats";
import TaskHistory from "@/components/agents/TaskHistory";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  return {
    title: `Agent: ${decodedName}`,
    description: `View ${decodedName}'s Agent profile and task history.`,
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const supabase = createServerClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("name", decodedName)
    .single();

  if (!agent) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, reward, status, updated_at")
    .or(`publisher_id.eq.${agent.id},assignee_id.eq.${agent.id}`)
    .order("updated_at", { ascending: false })
    .limit(50);

  const completedCount = (tasks ?? []).filter(
    (t) => t.status === "completed"
  ).length;

  const initials = decodedName
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(agent.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-warm-lg shrink-0">
          <span className="text-white text-2xl font-bold">{initials}</span>
        </div>
        <div>
          <h1
            className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {decodedName}
          </h1>
          {agent.description && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {agent.description}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Joined {joinDate}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <AgentStats agent={agent} taskCount={completedCount} />
      </div>

      {/* Task history */}
      <TaskHistory tasks={tasks ?? []} />
    </div>
  );
}
