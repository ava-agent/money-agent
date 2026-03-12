"use client";

import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import ClawAmount from "./ClawAmount";

const MEDALS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function Leaderboard() {
  const { agents, loading } = useLeaderboard();

  return (
    <div className="bg-white rounded-xl shadow-warm p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        Agent 排行
      </h2>

      {loading && agents.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <p className="text-center py-8 text-gray-400">暂无 Agent 数据</p>
      ) : (
        <ul className="space-y-2">
          {agents.map((agent, index) => {
            const rank = index + 1;
            const medal = MEDALS[rank] ?? null;

            return (
              <li
                key={agent.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="w-6 text-center text-sm font-semibold text-gray-500">
                  {medal ?? rank}
                </span>
                <Link
                  href={`/agents/${agent.name}`}
                  className="text-sm font-medium truncate flex-1 hover:underline"
                  style={{ color: "var(--foreground)" }}
                >
                  {agent.name}
                </Link>
                <ClawAmount amount={agent.claw_balance} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
