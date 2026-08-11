import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatusBadge } from "@/components/common/StatusBadges";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useAllSubmissions, useAllContainers } from "@/hooks/useOps";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports Station — SmartPort AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: subs, isLoading: subsLoading } = useAllSubmissions();
  const { data: containers, isLoading: contLoading } = useAllContainers();
  const submissions = subs ?? [];
  const containerList = containers ?? [];

  async function exportSubmissionsCsv() {
    if (submissions.length === 0) { toast.info("No shipment records to export"); return; }
    const headers = ["id", "reference", "vessel_name", "imo_number", "shipping_company", "cargo_type", "container_count", "dangerous_goods", "stage", "ai_risk_score", "berth_code", "created_at"];
    const csvRows = [headers.join(",")];
    for (const r of submissions) {
      csvRows.push([
        r.id,
        `"${r.reference}"`,
        `"${(r.vessel_name || "").replace(/"/g, '""')}"`,
        r.imo_number || "",
        `"${(r.shipping_company || "").replace(/"/g, '""')}"`,
        `"${(r.cargo_type || "").replace(/"/g, '""')}"`,
        r.container_count,
        r.dangerous_goods,
        r.stage,
        r.ai_risk_score ?? "",
        r.berth_code || "",
        r.created_at,
      ].join(","));
    }
    downloadCsv(csvRows.join("\n"), `psa-shipments-report-${Date.now()}.csv`);
  }

  async function exportContainersCsv() {
    if (containerList.length === 0) { toast.info("No container records to export"); return; }
    const headers = ["id", "container_no", "iso_type", "weight_kg", "hazardous", "stage", "yard_slot", "crane_id", "storage_slot", "truck_plate", "driver_name", "destination"];
    const csvRows = [headers.join(",")];
    for (const c of containerList) {
      csvRows.push([
        c.id,
        c.container_no,
        c.iso_type || "",
        c.weight_kg ?? "",
        c.hazardous,
        c.stage,
        c.yard_slot || "",
        c.crane_id || "",
        c.storage_slot || "",
        c.truck_plate || "",
        `"${(c.driver_name || "").replace(/"/g, '""')}"`,
        `"${(c.destination || "").replace(/"/g, '""')}"`,
      ].join(","));
    }
    downloadCsv(csvRows.join("\n"), `psa-containers-report-${Date.now()}.csv`);
  }

  async function exportAuditLogsCsv() {
    const { data: logs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
    const rows = logs ?? [];
    if (rows.length === 0) { toast.info("No audit logs to export"); return; }
    const headers = ["created_at", "actor_email", "action", "target_type", "target_id", "success", "ip_address"];
    const csvRows = [headers.join(",")];
    for (const l of rows) {
      csvRows.push([
        l.created_at,
        l.actor_email || "",
        l.action,
        l.target_type || "",
        l.target_id || "",
        l.success,
        l.ip_address || "",
      ].join(","));
    }
    downloadCsv(csvRows.join("\n"), `psa-audit-logs-report-${Date.now()}.csv`);
  }

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  }

  function handlePdfNotice() {
    toast.info("PDF report generation is not configured. Download CSV dataset instead.");
  }

  const reports = [
    {
      t: "Vessel Submissions & Approvals",
      desc: "Full record of vessel arrival submissions, AI risk scores, and stage progress.",
      format: "CSV",
      rows: submissions.length,
      action: exportSubmissionsCsv,
    },
    {
      t: "Container Movements & Yard Inventory",
      desc: "Live container positions across berth, yard, warehouse, and truck dispatch.",
      format: "CSV",
      rows: containerList.length,
      action: exportContainersCsv,
    },
    {
      t: "Platform Audit Log",
      desc: "Security audit trail covering logins, role changes, and stage decisions.",
      format: "CSV",
      rows: "Live DB",
      action: exportAuditLogsCsv,
    },
    {
      t: "Executive Operational Summary",
      desc: "Formatted PDF summary report for PSA port management.",
      format: "PDF",
      rows: "Engine Unconfigured",
      action: handlePdfNotice,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Reports Station"
        title="Export operational datasets & audit records."
        subtitle="Every report exports live PostgreSQL database records. Filters and RBAC rules are enforced."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <GlassCard key={r.t} className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan">
                  {r.format === "CSV" ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span className="text-xs font-mono uppercase tracking-widest">{r.format} Report</span>
                </div>
                <StatusBadge tone={r.format === "CSV" ? "cyan" : "muted"}>{r.format}</StatusBadge>
              </div>
              <h3 className="mt-3 font-medium text-base">{r.t}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">Records: {r.rows}</span>
              <button
                onClick={r.action}
                disabled={subsLoading || contLoading}
                className="h-8 px-3 rounded-md bg-gradient-to-r from-cyan to-violet text-background font-medium inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export {r.format}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}