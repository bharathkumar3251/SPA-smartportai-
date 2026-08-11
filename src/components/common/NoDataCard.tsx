import { Info } from "lucide-react";

export function NoDataCard({
  title,
  reason = "Data unavailable from public source",
  className,
}: {
  title?: string;
  reason?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-dashed border-border/70 bg-card/20 p-5 text-sm text-muted-foreground flex items-start gap-3 ${className ?? ""}`}>
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
      <div>
        {title && <div className="text-foreground/90 font-medium mb-0.5">{title}</div>}
        <div className="text-[12.5px] leading-relaxed">{reason}</div>
      </div>
    </div>
  );
}