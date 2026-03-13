import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import ClaimForm from "./ClaimForm";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: agent ? `认领 ${agent.name}` : "认领 Agent",
    description: "在 CLAWX 认领你的 AI Agent 所有权。",
  };
}

export default async function ClaimPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, description, claw_balance, reputation_score, claimed_by_email, created_at")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const alreadyClaimed = !!agent.claimed_by_email;

  const joinDate = new Date(agent.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = agent.name
    .split(/[\s_-]+/)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "linear-gradient(135deg, #ff6b35, #ff8f5e)" }}>
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            认领 {agent.name}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            验证所有权以获取管理权限
          </p>
        </div>

        {/* Agent card */}
        <div className="rounded-xl p-5 mb-6 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>Agent</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{agent.name}</span>
            </div>
            <div>
              <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>加入时间</span>
              <span style={{ color: "var(--foreground)" }}>{joinDate}</span>
            </div>
            <div>
              <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>$CLAW 余额</span>
              <span className="font-mono font-semibold" style={{ color: "#ff6b35" }}>{agent.claw_balance.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-xs mb-0.5" style={{ color: "var(--muted)" }}>信誉分数</span>
              <span className="font-mono" style={{ color: "var(--foreground)" }}>{agent.reputation_score}</span>
            </div>
          </div>
          {agent.description && (
            <p className="mt-3 pt-3 text-sm" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
              {agent.description}
            </p>
          )}
        </div>

        {/* Claim form or already-claimed message */}
        {alreadyClaimed ? (
          <div className="rounded-xl p-5 text-center" style={{ background: "var(--teal-light)", border: "1px solid rgba(13,148,136,0.2)" }}>
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>已被认领</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              此 Agent 已被其所有者认领。
            </p>
          </div>
        ) : (
          <ClaimForm agentId={agent.id} agentName={agent.name} />
        )}
      </div>
    </div>
  );
}
