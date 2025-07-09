import { useEffect, useState } from "react";

/**
 * Framework-agnostic hook for reading URL search parameters
 * Works with Next.js, Vite, and other React applications
 */
export function useSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);

      // Listen for URL changes (for client-side routing)
      const handlePopState = () => {
        setSearchParams(new URLSearchParams(window.location.search));
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  return searchParams;
}

/**
 * Framework-agnostic navigation utility
 * Works with Next.js, Vite, and other React applications
 */
export function useRouter() {
  const push = (url: string) => {
    if (typeof window !== "undefined") {
      // For client-side routing frameworks, we should use history.pushState
      // This will work for most SPA frameworks
      window.history.pushState({}, "", url);

      // Dispatch a custom event that components can listen to
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return { push };
}

/**
 * Direct utility function for getting search params without a hook
 * Useful for server-side or one-time usage
 */
export function getSearchParams(): URLSearchParams | null {
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }
  return null;
}
