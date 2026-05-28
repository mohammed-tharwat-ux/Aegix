import { useCallback, useEffect, useRef, useState } from "react";

export function useApiResource<T>(
  loader: () => Promise<T>,
  options: { pollingMs?: number; enabled?: boolean } = {},
) {
  const { pollingMs, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await loaderRef.current();
      setData(result);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!pollingMs || !enabled) return undefined;
    const intervalId = window.setInterval(() => void refresh(), pollingMs);
    return () => window.clearInterval(intervalId);
  }, [enabled, pollingMs, refresh]);

  return { data, isLoading, error, refresh };
}

export const pollingIntervalMs = Number(import.meta.env.VITE_POLLING_INTERVAL_MS ?? 5000);
