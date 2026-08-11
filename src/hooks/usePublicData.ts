import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getSingaporeWeather,
  getSingaporeContainerThroughput,
  getAisSnapshot,
  type WeatherSnapshot,
  type ThroughputPoint,
  type AisSnapshot,
} from "@/lib/public-data.functions";

export function useSingaporeWeather() {
  const fn = useServerFn(getSingaporeWeather);
  return useQuery<WeatherSnapshot>({
    queryKey: ["public", "weather", "singapore"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    retry: 0,
  });
}

export function useSingaporeThroughput() {
  const fn = useServerFn(getSingaporeContainerThroughput);
  return useQuery<ThroughputPoint[]>({
    queryKey: ["public", "throughput", "singapore"],
    queryFn: () => fn(),
    staleTime: 24 * 60 * 60_000,
    retry: 0,
  });
}

export function useAisSnapshot() {
  const fn = useServerFn(getAisSnapshot);
  return useQuery<AisSnapshot>({
    queryKey: ["public", "ais", "singapore"],
    queryFn: () => fn(),
    staleTime: 30_000,
    retry: 0,
  });
}