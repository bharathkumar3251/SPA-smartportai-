import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search…",
  right,
  children,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {onSearch && (
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-card/40 border border-border/70 text-[12.5px] outline-none focus:border-cyan/50 transition"
          />
        </div>
      )}
      {children}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  );
}