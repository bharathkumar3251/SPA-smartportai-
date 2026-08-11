import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { StatusBadge } from "@/components/common/StatusBadges";
import { Brain, Sparkles, CheckCircle2, AlertTriangle, ShieldX } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAiVerificationStats } from "@/lib/ai-workflow.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/ai")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({ meta: [{ title: "AI Administrator — SmartPort AI" }] }),
  component: AiAdminPage,
});

function AiAdminPage() {
  const fetchStats = useServerFn(getAiVerificationStats);
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["ai", "verification-stats"],
    queryFn: () => fetchStats(),
    staleTime: 15_000,
  });

  return (
    <div>
      <PageHeader
        eyebrow="AI Administrator Studio"
        title="Model performance & document verification telemetry."
        subtitle="Live metrics computed directly from document verification runs on the SmartPort AI platform."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total AI verifications"
          icon={Brain}
          tone="cyan"
          loading={isLoading}
          unavailable={isError}
          value={stats?.totalRuns ?? 0}
        />
        <StatTile
          label="Avg risk score"
          icon={Sparkles}
          tone="warning"
          loading={isLoading}
          unavailable={isError || stats?.avgRisk == null}
          value={stats?.avgRisk != null ? `${stats.avgRisk}/100` : undefined}
        />
        <StatTile
          label="Avg confidence"
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
          unavailable={isError || stats?.avgConfidence == null}
          value={stats?.avgConfidence != null ? `${stats.avgConfidence}%` : undefined}
        />
        <StatTile
          label="Flagged / Rejected"
          icon={AlertTriangle}
          tone="danger"
          loading={isLoading}
          unavailable={isError}
          value={(stats?.verdicts.needs_manual_review ?? 0) + (stats?.verdicts.rejected ?? 0)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Verification Verdicts</div>
              <div className="text-sm font-medium mt-0.5">Real document verification distribution</div>
            </div>
            <StatusBadge tone="cyan">{stats?.model ?? "Gemini 3.5 Flash"}</StatusBadge>
          </div>

          {!stats || stats.totalRuns === 0 ? (
            <NoDataCard
              title="No AI verifications recorded"
              reason="Upload vessel arrival documents in a shipping submission to run real AI verifications."
            />
          ) : (
            <div className="space-y-3">
              <VerdictRow
                label="Verified (Auto-Approved)"
                count={stats.verdicts.verified}
                total={stats.totalRuns}
                tone="success"
                icon={CheckCircle2}
              />
              <VerdictRow
                label="Needs Manual Review"
                count={stats.verdicts.needs_manual_review}
                total={stats.totalRuns}
                tone="warning"
                icon={AlertTriangle}
              />
              <VerdictRow
                label="Rejected (Rule / Risk Fail)"
                count={stats.verdicts.rejected}
                total={stats.totalRuns}
                tone="danger"
                icon={ShieldX}
              />
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">SHAP · Feature Importance</div>
          <NoDataCard
            title="SHAP feature importance unavailable"
            reason="Model training metrics unavailable — training infrastructure not configured"
          />
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Model Drift Telemetry</div>
          <NoDataCard
            title="Drift metrics unavailable"
            reason="Model training metrics unavailable — training infrastructure not configured"
          />
        </GlassCard>

        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">Model Deployment Registry</div>
          <div className="mt-4 border border-border/70 rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase tracking-wider">
                <tr>
                  <th className="text-left p-2.5">Model ID</th>
                  <th className="text-left p-2.5">Task</th>
                  <th className="text-left p-2.5">Provider</th>
                  <th className="text-right p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono">
                <tr>
                  <td className="p-2.5 font-medium">google/gemini-3.5-flash</td>
                  <td className="p-2.5 text-muted-foreground">Doc Verification &amp; Risk</td>
                  <td className="p-2.5 text-cyan">Lovable Gateway</td>
                  <td className="p-2.5 text-right"><StatusBadge tone="success">Active</StatusBadge></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">portcast-lstm-v1</td>
                  <td className="p-2.5 text-muted-foreground">Berth Queue Prediction</td>
                  <td className="p-2.5 text-muted-foreground">Local / Custom</td>
                  <td className="p-2.5 text-right"><StatusBadge tone="muted">Unconfigured</StatusBadge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <RecentExecutionsTable />
      </div>
    </div>
  );
}

function RecentExecutionsTable() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["ai", "recent-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_verifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">Recent AI Execution Logs</div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4">Loading executions…</div>
      ) : (runs ?? []).length === 0 ? (
        <NoDataCard
          title="No AI executions logged"
          reason="Model execution logs will appear here when document verifications are run."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase tracking-wider">
              <tr>
                <th className="text-left p-2.5">Timestamp</th>
                <th className="text-left p-2.5">Scope</th>
                <th className="text-left p-2.5">Verdict</th>
                <th className="text-right p-2.5">Risk Score</th>
                <th className="text-right p-2.5">Confidence</th>
                <th className="text-left p-2.5 pl-4">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono">
              {(runs ?? []).map((r: any) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="p-2.5 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2.5 capitalize">{r.scope}</td>
                  <td className="p-2.5 font-semibold">
                    <span className={r.verdict === "verified" ? "text-success" : r.verdict === "rejected" ? "text-danger" : "text-warning"}>
                      {r.verdict.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-medium">{r.risk_score}/100</td>
                  <td className="p-2.5 text-right">{r.confidence}%</td>
                  <td className="p-2.5 pl-4 text-cyan truncate">{r.model ?? "google/gemini-3.5-flash"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function VerdictRow({
  label, count, total, tone, icon: Icon,
}: {
  label: string; count: number; total: number; tone: "success" | "warning" | "danger"; icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = {
    success: "bg-success text-success",
    warning: "bg-warning text-warning",
    danger: "bg-danger text-danger",
  };

  return (
    <div className="p-3 rounded-lg border border-border/60 bg-white/[0.01]">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors[tone].split(" ")[1]}`} />
          <span className="font-medium">{label}</span>
        </div>
        <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div className={`h-full rounded-full ${colors[tone].split(" ")[0]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}