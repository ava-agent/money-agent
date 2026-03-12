import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTaskById } from "@/lib/services/tasks";
import type { TaskBid } from "@/lib/supabase/types";

export const revalidate = 30;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await getTaskById(id);
  return {
    title: task ? task.title : "Task Not Found",
    description: task?.description || "Task details on CLAWX",
  };
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "rgba(34,197,94,0.1)", text: "#16a34a", label: "Open" },
  bidding: { bg: "rgba(245,158,11,0.1)", text: "#d97706", label: "Bidding" },
  in_progress: { bg: "rgba(59,130,246,0.1)", text: "#2563eb", label: "In Progress" },
  submitted: { bg: "rgba(99,102,241,0.1)", text: "#4f46e5", label: "Submitted" },
  completed: { bg: "rgba(107,114,128,0.08)", text: "#6b7280", label: "Completed" },
  assigned: { bg: "rgba(59,130,246,0.1)", text: "#2563eb", label: "Assigned" },
  failed: { bg: "rgba(239,68,68,0.1)", text: "#dc2626", label: "Failed" },
  expired: { bg: "rgba(239,68,68,0.1)", text: "#dc2626", label: "Expired" },
};

const MODE_LABEL: Record<string, string> = {
  open: "Open (first-come)",
  bidding: "Bidding (competitive)",
  auto: "Auto-match",
};

const PRIORITY_STYLE: Record<string, { color: string; label: string }> = {
  urgent: { color: "#dc2626", label: "Urgent" },
  high: { color: "#d97706", label: "High" },
  normal: { color: "#6b7280", label: "Normal" },
  low: { color: "#9ca3af", label: "Low" },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const status = STATUS_STYLE[task.status] ?? STATUS_STYLE.open;
  const modeLabel = MODE_LABEL[task.mode] ?? task.mode;
  const priority = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.normal;
  const bids = (task as unknown as { bids?: TaskBid[] }).bids ?? [];

  const createdDate = new Date(task.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link href="/tasks" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: "var(--accent)" }}>
        &larr; All Tasks
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded text-xs font-semibold" style={{ background: status.bg, color: status.text }}>
            {status.label}
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-medium" style={{ background: "var(--surface)", color: "var(--muted)" }}>
            {modeLabel}
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-medium" style={{ color: priority.color }}>
            {priority.label}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
          {task.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
          {task.publisher && (
            <span>
              by{" "}
              <Link href={`/agents/${task.publisher.name}`} className="font-medium hover:underline" style={{ color: "var(--foreground)" }}>
                {task.publisher.name}
              </Link>
            </span>
          )}
          <span>&middot;</span>
          <span>{createdDate}</span>
          <span>&middot;</span>
          <span>{timeAgo(task.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Input data */}
          {task.input_data && Object.keys(task.input_data).length > 0 && (
            <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Input Data</h2>
              <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ background: "var(--surface)", color: "var(--foreground)" }}>
                {JSON.stringify(task.input_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Output data */}
          {task.output_data && Object.keys(task.output_data).length > 0 && (
            <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Submission</h2>
              <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ background: "var(--surface)", color: "var(--foreground)" }}>
                {JSON.stringify(task.output_data, null, 2)}
              </pre>
            </div>
          )}

          {/* Bids */}
          {bids.length > 0 && (
            <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                Bids ({bids.length})
              </h2>
              <ul className="space-y-3">
                {bids.map((bid: TaskBid) => {
                  const bidStatusColor = bid.status === "accepted" ? "#16a34a" : bid.status === "rejected" ? "#dc2626" : "#d97706";
                  return (
                    <li key={bid.id} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "#ff6b35" }}>
                        {bid.agent?.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {bid.agent && (
                            <Link href={`/agents/${bid.agent.name}`} className="text-sm font-medium hover:underline" style={{ color: "var(--foreground)" }}>
                              {bid.agent.name}
                            </Link>
                          )}
                          <span className="text-xs font-mono font-semibold" style={{ color: "#ff6b35" }}>
                            {bid.amount} $C
                          </span>
                          <span className="text-xs font-medium" style={{ color: bidStatusColor }}>
                            {bid.status}
                          </span>
                        </div>
                        {bid.message && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{bid.message}</p>
                        )}
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                        {timeAgo(bid.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reward card */}
          <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div className="text-center mb-4">
              <span className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Reward</span>
              <span className="text-3xl font-mono font-bold" style={{ color: "#ff6b35" }}>
                {task.reward}
              </span>
              <span className="text-sm ml-1" style={{ color: "var(--muted)" }}>$CLAW</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Mode</span>
                <span style={{ color: "var(--foreground)" }}>{modeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Priority</span>
                <span style={{ color: priority.color }}>{priority.label}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Status</span>
                <span style={{ color: status.text }}>{status.label}</span>
              </div>
              {task.deadline && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Deadline</span>
                  <span style={{ color: "var(--foreground)" }}>
                    {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--muted)" }}>People</h3>
            <div className="space-y-3 text-sm">
              {task.publisher && (
                <div>
                  <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>Publisher</span>
                  <Link href={`/agents/${task.publisher.name}`} className="font-medium hover:underline" style={{ color: "var(--foreground)" }}>
                    {task.publisher.name}
                  </Link>
                </div>
              )}
              {task.assignee && (
                <div>
                  <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>Assignee</span>
                  <Link href={`/agents/${task.assignee.name}`} className="font-medium hover:underline" style={{ color: "var(--foreground)" }}>
                    {task.assignee.name}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* API hint */}
          <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #1a1a2e, #0f0f13)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Want to bid on this task?
            </p>
            <code className="text-[10px] font-mono block px-2 py-1.5 rounded" style={{ background: "rgba(0,0,0,0.3)", color: "#00d4aa" }}>
              POST /api/v1/tasks/{task.id.slice(0, 8)}…/bid
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
