"use client";

import { useCallback, useEffect, useState } from "react";

export function useSearchParamsSSR() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  });

  // Use callback to read from window to avoid Suspense
  const updateSearchParams = useCallback(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  useEffect(() => {
    updateSearchParams();

    // Optional: Update on popstate
    window.addEventListener("popstate", updateSearchParams);
    return () => window.removeEventListener("popstate", updateSearchParams);
  }, [updateSearchParams]);

  return searchParams;
}

export function useSearchParam(param: string): string | null {
  const searchParams = useSearchParamsSSR();
  return searchParams.get(param);
}
