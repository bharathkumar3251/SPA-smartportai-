import { useEffect } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Invalidate one or more query keys on an interval. Pauses while the tab is
 * hidden; resumes and immediately refetches on visibility change.
 */
export function useAutoRefresh(keys: QueryKey[], intervalMs = 30_000) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!intervalMs) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    const start = () => { if (!timer) timer = setInterval(tick, intervalMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => {
      if (document.visibilityState === "visible") { tick(); start(); } else stop();
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, JSON.stringify(keys)]);
}