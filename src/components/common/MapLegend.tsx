export function MapLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/70 backdrop-blur px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: i.color, boxShadow: `0 0 8px ${i.color}` }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}