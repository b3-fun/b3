// We intentionally disable the hooks rules here because we need to conditionally return early for SSR.
// This is safe in this context because the hook is only used in environments where window is defined.
/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useState } from "react";

interface RouterState {
  pathname: string;
  search: string;
  hash: string;
}

interface UseRouterReturn {
  pathname: string;
  search: string;
  hash: string;
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
}

/**
 * A router hook that works with both client-side and server-side rendering
 */
export function useRouter(): UseRouterReturn {
  // For SSR, return dummy implementation
  if (typeof window === "undefined") {
    return {
      pathname: "",
      search: "",
      hash: "",
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
    };
  }

  // Initialize state with current location
  const [routerState, setRouterState] = useState<RouterState>(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  }));

  // Update state when location changes
  useEffect(() => {
    const handleLocationChange = () => {
      setRouterState({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };

    // Listen for popstate event (browser back/forward)
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  // Navigation methods
  const push = useCallback((url: string) => {
    window.history.pushState({}, "", url);
    // Manually trigger state update since pushState doesn't fire popstate
    setRouterState({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    });
  }, []);

  const replace = useCallback((url: string) => {
    window.history.replaceState({}, "", url);
    // Manually trigger state update
    setRouterState({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    });
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const forward = useCallback(() => {
    window.history.forward();
  }, []);

  return {
    ...routerState,
    push,
    replace,
    back,
    forward,
  };
}

export default useRouter;
