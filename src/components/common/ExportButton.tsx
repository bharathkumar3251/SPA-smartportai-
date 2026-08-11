import { Download } from "lucide-react";

function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return "";
  const cols = columns ?? Array.from(rows.reduce<Set<string>>((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set()));
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc((r as any)[c])).join(","))].join("\n");
}

export function ExportButton<T extends Record<string, unknown>>({
  rows,
  columns,
  filename = "smartport-export.csv",
  disabled,
  label = "Export CSV",
}: {
  rows: T[];
  columns?: (keyof T & string)[];
  filename?: string;
  disabled?: boolean;
  label?: string;
}) {
  const handle = () => {
    const csv = toCsv(rows as Record<string, unknown>[], columns as string[] | undefined);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={handle}
      disabled={disabled || !rows.length}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 bg-card/40 hover:bg-white/[0.04] text-xs disabled:opacity-40 transition"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}