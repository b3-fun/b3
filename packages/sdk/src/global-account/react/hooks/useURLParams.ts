import { useSearchParamsSSR } from "@b3dotfun/sdk/global-account/react";
import { useCallback } from "react";

interface UpdateURLParamsOptions {
  preserveParams?: string[];
}

export function useURLParams() {
  const searchParams = useSearchParamsSSR();

  const updateURLParams = useCallback(
    (updates: Record<string, string | null>, options: UpdateURLParamsOptions = {}) => {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      // Preserve specified params
      if (options.preserveParams) {
        options.preserveParams.forEach(param => {
          const value = searchParams.get(param);
          if (value) params.set(param, value);
        });
      }

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      url.search = params.toString();
      window.history.pushState({}, "", url.toString());
    },
    [searchParams],
  );

  return {
    searchParams,
    updateURLParams,
  };
}
