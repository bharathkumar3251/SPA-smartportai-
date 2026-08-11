import type { ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { GlassCard } from "@/components/common/GlassCard";

export const C = {
  cyan: "oklch(0.82 0.16 210)",
  violet: "oklch(0.68 0.22 300)",
  success: "oklch(0.78 0.16 160)",
  warning: "oklch(0.82 0.16 80)",
  danger: "oklch(0.68 0.24 25)",
  grid: "oklch(1 0 0 / 8%)",
  axis: "oklch(0.72 0.03 255)",
};

export function ChartCard({
  title, subtitle, actions, children, className, height = 260,
}: {
  title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string; height?: number;
}) {
  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{title}</div>
          {subtitle && <div className="text-[12px] text-muted-foreground/80 mt-1 truncate">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </GlassCard>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.18 0.045 262)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "oklch(0.72 0.03 255)", fontSize: 11 },
} as const;

type Datum = Record<string, string | number>;

export function AreaTrend({
  data, series, height,
}: { data: Datum[]; series: { key: string; label: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? "100%"}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="x" tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} interval="preserveStartEnd" />
        <YAxis tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
        <Tooltip {...tooltipStyle} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
            fill={`url(#grad-${s.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data, series, vertical,
}: { data: Datum[]; series: { key: string; label: string; color: string }[]; vertical?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 4, right: 8, left: vertical ? 40 : -18, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        {vertical ? (
          <>
            <XAxis type="number" tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
            <YAxis type="category" dataKey="x" tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey="x" tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
            <YAxis tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
          </>
        )}
        <Tooltip {...tooltipStyle} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={26} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data, series,
}: { data: Datum[]; series: { key: string; label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="x" tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
        <YAxis tick={{ fill: C.axis, fontSize: 10 }} stroke={C.grid} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: C.axis }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
            dot={false} strokeDasharray={s.dashed ? "5 4" : undefined} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="none">
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: C.axis }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RadarPanel({ data }: { data: { k: string; v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={C.grid} />
        <PolarAngleAxis dataKey="k" tick={{ fill: C.axis, fontSize: 10 }} />
        <Radar dataKey="v" stroke={C.cyan} fill={C.violet} fillOpacity={0.28} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Simple labelled utilization bars — used for cranes, storage, fleet health. */
export function MeterList({
  items,
}: { items: { label: string; value: number; hint?: string; tone?: "cyan" | "violet" | "success" | "warning" | "danger" }[] }) {
  const tone = { cyan: "from-cyan to-violet", violet: "from-violet to-cyan", success: "from-success to-cyan", warning: "from-warning to-danger", danger: "from-danger to-warning" };
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="truncate">{it.label}</span>
            <span className="text-muted-foreground font-mono text-[11px]">{it.hint ?? `${it.value}%`}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${tone[it.tone ?? "cyan"]}`} style={{ width: `${Math.min(100, it.value)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}