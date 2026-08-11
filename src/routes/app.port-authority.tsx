import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { KpiCard } from "@/components/common/KpiCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge, LiveBadge } from "@/components/common/StatusBadges";
import { NoDataCard } from "@/components/common/NoDataCard";
import { LastUpdated } from "@/components/common/LastUpdated";
import { ExportButton } from "@/components/common/ExportButton";
import { MapboxMap, type MapMarker } from "@/components/common/MapboxMap";
import { MapLegend } from "@/components/common/MapLegend";
import { Toolbar } from "@/components/common/Toolbar";
import { EmptyState } from "@/components/common/EmptyState";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  useSingaporeWeather,
  useSingaporeThroughput,
  useAisSnapshot,
} from "@/hooks/usePublicData";
import type { AisVessel } from "@/lib/public-data.functions";
import { Ship, Anchor, Wind, Gauge, Cloud, Eye, Droplets, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/port-authority")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Port Authority — SmartPort AI" },
      { name: "description", content: "PSA Singapore live port operations: AIS vessels, weather, throughput and berth activity." },
    ],
  }),
  component: PortAuthority,
});

function classifyVessel(v: AisVessel): { status: "moored" | "anchored" | "underway"; tone: "muted" | "warning" | "success" } {
  const sog = v.sog ?? 0;
  if (sog < 0.5) return { status: "moored", tone: "muted" };
  if (sog < 3) return { status: "anchored", tone: "warning" };
  return { status: "underway", tone: "success" };
}

function speedColor(sog?: number): string {
  if (sog == null) return "#94a3b8";
  if (sog < 0.5) return "#64748b";
  if (sog < 3) return "#f59e0b";
  if (sog < 10) return "#22d3ee";
  return "#22c55e";
}

function PortAuthority() {
  const qc = useQueryClient();
  const weather = useSingaporeWeather();
  const throughput = useSingaporeThroughput();
  const ais = useAisSnapshot();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "moored" | "anchored" | "underway">("all");

  useAutoRefresh(
    [["public", "ais", "singapore"], ["public", "weather", "singapore"]],
    45_000,
  );

  const vessels = ais.data?.vessels ?? [];

  const markers: MapMarker[] = useMemo(
    () =>
      vessels.slice(0, 400).map((v) => ({
        id: v.mmsi,
        lat: v.lat,
        lon: v.lon,
        color: speedColor(v.sog),
        title: `${v.name ?? "MMSI " + v.mmsi} · SOG ${(v.sog ?? 0).toFixed(1)}kn · COG ${(v.cog ?? 0).toFixed(0)}°`,
      })),
    [vessels],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vessels
      .map((v) => ({ ...v, ...classifyVessel(v) }))
      .filter((v) => (statusFilter === "all" ? true : v.status === statusFilter))
      .filter((v) => {
        if (!needle) return true;
        return (v.name ?? "").toLowerCase().includes(needle) || String(v.mmsi).includes(needle);
      });
  }, [vessels, q, statusFilter]);

  const avgSog = vessels.length
    ? vessels.reduce((s, v) => s + (v.sog ?? 0), 0) / vessels.length
    : 0;

  const throughputSeries = throughput.data ?? [];
  const validTeu = throughputSeries.filter((r) => r.teu != null) as { year: number; teu: number }[];
  const latest = validTeu[validTeu.length - 1];
  const prev = validTeu[validTeu.length - 2];
  const teuDelta = latest && prev ? ((latest.teu - prev.teu) / prev.teu) * 100 : null;

  const exportRows = filtered.map((v) => ({
    mmsi: v.mmsi,
    name: v.name ?? "",
    status: v.status,
    lat: v.lat,
    lon: v.lon,
    sog_kn: v.sog ?? "",
    cog_deg: v.cog ?? "",
    heading: v.heading ?? "",
    received_at: v.received_at,
  }));

  const aisAvailable = ais.data?.source === "aisstream";
  const observedAt = ais.data?.observed_at ?? weather.data?.observed_at ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Port of Singapore · PSA"
        title="Port Authority Operations Center"
        subtitle="Live AIS vessel traffic, marine weather and container throughput for the Singapore Strait and PSA terminals."
        actions={
          <div className="flex items-center gap-2">
            <LiveBadge active={aisAvailable} label={aisAvailable ? "LIVE · AIS" : "AIS OFFLINE"} />
            <LastUpdated
              timestamp={observedAt}
              isFetching={ais.isFetching || weather.isFetching}
              onRefresh={() => {
                qc.invalidateQueries({ queryKey: ["public", "ais", "singapore"] });
                qc.invalidateQueries({ queryKey: ["public", "weather", "singapore"] });
              }}
            />
          </div>
        }
      />

      {/* KPI strip — all real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Vessels in bbox"
          icon={Ship}
          tone="cyan"
          loading={ais.isLoading}
          error={ais.isError}
          unavailable={!aisAvailable}
          value={aisAvailable ? vessels.length.toLocaleString() : undefined}
          hint={aisAvailable ? `${ais.data?.collected_ms ?? 0}ms AIS window` : ais.data?.reason ?? "AIS unavailable"}
        />
        <KpiCard
          label="Avg speed over ground"
          icon={Gauge}
          tone="violet"
          loading={ais.isLoading}
          unavailable={!aisAvailable || !vessels.length}
          value={aisAvailable && vessels.length ? `${avgSog.toFixed(1)} kn` : undefined}
          hint="Averaged across live AIS reports"
        />
        <KpiCard
          label="Wind at PSA"
          icon={Wind}
          tone="warning"
          loading={weather.isLoading}
          error={weather.isError}
          value={weather.data ? `${weather.data.wind_speed_kn.toFixed(1)} kn` : undefined}
          hint={weather.data ? `${weather.data.condition} · ${weather.data.wind_deg.toFixed(0)}°` : undefined}
        />
        <KpiCard
          label="Container throughput (TEU)"
          icon={TrendingUp}
          tone="success"
          loading={throughput.isLoading}
          error={throughput.isError}
          value={latest ? `${(latest.teu / 1_000_000).toFixed(2)}M` : undefined}
          hint={latest ? `Singapore · ${latest.year} · World Bank` : "World Bank IS.SHP.GOOD.TU"}
          delta={teuDelta != null ? { value: `${teuDelta >= 0 ? "+" : ""}${teuDelta.toFixed(1)}% YoY`, direction: teuDelta >= 0 ? "up" : "down" } : undefined}
          spark={validTeu.slice(-12).map((r) => r.teu)}
        />
      </div>

      {/* Map + Weather */}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Live map · AISStream.io</div>
              <div className="mt-1 text-[15px] font-medium">Singapore Strait &amp; PSA anchorages</div>
            </div>
            <StatusBadge tone={aisAvailable ? "cyan" : "muted"}>
              {aisAvailable ? `${vessels.length} vessels` : "AIS offline"}
            </StatusBadge>
          </div>
          <div className="relative">
            <MapboxMap markers={markers} className="w-full h-[440px]" />
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <MapLegend
                items={[
                  { color: "#64748b", label: "Moored (<0.5kn)" },
                  { color: "#f59e0b", label: "Anchored (0.5-3kn)" },
                  { color: "#22d3ee", label: "Underway (3-10kn)" },
                  { color: "#22c55e", label: "Fast (>10kn)" },
                ]}
              />
            </div>
          </div>
          {!aisAvailable && (
            <div className="p-4 border-t border-border/60">
              <NoDataCard
                title="AIS stream unavailable"
                reason={ais.data?.reason ?? "Data unavailable from public source. Configure AISSTREAM_API_KEY to enable live vessel tracking."}
              />
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan" />
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Marine weather</div>
          </div>
          {weather.isLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
            </div>
          ) : weather.isError || !weather.data ? (
            <div className="mt-4"><NoDataCard reason="Weather feed unavailable." /></div>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-semibold leading-none">{weather.data.temp_c.toFixed(1)}°C</div>
                <div className="text-[12px] text-muted-foreground">{weather.data.condition}</div>
              </div>
              <Row icon={Wind} k="Wind" v={`${weather.data.wind_speed_kn.toFixed(1)} kn · ${weather.data.wind_deg.toFixed(0)}°`} />
              <Row icon={Eye} k="Visibility" v={`${weather.data.visibility_km.toFixed(1)} km`} />
              <Row icon={Droplets} k="Humidity" v={`${weather.data.humidity.toFixed(0)}%`} />
              <Row icon={Gauge} k="Pressure" v={`${weather.data.pressure_hpa.toFixed(0)} hPa`} />
              <Row icon={Cloud} k="Precip" v={`${weather.data.precipitation_mm_h.toFixed(2)} mm/h`} />
              <div className="pt-2 mt-2 border-t border-border/60 text-[10.5px] font-mono text-muted-foreground uppercase tracking-widest">
                Source · {weather.data.source}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Throughput trend */}
      <GlassCard className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Historical throughput</div>
            <div className="mt-1 text-[15px] font-medium">Singapore container port traffic — TEU, annual</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="cyan">World Bank</StatusBadge>
            <ExportButton
              rows={validTeu}
              columns={["year", "teu"]}
              filename="psa-throughput-teu.csv"
              label="Export CSV"
            />
          </div>
        </div>
        {throughput.isLoading ? (
          <div className="skeleton h-40 w-full" />
        ) : throughput.isError || !validTeu.length ? (
          <NoDataCard reason="World Bank throughput series unavailable." />
        ) : (
          <ThroughputChart series={validTeu} />
        )}
      </GlassCard>

      {/* Vessel queue table */}
      <GlassCard className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Vessel queue</div>
            <div className="mt-1 text-[15px] font-medium">
              Live AIS positions
              <span className="ml-2 text-[12px] text-muted-foreground font-normal">
                {filtered.length.toLocaleString()} of {vessels.length.toLocaleString()}
              </span>
            </div>
          </div>
          <ExportButton rows={exportRows} filename="psa-vessels.csv" label="Export CSV" />
        </div>
        <Toolbar
          search={q}
          onSearch={setQ}
          placeholder="Search by vessel name or MMSI…"
        >
          <div className="flex items-center gap-1">
            {(["all", "moored", "anchored", "underway"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition capitalize ${
                  statusFilter === s
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-border/70 text-muted-foreground hover:bg-white/[0.04]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Toolbar>
        {ais.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-8 w-full" />)}
          </div>
        ) : !aisAvailable ? (
          <NoDataCard reason={ais.data?.reason ?? "AIS unavailable."} />
        ) : (
          <PaginatedVesselTable rows={filtered} />
        )}
      </GlassCard>

      {/* Operational panels without a public source render explicitly */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <GlassCard>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">Berth occupancy</div>
          <NoDataCard
            title="Berth occupancy feed offline"
            reason="Data unavailable from public source"
          />
        </GlassCard>
        <GlassCard>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">AI congestion prediction</div>
          <NoDataCard
            title="Congestion model offline"
            reason="Data unavailable from public source"
          />
        </GlassCard>
      </div>
    </div>
  );
}

function Row({ icon: Icon, k, v }: { icon: React.ComponentType<{ className?: string }>; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {k}
      </div>
      <div className="font-mono text-[12.5px]">{v}</div>
    </div>
  );
}

function ThroughputChart({ series }: { series: { year: number; teu: number }[] }) {
  const width = 720;
  const height = 180;
  const pad = { top: 12, right: 12, bottom: 24, left: 44 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const min = Math.min(...series.map((r) => r.teu));
  const max = Math.max(...series.map((r) => r.teu));
  const span = max - min || 1;
  const step = w / (series.length - 1 || 1);
  const pts = series.map((r, i) => [pad.left + i * step, pad.top + h - ((r.teu - min) / span) * h]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${pad.top + h} L ${pts[0][0]} ${pad.top + h} Z`;
  const yTicks = 4;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px]" role="img" aria-label="Throughput trend">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = pad.top + (h / yTicks) * i;
        const v = max - (span / yTicks) * i;
        return (
          <g key={i}>
            <line x1={pad.left} x2={pad.left + w} y1={y} y2={y} stroke="oklch(0.4 0.02 260)" strokeOpacity={0.25} />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="oklch(0.72 0.02 260)">
              {(v / 1_000_000).toFixed(1)}M
            </text>
          </g>
        );
      })}
      <path d={area} fill="oklch(0.82 0.16 210)" fillOpacity={0.12} />
      <path d={path} fill="none" stroke="oklch(0.82 0.16 210)" strokeWidth={1.5} />
      {[series[0], series[Math.floor(series.length / 2)], series[series.length - 1]].filter(Boolean).map((r, i) => (
        <text key={i} x={pad.left + (i * w) / 2} y={height - 6} fontSize="9" fill="oklch(0.72 0.02 260)" textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}>
          {r.year}
        </text>
      ))}
    </svg>
  );
}

function PaginatedVesselTable({ rows }: { rows: (AisVessel & { status: string; tone: "muted" | "warning" | "success" })[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = rows.slice(p * pageSize, (p + 1) * pageSize);
  return (
    <div>
      <DataTable
        columns={[
          { key: "name", label: "Vessel", render: (r) => <span className="font-medium">{r.name ?? <span className="text-muted-foreground">MMSI {r.mmsi}</span>}</span> },
          { key: "mmsi", label: "MMSI", render: (r) => <span className="font-mono text-[12px] text-muted-foreground">{r.mmsi}</span> },
          { key: "status", label: "Status", render: (r) => <StatusBadge tone={r.tone as any}>{r.status}</StatusBadge> },
          { key: "sog", label: "SOG", align: "right", render: (r) => <span className="font-mono">{(r.sog ?? 0).toFixed(1)} kn</span> },
          { key: "cog", label: "COG", align: "right", render: (r) => <span className="font-mono">{(r.cog ?? 0).toFixed(0)}°</span> },
          { key: "lat", label: "Lat", align: "right", render: (r) => <span className="font-mono text-[12px]">{r.lat.toFixed(3)}</span> },
          { key: "lon", label: "Lon", align: "right", render: (r) => <span className="font-mono text-[12px]">{r.lon.toFixed(3)}</span> },
        ]}
        rows={slice.map((r) => ({ ...r, id: r.mmsi }))}
        empty={<EmptyState />}
      />
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-[11.5px] text-muted-foreground">
          <div>Page {p + 1} of {pages}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((n) => Math.max(0, n - 1))}
              disabled={p === 0}
              className="px-2 py-1 rounded-md border border-border/70 hover:bg-white/[0.04] disabled:opacity-40 transition"
            >Prev</button>
            <button
              onClick={() => setPage((n) => Math.min(pages - 1, n + 1))}
              disabled={p >= pages - 1}
              className="px-2 py-1 rounded-md border border-border/70 hover:bg-white/[0.04] disabled:opacity-40 transition"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}