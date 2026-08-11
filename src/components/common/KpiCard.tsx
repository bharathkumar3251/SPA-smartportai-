import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniSparkline } from "./MiniSparkline";

type Tone = "cyan" | "violet" | "success" | "warning" | "danger" | "muted";

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "cyan",
  loading,
  error,
  unavailable,
  spark,
}: {
  label: string;
  value?: string | number | null;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  icon?: LucideIcon;
  tone?: Tone;
  loading?: boolean;
  error?: boolean;
  unavailable?: boolean;
  spark?: number[];
}) {
  const toneText = {
    cyan: "text-cyan",
    violet: "text-violet",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-muted-foreground",
  }[tone];
  const deltaTone =
    delta?.direction === "up" ? "text-success" : delta?.direction === "down" ? "text-danger" : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border/70 bg-card/40 backdrop-blur-xl p-4 hover:border-border transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</span>
        {Icon && <Icon className={cn("w-3.5 h-3.5", toneText)} strokeWidth={2} />}
      </div>
      <div className="mt-2.5">
        {loading ? (
          <div className="skeleton h-7 w-24" />
        ) : error ? (
          <div className="text-danger text-[13px]">Unavailable</div>
        ) : unavailable || value == null || value === "" ? (
          <div className="text-muted-foreground text-[12.5px]">Data unavailable from public source</div>
        ) : (
          <div className="text-[24px] font-semibold tracking-tight leading-none">{value}</div>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2 min-h-[14px]">
          <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
          {delta && !loading && !unavailable && !error && (
            <span className={cn("text-[11px] font-medium font-mono", deltaTone)}>{delta.value}</span>
          )}
        </div>
        {spark && spark.length > 1 && !unavailable && !loading && !error && (
          <div className="mt-2 opacity-80">
            <MiniSparkline values={spark} tone={tone} />
          </div>
        )}
      </div>
    </div>
  );
}
