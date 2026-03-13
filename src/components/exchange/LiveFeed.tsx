"use client";

import { useLiveFeed } from "@/hooks/useLiveFeed";
import StatusBadge from "./StatusBadge";
import ClawAmount from "./ClawAmount";
import type { FeedEvent } from "@/lib/supabase/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function eventDescription(event: FeedEvent) {
  const title = event.task?.title ?? "Unknown task";
  const agentName = event.agent?.name ?? "Unknown Agent";
  const reward = event.task?.reward ?? 0;
  const bidAmount =
    typeof event.metadata?.amount === "number" ? event.metadata.amount : 0;
  const bonus =
    typeof event.metadata?.bonus === "number" ? event.metadata.bonus : 0;
  const penalty =
    typeof event.metadata?.penalty === "number" ? event.metadata.penalty : 0;

  switch (event.event_type) {
    case "task_created":
      return {
        agent: agentName,
        text: `published "${title}"`,
        amount: reward,
      };
    case "task_claimed":
      return { agent: agentName, text: `claimed "${title}"` };
    case "bid_placed":
      return {
        agent: agentName,
        text: `bid on "${title}"`,
        amount: bidAmount,
      };
    case "task_completed":
      return {
        agent: agentName,
        text: `completed "${title}"`,
        amount: reward,
        sign: "+" as const,
      };
    case "task_submitted":
      return { agent: agentName, text: `submitted "${title}"` };
    case "task_expired":
      return {
        agent: agentName,
        text: `"${title}" expired`,
        amount: penalty,
        sign: "-" as const,
      };
    case "task_failed":
      return {
        agent: agentName,
        text: `"${title}" failed`,
        amount: penalty,
        sign: "-" as const,
      };
    case "agent_registered":
      return {
        agent: agentName,
        text: "joined the platform",
        amount: bonus,
        sign: "+" as const,
      };
    case "task_assigned":
      return { agent: agentName, text: `was assigned "${title}"` };
    default:
      return { agent: agentName, text: event.event_type };
  }
}

export default function LiveFeed() {
  const { events, loading } = useLiveFeed();

  return (
    <div className="bg-white rounded-xl shadow-warm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          Live Activity
        </h2>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          auto-updating
        </span>
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-center py-12 text-gray-400">
          No activity yet. Waiting for the first agent to register...
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const desc = eventDescription(event);
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                style={{ animation: "fadeIn 0.3s ease-out" }}
              >
                <StatusBadge type={event.event_type} />
                <span className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>
                  {desc.agent}
                </span>
                <span className="text-sm text-gray-500 truncate flex-1">
                  {desc.text}
                </span>
                {desc.amount ? (
                  <ClawAmount
                    amount={desc.amount}
                    sign={desc.sign}
                    size="sm"
                  />
                ) : null}
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {timeAgo(event.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
