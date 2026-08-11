import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Severity = "info" | "warning" | "danger" | "success";

const TONE: Record<Severity, { border: string; text: string; bg: string }> = {
  info: { border: "border-cyan/25", text: "text-cyan", bg: "bg-cyan/[0.06]" },
  warning: { border: "border-warning/30", text: "text-warning", bg: "bg-warning/[0.06]" },
  danger: { border: "border-danger/30", text: "text-danger", bg: "bg-danger/[0.06]" },
  success: { border: "border-success/30", text: "text-success", bg: "bg-success/[0.06]" },
};

export function AlertCard({
  title,
  message,
  severity = "info",
  icon: Icon = AlertTriangle,
  timestamp,
  action,
}: {
  title: string;
  message?: string;
  severity?: Severity;
  icon?: LucideIcon;
  timestamp?: string;
  action?: ReactNode;
}) {
  const t = TONE[severity];
  return (
    <div className={cn("rounded-lg border p-3.5 flex items-start gap-3", t.border, t.bg)}>
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", t.text)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className={cn("text-[13px] font-medium truncate", t.text)}>{title}</div>
          {timestamp && <div className="text-[10.5px] font-mono text-muted-foreground shrink-0">{timestamp}</div>}
        </div>
        {message && <div className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{message}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export function RecommendationCard({
  title,
  body,
  confidence,
  onApply,
}: {
  title: string;
  body?: string;
  confidence?: number;
  onApply?: () => void;
}) {
  return (
    <div className="rounded-lg border border-violet/25 bg-violet/[0.06] p-3.5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet" />
        <div className="text-[13px] font-medium text-violet">{title}</div>
        {confidence != null && (
          <span className="ml-auto text-[10.5px] font-mono text-violet/80">{Math.round(confidence * 100)}% conf</span>
        )}
      </div>
      {body && <div className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">{body}</div>}
      {onApply && (
        <button
          onClick={onApply}
          className="mt-2.5 text-[11px] px-2.5 py-1 rounded-md border border-violet/30 bg-violet/10 text-violet hover:bg-violet/20 transition"
        >
          Apply suggestion
        </button>
      )}
    </div>
  );
}