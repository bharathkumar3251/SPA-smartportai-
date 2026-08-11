import { useMemo, useState } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ExportButton } from "@/components/common/ExportButton";
import { StatusBadge } from "@/components/dash/DataPanel";
import { useAllContainers, useAllSubmissions, useBulkUpdateContainers } from "@/hooks/useOps";
import { useAuth } from "@/hooks/useAuth";
import { checkContainerTransition } from "@/lib/status-engine";
import type { ContainerRow } from "@/lib/workflow";
import { Boxes, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ContainerField = {
  key: keyof ContainerRow;
  label: string;
  type?: "text" | "datetime-local";
  required?: boolean;
};

/**
 * Operational container board: filter by container stage, select rows and apply a
 * real database update (assignment fields + next stage) for the selected records.
 */
export function ContainerBoard({
  title,
  subtitle,
  stages,
  emptyTitle,
  emptyDescription,
  fields = [],
  advance,
  exportName = "containers.csv",
  className,
}: {
  title: string;
  subtitle?: string;
  stages: ContainerRow["stage"][];
  emptyTitle: string;
  emptyDescription: string;
  fields?: ContainerField[];
  advance?: { label: string; stage: ContainerRow["stage"] };
  exportName?: string;
  className?: string;
}) {
  const { data: all, isLoading } = useAllContainers();
  const { data: subs } = useAllSubmissions();
  const update = useBulkUpdateContainers();
  const { roles } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const refFor = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subs ?? []) map.set(s.id, `${s.reference} · ${s.vessel_name}`);
    return map;
  }, [subs]);

  const rows = useMemo(() => {
    const base = (all ?? []).filter((c) => stages.includes(c.stage));
    if (!q.trim()) return base;
    const needle = q.toLowerCase();
    return base.filter((c) =>
      [c.container_no, c.yard_slot, c.storage_slot, c.truck_plate, c.driver_name, refFor.get(c.submission_id)]
        .some((v) => (v ?? "").toLowerCase().includes(needle)),
    );
  }, [all, stages, q, refFor]);

  const allSelected = rows.length > 0 && selected.length === rows.length;

  async function apply() {
    const missing = fields.filter((f) => f.required && !values[String(f.key)]?.trim());
    if (missing.length > 0) {
      toast.error(`${missing.map((m) => m.label).join(", ")} required`);
      return;
    }
    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[String(f.key)];
      if (v && v.trim()) patch[String(f.key)] = f.type === "datetime-local" ? new Date(v).toISOString() : v.trim();
    }
    if (advance) patch['stage'] = advance.stage;
    if (Object.keys(patch).length === 0) { toast.error("Nothing to update"); return; }
    if (advance) {
      const blocked = rows
        .filter((r) => selected.includes(r.id))
        .map((r) => ({ r, check: checkContainerTransition(r.stage, advance.stage, roles) }))
        .filter((x) => !x.check.ok);
      if (blocked.length > 0) {
        const first = blocked[0];
        toast.error(first.check.ok ? "Movement not permitted" : first.check.reason, {
          description: `${blocked.length} selected container${blocked.length > 1 ? "s" : ""} cannot make this move (e.g. ${first.r.container_no}).`,
        });
        return;
      }
    }
    try {
      await update.mutateAsync({ ids: selected, patch: patch as Partial<ContainerRow> });
      toast.success(`${selected.length} container${selected.length > 1 ? "s" : ""} updated`);
      setSelected([]);
      setValues({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <GlassCard className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{title}</div>
          {subtitle && <div className="text-[12px] text-muted-foreground/80 mt-1">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search containers…"
              className="h-8 w-[190px] pl-8 pr-2 rounded-md bg-white/[0.03] border border-border text-[12.5px] outline-none focus:border-cyan/60" />
          </div>
          <ExportButton rows={rows as unknown as Record<string, unknown>[]} filename={exportName} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-9" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Boxes className="w-5 h-5" />} title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-widest text-muted-foreground font-mono">
                  <th className="px-2 py-2 w-8">
                    <input type="checkbox" className="accent-cyan" checked={allSelected}
                      onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} aria-label="Select all" />
                  </th>
                  <th className="px-3 py-2 text-left font-normal">Container</th>
                  <th className="px-3 py-2 text-left font-normal">Shipment</th>
                  <th className="px-3 py-2 text-left font-normal">Yard</th>
                  <th className="px-3 py-2 text-left font-normal">Storage</th>
                  <th className="px-3 py-2 text-left font-normal">Truck / driver</th>
                  <th className="px-3 py-2 text-left font-normal">Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={cn("border-t border-border hover:bg-white/[0.03] transition", selected.includes(c.id) && "bg-white/[0.05]")}>
                    <td className="px-2 py-2.5">
                      <input type="checkbox" className="accent-cyan" checked={selected.includes(c.id)}
                        onChange={(e) => setSelected((s) => e.target.checked ? [...s, c.id] : s.filter((id) => id !== c.id))}
                        aria-label={`Select ${c.container_no}`} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12.5px]">{c.container_no}{c.hazardous && <span className="ml-1.5 text-danger text-[10px]">IMDG</span>}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-muted-foreground">{refFor.get(c.submission_id) ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{c.yard_slot ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{c.storage_slot ?? "—"}</td>
                    <td className="px-3 py-2.5 text-[12px]">{c.truck_plate ? `${c.truck_plate}${c.driver_name ? ` · ${c.driver_name}` : ""}` : "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.stage.replace(/_/g, " ")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(fields.length > 0 || advance) && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Apply to {selected.length} selected
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                {fields.map((f) => (
                  <label key={String(f.key)} className="block">
                    <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                      {f.label}{f.required ? " *" : ""}
                    </span>
                    <input type={f.type ?? "text"} value={values[String(f.key)] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [String(f.key)]: e.target.value }))}
                      className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60" />
                  </label>
                ))}
                <button onClick={apply} disabled={selected.length === 0 || update.isPending}
                  className="h-9 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-[12.5px] inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {advance?.label ?? "Save changes"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
