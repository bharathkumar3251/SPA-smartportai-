import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, BarsChart, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { ActivityCard, HelpCard, IntegrationPlaceholder, NotificationsCard } from "@/components/dash/Widgets";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { containerStageBars, dailySeries, monthlySeries, stageDistribution } from "@/lib/ops-metrics";
import { STAGE_META } from "@/lib/workflow";
import { BarChart3, Boxes, LineChart, PackageCheck, Ship, Timer } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Analytics Workspace — SmartPort AI" },
      { name: "description", content: "Operational analytics, throughput trends and exportable datasets built from live port records." },
      { property: "og:title", content: "Analytics Workspace — SmartPort AI" },
      { property: "og:description", content: "Explore and export SmartPort AI operational data." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const delivered = rows.filter((s) => s.stage === "delivered");
  const scored = rows.filter((s) => s.ai_risk_score != null);
  const avgRisk = scored.length ? Math.round(scored.reduce((n, s) => n + (s.ai_risk_score ?? 0), 0) / scored.length) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Data Analyst"
        title="Operational analytics & reporting."
        subtitle="Every metric is computed from live platform records. Export any dataset for downstream modelling."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Shipments" icon={Ship} loading={isLoading} value={rows.length} />
        <StatTile label="Containers" icon={Boxes} tone="violet" value={cts.length} />
        <StatTile label="Delivered" icon={PackageCheck} tone="success" loading={isLoading} value={delivered.length} />
        <StatTile label="Avg AI risk" icon={BarChart3} tone="warning" loading={isLoading}
          value={avgRisk == null ? undefined : `${avgRisk}/100`} unavailable={avgRisk == null} />
        <StatTile label="Dangerous goods" icon={Timer} tone="danger" loading={isLoading} value={rows.filter((s) => s.dangerous_goods).length} />
        <StatTile label="Stages in use" icon={LineChart} tone="cyan" loading={isLoading} value={new Set(rows.map((s) => s.stage)).size} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard className="lg:col-span-2" title="Shipment intake · 14 days" height={240}>
          {rows.length === 0 ? <NoDataCard title="No records available." reason="Analytics populate as shipments move through the workflow." />
            : <AreaTrend data={dailySeries(rows, 14, "shipments")} series={[{ key: "shipments", label: "Shipments", color: C.cyan }]} />}
        </ChartCard>
        <ChartCard title="Stage distribution" height={240}>
          {rows.length === 0 ? <NoDataCard title="No records available." reason="Distribution appears once shipments exist." />
            : <DonutChart data={stageDistribution(rows)} />}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="Monthly shipment volume" height={230}>
          {rows.length === 0 ? <NoDataCard title="No records available." reason="Monthly volume needs at least one shipment." />
            : <BarsChart data={monthlySeries(rows, 6, "shipments")} series={[{ key: "shipments", label: "Shipments", color: C.violet }]} />}
        </ChartCard>
        <ChartCard title="Containers by stage" height={230}>
          {cts.length === 0 ? <NoDataCard title="No container records." reason="Container analytics require registered manifests." />
            : <BarsChart data={containerStageBars(cts)} series={[{ key: "containers", label: "Containers", color: C.success }]} />}
        </ChartCard>
      </div>

      <div className="mt-4">
        <DataPanel
          title="Shipment dataset"
          subtitle="Full record set available for export"
          rows={rows}
          loading={isLoading}
          emptyTitle="No records available."
          filterKey="stage"
          filterLabel="All stages"
          searchKeys={["reference", "vessel_name", "shipping_company", "origin_port"]}
          exportName="smartport-shipments.csv"
          pageSize={8}
          columns={[
            { key: "reference", label: "Reference" },
            { key: "shipping_company", label: "Shipping line" },
            { key: "vessel_name", label: "Vessel" },
            { key: "origin_port", label: "Origin" },
            { key: "container_count", label: "Containers", align: "right" },
            { key: "ai_risk_score", label: "AI risk", align: "right", render: (r) => r.ai_risk_score == null ? "—" : String(Math.round(r.ai_risk_score)) },
            { key: "stage", label: "Stage", render: (r) => <StatusBadge status={STAGE_META[r.stage].label} /> },
          ]}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Recent operational events" />
        <div className="space-y-4">
          <NotificationsCard title="Analytics alerts" />
          <GlassCard>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">Congestion Predictive Scoring</div>
            <NoDataCard
              title="Congestion Model Offline"
              reason="Data unavailable from public source"
            />
          </GlassCard>
          <HelpCard />
        </div>
      </div>
    </div>
  );
}
