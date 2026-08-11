import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getJSON, toApiError, type ApiError } from "@/lib/api";

export function useApiQuery<T>(
  key: (string | number | undefined)[],
  path: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: async () => {
      try { return await getJSON<T>(path, params); }
      catch (err) { throw toApiError(err); }
    },
    retry: 0,
    staleTime: 30_000,
    ...options,
  });
}