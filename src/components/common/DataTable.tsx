import type { ReactNode } from "react";

export function DataTable<T extends { id: string | number }>({
  columns, rows, empty,
}: {
  columns: { key: string; label: string; render?: (row: T) => ReactNode; align?: "left" | "right" }[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto scrollbar-thin -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 text-${c.align ?? "left"} font-normal`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border hover:bg-white/[0.03] transition">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 text-${c.align ?? "left"}`}>
                  {c.render ? c.render(row) : (row as any)[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pill({ tone = "cyan", children }: { tone?: "cyan" | "violet" | "success" | "warning" | "danger" | "muted"; children: ReactNode }) {
  const cls = {
    cyan: "bg-cyan/10 text-cyan border-cyan/20",
    violet: "bg-violet/10 text-violet border-violet/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    muted: "bg-white/[0.04] text-muted-foreground border-border",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border ${cls}`}>{children}</span>;
}