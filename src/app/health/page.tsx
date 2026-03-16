import type { Metadata } from "next";
import { getHealthCheckHistory } from "@/lib/services/healthcheck";

export const metadata: Metadata = {
  title: "System Health",
  description: "Platform health check dashboard showing lifecycle test results.",
};

export const revalidate = 300; // refresh every 5 minutes

interface Step {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration_ms: number;
  detail?: string;
}

interface HealthCheck {
  id: string;
  run_at: string;
  status: string;
  duration_ms: number;
  steps: Step[];
  error: string | null;
  task_id: string | null;
}

function StepRow({ step }: { step: Step }) {
  const icon = step.status === "passed" ? "\u2713" : step.status === "failed" ? "\u2717" : "\u2013";
  const color = step.status === "passed" ? "text-green-600" : step.status === "failed" ? "text-red-600" : "text-gray-400";

  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${color}`}>{icon}</span>
        <span style={{ color: "var(--foreground)" }}>{step.name.replace(/_/g, " ")}</span>
      </div>
      <div className="flex items-center gap-3">
        {step.detail && (
          <span className="text-xs font-mono max-w-[300px] truncate" style={{ color: "var(--muted)" }}>
            {step.detail}
          </span>
        )}
        <span className="text-xs font-mono w-16 text-right" style={{ color: "var(--muted)" }}>
          {step.duration_ms}ms
        </span>
      </div>
    </div>
  );
}

function CheckCard({ check }: { check: HealthCheck }) {
  const isPassed = check.status === "passed";
  const date = new Date(check.run_at);
  const timeStr = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div
      className="rounded-xl p-5 shadow-warm"
      style={{ backgroundColor: "var(--card-bg)", border: `1px solid ${isPassed ? "var(--border)" : "#fca5a5"}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
              isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isPassed ? "PASSED" : "FAILED"}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>{timeStr}</span>
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
          {check.duration_ms}ms total
        </span>
      </div>

      {check.error && (
        <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5 mb-3 font-mono">
          {check.error}
        </div>
      )}

      <div className="rounded-lg px-3 py-1" style={{ backgroundColor: "var(--surface)" }}>
        {check.steps.map((step, i) => (
          <StepRow key={i} step={step} />
        ))}
      </div>
    </div>
  );
}

export default async function HealthPage() {
  const checks = await getHealthCheckHistory(30);

  const passed = checks.filter((c: HealthCheck) => c.status === "passed").length;
  const failed = checks.filter((c: HealthCheck) => c.status === "failed").length;
  const uptime = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;
  const latest = checks[0] as HealthCheck | undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1
          className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          System Health
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Automated lifecycle checks run daily at 08:00 UTC. Each run tests the full task flow:
          register &rarr; publish &rarr; claim &rarr; submit &rarr; complete.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-xl p-4 text-center shadow-warm"
          style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-2xl font-bold" style={{ color: uptime >= 90 ? "var(--teal)" : "var(--accent)" }}>
            {uptime}%
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Uptime (last 30)</div>
        </div>
        <div
          className="rounded-xl p-4 text-center shadow-warm"
          style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-2xl font-bold text-green-600">{passed}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Passed</div>
        </div>
        <div
          className="rounded-xl p-4 text-center shadow-warm"
          style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Failed</div>
        </div>
      </div>

      {/* Current status */}
      {latest && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Latest Check
          </h2>
          <CheckCard check={latest} />
        </div>
      )}

      {/* History */}
      {checks.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold mb-2 mt-8" style={{ color: "var(--foreground)" }}>
            History
          </h2>
          <div className="space-y-3">
            {checks.slice(1).map((check: HealthCheck) => (
              <CheckCard key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}

      {checks.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p style={{ color: "var(--muted)" }}>No health checks recorded yet. The first check will run at 08:00 UTC.</p>
        </div>
      )}
    </div>
  );
}
