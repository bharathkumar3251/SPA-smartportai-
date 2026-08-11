import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

function ago(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString();
}

export function LastUpdated({
  timestamp,
  onRefresh,
  isFetching,
  label = "Last updated",
}: {
  timestamp?: string | null;
  onRefresh?: () => void;
  isFetching?: boolean;
  label?: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
      <span className="uppercase tracking-widest">{label}</span>
      <span className="text-foreground/80">{ago(timestamp)}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isFetching}
          className="p-1 rounded-md hover:bg-white/[0.04] disabled:opacity-40 transition"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}