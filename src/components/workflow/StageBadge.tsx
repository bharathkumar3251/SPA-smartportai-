import { STAGE_META, STAGE_FLOW, flowIndex, riskTone, type Stage, type Tone } from "@/lib/workflow";
import { cn } from "@/lib/utils";

const TONE: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-muted-foreground border-border",
  info: "bg-cyan/10 text-cyan border-cyan/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const meta = STAGE_META[stage];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10.5px] font-mono uppercase tracking-wider",
      TONE[meta.tone], className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
      {meta.label}
    </span>
  );
}

export function RiskBadge({ score, label = "Risk" }: { score: number | null | undefined; label?: string }) {
  const tone = riskTone(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10.5px] font-mono uppercase", TONE[tone])}>
      {label} {score == null ? "—" : Math.round(score)}
    </span>
  );
}

/** Horizontal pipeline rail showing where a submission sits in the workflow. */
export function StageRail({ stage }: { stage: Stage }) {
  const idx = flowIndex(stage);
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
      {STAGE_FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1 shrink-0">
          <div className={cn(
            "px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wide border whitespace-nowrap",
            i < idx ? "border-success/25 bg-success/10 text-success"
            : i === idx ? "border-cyan/40 bg-cyan/10 text-cyan"
            : "border-border/60 text-muted-foreground/60",
          )}>
            {STAGE_META[s].label}
          </div>
          {i < STAGE_FLOW.length - 1 && (
            <span className={cn("w-3 h-[1px]", i < idx ? "bg-success/40" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}