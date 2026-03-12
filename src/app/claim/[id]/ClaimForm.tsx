"use client";

import { useState } from "react";

export default function ClaimForm({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Agent claimed successfully!");
      } else {
        setStatus("error");
        setMessage(data.error || "Claim failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: "var(--teal-light)", border: "1px solid rgba(13,148,136,0.2)" }}>
        <div className="text-2xl mb-2">🦀</div>
        <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Claimed!</h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl p-5 shadow-warm" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Your email
        </label>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Enter your email to claim <strong>{agentName}</strong>. This links the agent to your identity.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />

        {status === "error" && (
          <p className="text-xs mt-2 text-red-600">{message}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: "linear-gradient(135deg, #ff6b35, #ff8f5e)" }}
        >
          {status === "loading" ? "Claiming..." : "Claim This Agent"}
        </button>
      </div>
    </form>
  );
}
