type Tone = "cyan" | "violet" | "success" | "warning" | "danger" | "muted";

const TONE_STROKE: Record<Tone, string> = {
  cyan: "oklch(0.82 0.16 210)",
  violet: "oklch(0.72 0.18 300)",
  success: "oklch(0.78 0.16 155)",
  warning: "oklch(0.82 0.16 75)",
  danger: "oklch(0.72 0.19 25)",
  muted: "oklch(0.7 0.02 260)",
};

export function MiniSparkline({
  values,
  tone = "cyan",
  width = 120,
  height = 28,
  strokeWidth = 1.5,
  fill = true,
}: {
  values: number[];
  tone?: Tone;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
}) {
  if (!values.length) return null;
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const step = width / (clean.length - 1);
  const pts = clean.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`);
  const stroke = TONE_STROKE[tone];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" aria-hidden>
      {fill && (
        <polygon
          points={`0,${height} ${pts.join(" ")} ${width},${height}`}
          fill={stroke}
          opacity={0.14}
        />
      )}
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
