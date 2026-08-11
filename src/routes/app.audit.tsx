import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ScrollText, Download, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/audit")({
  head: () => ({ meta: [{ title: "Audit Center — SmartPort AI" }] }),
  component: AuditPage,
});

type AuditRow = {
  id: string; actor_email: string | null; action: string;
  target_type: string | null; target_id: string | null;
  success: boolean; ip_address: string | null; user_agent: string | null;
  metadata: Record<string, unknown>; created_at: string;
};

function AuditPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("super_admin");
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).range(page*pageSize, page*pageSize + pageSize - 1);
      if (action) query = query.eq("action", action as never);
      const { data } = await query;
      if (!cancelled) setRows((data ?? []) as AuditRow[]);
    })();
    return () => { cancelled = true; };
  }, [page, action]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!q) return rows;
    const term = q.toLowerCase();
    return rows.filter((r) =>
      (r.actor_email ?? "").toLowerCase().includes(term) ||
      r.action.toLowerCase().includes(term) ||
      (r.target_id ?? "").toLowerCase().includes(term)
    );
  }, [rows, q]);

  function exportCsv() {
    if (!filtered) return;
    const headers = ["timestamp","actor","action","target","success","ip","user_agent"];
    const csv = [headers.join(","), ...filtered.map((r) => [
      r.created_at, r.actor_email ?? "", r.action,
      `${r.target_type ?? ""}:${r.target_id ?? ""}`, r.success, r.ip_address ?? "", `"${(r.user_agent ?? "").replace(/"/g,'""')}"`
    ].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-${new Date().toISOString()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader eyebrow="Security" title="Audit Center"
        subtitle={isAdmin ? "Full audit trail across the platform — logins, role changes, data access, AI runs." : "Your account activity — logins, password changes and data access."} />
      <GlassCard className="mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search actor, action or target…"
              className="w-full h-9 pl-8 pr-3 rounded-md bg-white/[0.03] border border-border text-sm outline-none focus:border-cyan/70" />
          </div>
          <select value={action} onChange={(e)=>{setAction(e.target.value); setPage(0);}}
            className="h-9 px-3 rounded-md bg-white/[0.03] border border-border text-sm outline-none focus:border-cyan/70">
            <option value="">All actions</option>
            {["login","logout","failed_login","password_change","role_change","user_created","user_disabled","user_activated","data_created","data_updated","data_deleted","ai_model_execution","report_generated","permission_denied"].map((a) => (
              <option key={a} value={a}>{a.replace(/_/g," ")}</option>
            ))}
          </select>
          <button onClick={exportCsv}
            className="h-9 px-3 rounded-md border border-border bg-white/[0.02] hover:bg-white/[0.05] text-sm inline-flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {!filtered ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading audit trail…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ScrollText className="w-6 h-6" />} title="No audit records" description="No events match your current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-mono">
                  <th className="text-left py-2 pr-4">Timestamp</th>
                  <th className="text-left py-2 pr-4">Actor</th>
                  <th className="text-left py-2 pr-4">Action</th>
                  <th className="text-left py-2 pr-4">Target</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 pr-4 font-mono text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.actor_email ?? "—"}</td>
                    <td className="py-2 pr-4"><span className="text-cyan font-mono text-[11px]">{r.action}</span></td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.target_type ? `${r.target_type}:${r.target_id?.slice(0,8) ?? ""}` : "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${r.success ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                        {r.success ? "ok" : "fail"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-[11px] text-muted-foreground">{r.ip_address ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1}</span>
          <div className="flex gap-2">
            <button onClick={()=>setPage(Math.max(0, page-1))} disabled={page===0}
              className="px-3 h-8 rounded border border-border hover:bg-white/[0.03] disabled:opacity-40">Previous</button>
            <button onClick={()=>setPage(page+1)} disabled={!filtered || filtered.length < pageSize}
              className="px-3 h-8 rounded border border-border hover:bg-white/[0.03] disabled:opacity-40">Next</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
