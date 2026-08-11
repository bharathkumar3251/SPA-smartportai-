import { STAGE_FLOW, STAGE_META, type ContainerRow, type Stage, type Submission } from "@/lib/workflow";

/** Count occurrences of a derived key. */
export function countBy<T>(rows: T[], key: (row: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function stageCounts(subs: Submission[]): Record<string, number> {
  return countBy(subs, (s) => s.stage);
}

/** Number of submissions currently sitting in any of the given stages. */
export function inStages(subs: Submission[], stages: Stage[]): Submission[] {
  return subs.filter((s) => stages.includes(s.stage));
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Records per day for the trailing `days` window — empty array when there are no records. */
export function dailySeries<T extends { created_at: string }>(
  rows: T[],
  days = 14,
  label = "count",
): Record<string, string | number>[] {
  if (rows.length === 0) return [];
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(dayKey(d), 0);
  }
  for (const r of rows) {
    const k = dayKey(new Date(r.created_at));
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([k, v]) => ({
    x: new Date(k).toLocaleDateString("en", { day: "2-digit", month: "short" }),
    [label]: v,
  }));
}

/** Two-series daily split (e.g. cleared vs held) driven by a predicate. */
export function dailySplit<T extends { created_at: string }>(
  rows: T[],
  days: number,
  a: { label: string; match: (r: T) => boolean },
  b: { label: string; match: (r: T) => boolean },
): Record<string, string | number>[] {
  if (rows.length === 0) return [];
  const base = dailySeries(rows, days, "total");
  const aa = dailySeries(rows.filter(a.match), days, a.label);
  const bb = dailySeries(rows.filter(b.match), days, b.label);
  return base.map((row, i) => ({
    x: row['x'] as string,
    [a.label]: (aa[i]?.[a.label] as number) ?? 0,
    [b.label]: (bb[i]?.[b.label] as number) ?? 0,
  }));
}

/** Records per calendar month for the trailing `months` window. */
export function monthlySeries<T extends { created_at: string }>(
  rows: T[],
  months = 6,
  label = "count",
): Record<string, string | number>[] {
  if (rows.length === 0) return [];
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const r of rows) {
    const d = new Date(r.created_at);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([k, v]) => ({
    x: new Date(`${k}-01`).toLocaleDateString("en", { month: "short", year: "2-digit" }),
    [label]: v,
  }));
}

/** Distribution across the canonical pipeline, only including stages that have records. */
export function stageDistribution(subs: Submission[]): { name: string; value: number; color: string }[] {
  const palette = [
    "oklch(0.82 0.16 210)", "oklch(0.68 0.22 300)", "oklch(0.78 0.16 160)",
    "oklch(0.82 0.16 80)", "oklch(0.68 0.24 25)",
  ];
  const counts = stageCounts(subs);
  return Object.entries(counts)
    .sort((a, b) => STAGE_FLOW.indexOf(a[0] as Stage) - STAGE_FLOW.indexOf(b[0] as Stage))
    .map(([stage, value], i) => ({
      name: STAGE_META[stage as Stage]?.label ?? stage,
      value,
      color: palette[i % palette.length],
    }));
}

export function containerStageBars(rows: ContainerRow[]): Record<string, string | number>[] {
  if (rows.length === 0) return [];
  const counts = countBy(rows, (r) => r.stage);
  return Object.entries(counts).map(([k, v]) => ({ x: k.replace(/_/g, " "), containers: v }));
}

/** Average hours between the first and last workflow event of each submission. */
export function averageHours(pairs: { from: string; to: string }[]): number | null {
  if (pairs.length === 0) return null;
  const total = pairs.reduce((sum, p) => sum + (new Date(p.to).getTime() - new Date(p.from).getTime()), 0);
  return total / pairs.length / 3_600_000;
}

export const isToday = (iso: string | null | undefined) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();
