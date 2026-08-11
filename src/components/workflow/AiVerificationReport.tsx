import { GlassCard } from "@/components/common/GlassCard";
import { NoDataCard } from "@/components/common/NoDataCard";
import { RiskBadge } from "./StageBadge";
import type { AiVerification } from "@/lib/workflow";
import { Sparkles, TriangleAlert, CheckCircle2, XCircle } from "lucide-react";

const VERDICT = {
  verified: { label: "Verified", cls: "text-success border-success/30 bg-success/10", Icon: CheckCircle2 },
  needs_manual_review: { label: "Needs Manual Review", cls: "text-warning border-warning/30 bg-warning/10", Icon: TriangleAlert },
  rejected: { label: "Rejected", cls: "text-danger border-danger/30 bg-danger/10", Icon: XCircle },
} as const;

export function AiVerificationReport({ report }: { report: AiVerification | null | undefined }) {
  if (!report) {
    return <NoDataCard title="AI verification report" reason="No verification has been run for this submission yet." />;
  }
  const v = VERDICT[report.verdict];
  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan" />
          <div>
            <div className="text-[13.5px] font-medium">AI verification report</div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {report.model ?? "smartport-ai"} · {new Date(report.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10.5px] font-mono uppercase ${v.cls}`}>
          <v.Icon className="w-3 h-3" /> {v.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-md border border-border/70 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Risk score</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tabular-nums">{Math.round(report.risk_score)}</span>
            <RiskBadge score={report.risk_score} label="" />
          </div>
        </div>
        <div className="rounded-md border border-border/70 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Confidence</div>
          <div className="text-xl font-semibold tabular-nums">{Math.round(report.confidence)}%</div>
        </div>
      </div>

      {report.checks?.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Checks</div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {report.checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] rounded border border-border/60 px-2 py-1.5">
                <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${
                  c.status === "pass" ? "bg-success" : c.status === "fail" ? "bg-danger" : "bg-warning"
                }`} />
                <div className="min-w-0">
                  <div className="text-foreground/90">{c.name}</div>
                  {c.detail && <div className="text-muted-foreground text-[11.5px]">{c.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Detected issues ({report.issues?.length ?? 0})
        </div>
        {(!report.issues || report.issues.length === 0) ? (
          <div className="text-[12.5px] text-success">No issues detected.</div>
        ) : (
          <ul className="space-y-1.5">
            {report.issues.map((i, k) => (
              <li key={k} className="flex items-start gap-2 text-[12.5px]">
                <span className={`mt-1 px-1 rounded text-[9.5px] font-mono uppercase shrink-0 ${
                  i.severity === "high" ? "bg-danger/15 text-danger"
                  : i.severity === "medium" ? "bg-warning/15 text-warning"
                  : "bg-white/10 text-muted-foreground"
                }`}>{i.severity ?? "low"}</span>
                <span className="text-foreground/85"><strong className="font-medium">{i.check}</strong> — {i.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {report.recommendations?.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Recommendations</div>
          <ul className="space-y-1 list-disc pl-4 text-[12.5px] text-foreground/85">
            {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}