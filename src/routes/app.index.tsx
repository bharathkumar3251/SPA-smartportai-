import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { KpiCard } from "@/components/common/KpiCard";
import { NoDataCard } from "@/components/common/NoDataCard";
import { ChartCard, AreaTrend, DonutChart, MeterList, C } from "@/components/dash/Charts";
import { ActivityCard, NotificationsCard, SectionTitle } from "@/components/dash/Widgets";
import { StageBadge } from "@/components/workflow/StageBadge";
import { Activity, Anchor, Boxes, Ship, Timer, Container as ContainerIcon } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { dailySeries, inStages, stageCounts, stageDistribution, countBy } from "@/lib/ops-metrics";
import { STAGE_META, type Stage } from "@/lib/workflow";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Operations Overview — SmartPort AI" },
      { name: "description", content: "Live cross-portal view of vessel submissions, approvals and container movements at PSA Singapore." },
      { property: "og:title", content: "Operations Overview — SmartPort AI" },
      { property: "og:description", content: "Live cross-portal view of vessel submissions, approvals and container movements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});

const PENDING: Stage[] = ["uploaded", "ai_verification", "ai_needs_review", "authority_review", "final_approval"];
const CUSTOMS: Stage[] = ["authority_approved", "customs_review", "customs_hold"];
const BERTH: Stage[] = ["final_approved", "berth_assigned", "terminal_scheduled", "unloading"];
const INLAND: Stage[] = ["warehouse_received", "dispatch_ready", "in_transit"];

function OverviewPage() {
  const subsQ = useAllSubmissions();
  const contQ = useAllContainers();
  const subs = subsQ.data ?? [];
  const containers = contQ.data ?? [];

  const counts = stageCounts(subs);
  const trend = dailySeries(subs, 14, "submissions");
  const spark = trend.map((r) => Number(r['submissions'] ?? 0));
  const delivered = subs.filter((s) => s.stage === "delivered").length;
  const clearance = subs.length ? Math.round((delivered / subs.length) * 100) : null;

  const containerStages = countBy(containers, (c) => c.stage);
  const meters = Object.entries(containerStages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => ({
      label: k.replace(/_/g, " "),
      value: containers.length ? Math.round((v / containers.length) * 100) : 0,
      hint: `${v} containers`,
      tone: "cyan" as const,
    }));

  const active = subs.filter((s) => s.stage !== "delivered");
  const recent = subs.slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Command overview"
        title="Global operational picture."
        subtitle="Live cross-portal KPIs from your port operations database — PSA Singapore pilot."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active shipments" icon={Ship} tone="cyan" loading={subsQ.isLoading} error={subsQ.isError}
          value={subsQ.isLoading ? undefined : active.length} hint={`${subs.length} total on record`} spark={spark} />
        <KpiCard label="Awaiting approval" icon={Timer} tone="warning" loading={subsQ.isLoading} error={subsQ.isError}
          value={subsQ.isLoading ? undefined : inStages(subs, PENDING).length} hint="Authority & AI review queues" />
        <KpiCard label="In customs" icon={Anchor} tone="violet" loading={subsQ.isLoading} error={subsQ.isError}
          value={subsQ.isLoading ? undefined : inStages(subs, CUSTOMS).length} hint="Clearance and inspection holds" />
        <KpiCard label="Containers tracked" icon={ContainerIcon} tone="success" loading={contQ.isLoading} error={contQ.isError}
          value={contQ.isLoading ? undefined : containers.length} hint={`${containerStages['delivered'] ?? 0} delivered`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-8">
        <ChartCard className="lg:col-span-2" title="Submission volume · 14 days"
          subtitle="Vessel document submissions recorded in the platform">
          {trend.length > 0 ? (
            <AreaTrend data={trend} series={[{ key: "submissions", label: "Submissions", color: C.cyan }]} />
          ) : (
            <NoDataCard title="No submissions yet" reason="Once a shipping line files vessel documents, volume appears here." />
          )}
        </ChartCard>

        <ChartCard title="Pipeline distribution" subtitle="Where shipments are sitting right now">
          {subs.length > 0 ? <DonutChart data={stageDistribution(subs)} />
            : <NoDataCard title="Pipeline empty" reason="No shipments are currently in the workflow." />}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Container movement" subtitle="Live yard, warehouse and haulage positions" height={240}>
          {meters.length > 0 ? <MeterList items={meters} />
            : <NoDataCard title="No containers registered" reason="Container manifests appear here once a terminal registers them." />}
        </ChartCard>

        <GlassCard>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Latest shipments</div>
          {subsQ.isLoading ? (
            <div className="mt-4 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-8 w-full" />)}</div>
          ) : recent.length === 0 ? (
            <NoDataCard className="mt-4" title="Nothing filed yet" reason="New vessel submissions will be listed here." />
          ) : (
            <ul className="mt-3 divide-y divide-border/70">
              {recent.map((s) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] truncate">{s.vessel_name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">{s.reference}</div>
                  </div>
                  <StageBadge stage={s.stage} />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <NotificationsCard limit={6} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" limit={10} />
        <GlassCard>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Stage backlog</div>
          <ul className="mt-3 space-y-2">
            {[...BERTH, ...INLAND].map((st) => (
              <li key={st} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-muted-foreground">{STAGE_META[st].label}</span>
                <span className="font-mono">{counts[st] ?? 0}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 text-[12.5px] pt-2 border-t border-border/70">
              <span className="text-muted-foreground">Completion rate</span>
              <span className="font-mono text-success">{clearance == null ? "—" : `${clearance}%`}</span>
            </li>
          </ul>
        </GlassCard>
      </div>

      <div className="mt-8">
        <SectionTitle>Role workspaces</SectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <Link key={r.id} to={r.home} className="group">
              <GlassCard className="h-full group-hover:border-cyan/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20 flex items-center justify-center text-cyan">
                    <r.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium">{r.label}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
