import { useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  parse: (value: string) => T = (value) => JSON.parse(value) as T,
) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? parse(stored) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
