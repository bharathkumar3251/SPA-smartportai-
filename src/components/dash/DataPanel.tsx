import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode; align?: "left" | "right" };

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone =
    /(approved|cleared|delivered|active|operational|healthy|available|verified|completed|serving)/.test(s) ? "success"
    : /(pending|queued|idle|review|assigned|canary|staging|submitted)/.test(s) ? "cyan"
    : /(hold|maintenance|delay|low|degraded|warning|progress|due|manual)/.test(s) ? "warning"
    : /(reject|fail|critical|offline|high)/.test(s) ? "danger"
    : "muted";
  const cls = {
    success: "bg-success/10 text-success border-success/25",
    cyan: "bg-cyan/10 text-cyan border-cyan/25",
    warning: "bg-warning/10 text-warning border-warning/25",
    danger: "bg-danger/10 text-danger border-danger/25",
    muted: "bg-white/[0.05] text-muted-foreground border-border",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10.5px] font-mono uppercase tracking-wide", cls)}>{status}</span>;
}

/**
 * Enterprise table panel: search, filter, export, pagination.
 * Front-end only — rows are supplied by the caller.
 */
export function DataPanel<T extends { id: string }>({
  title,
  subtitle,
  rows,
  columns,
  searchKeys,
  filterKey,
  filterLabel = "All",
  pageSize = 6,
  actions,
  exportName = "smartport-export.csv",
  loading,
  emptyTitle,
  className,
}: {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T & string)[];
  filterKey?: keyof T & string;
  filterLabel?: string;
  pageSize?: number;
  actions?: ReactNode;
  exportName?: string;
  loading?: boolean;
  emptyTitle?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("__all");
  const [page, setPage] = useState(0);

  const options = useMemo(() => {
    if (!filterKey) return [];
    return Array.from(new Set(rows.map((r) => String(r[filterKey] ?? "")))).filter(Boolean).sort();
  }, [rows, filterKey]);

  const filtered = useMemo(() => {
    const keys = searchKeys ?? (columns.map((c) => c.key) as (keyof T & string)[]);
    return rows.filter((r) => {
      if (filterKey && filter !== "__all" && String(r[filterKey] ?? "") !== filter) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return keys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle));
    });
  }, [rows, q, filter, filterKey, searchKeys, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <GlassCard className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{title}</div>
          {subtitle && <div className="text-[12px] text-muted-foreground/80 mt-1">{subtitle}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Search…"
              className="h-8 w-[150px] rounded-md bg-white/[0.03] border border-border pl-8 pr-2 text-[12.5px] outline-none focus:border-cyan/50 transition"
            />
          </div>
          {filterKey && (
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                className="h-8 rounded-md bg-white/[0.03] border border-border pl-8 pr-2 text-[12.5px] outline-none focus:border-cyan/50 transition"
              >
                <option value="__all">{filterLabel}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
          <ExportButton rows={filtered as unknown as Record<string, unknown>[]} filename={exportName} />
          {actions}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: pageSize }).map((_, i) => <div key={i} className="skeleton h-9 w-full" />)}
        </div>
      ) : slice.length === 0 ? (
        <EmptyState title={emptyTitle ?? "No records match your filters"} description="Adjust the search or filter, or connect the live data feed." />
      ) : (
        <div className="overflow-x-auto scrollbar-thin -mx-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-3 py-2 font-normal", c.align === "right" ? "text-right" : "text-left")}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr key={row.id} className="border-t border-border/70 hover:bg-white/[0.03] transition">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2.5 whitespace-nowrap", c.align === "right" ? "text-right" : "text-left")}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
          <span className="text-[11.5px] text-muted-foreground font-mono">
            {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(0, current - 1))} disabled={current === 0}
              className="h-7 px-2 rounded border border-border/70 flex items-center gap-1 text-[11.5px] disabled:opacity-40 hover:border-cyan/40 transition">
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="text-[11.5px] font-mono px-2">{current + 1} / {pages}</span>
            <button onClick={() => setPage(Math.min(pages - 1, current + 1))} disabled={current >= pages - 1}
              className="h-7 px-2 rounded border border-border/70 flex items-center gap-1 text-[11.5px] disabled:opacity-40 hover:border-cyan/40 transition">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}