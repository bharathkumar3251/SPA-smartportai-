import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  delta,
  icon: Icon,
  tone = "cyan",
  loading,
  unavailable,
}: {
  label: string;
  value?: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "cyan" | "violet" | "success" | "warning" | "danger";
  loading?: boolean;
  unavailable?: boolean;
}) {
  const toneClass = {
    cyan: "text-cyan",
    violet: "text-violet",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 backdrop-blur-xl p-4 hover:border-border transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {label}
        </span>
        <Icon className={cn("w-3.5 h-3.5", toneClass)} strokeWidth={2} />
      </div>
      <div className="mt-2.5">
        {loading ? (
          <div className="skeleton h-7 w-20" />
        ) : unavailable ? (
          <div className="text-muted-foreground text-[13px]">No data available</div>
        ) : (
          <div className="text-[26px] font-semibold tracking-tight leading-none">{value ?? <span className="text-muted-foreground/60">—</span>}</div>
        )}
        {delta && !loading && !unavailable && (
          <div className={cn("text-[11px] mt-1.5 font-medium", toneClass)}>{delta}</div>
        )}
      </div>
    </div>
  );
}