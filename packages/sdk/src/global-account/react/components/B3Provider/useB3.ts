import { useContext, useMemo } from "react";

import { B3Context } from "./types";

/**
 * Hook to access the B3 context
 * @throws Error if used outside a B3Provider
 */
export function useB3() {
  const context = useContext(B3Context);

  if (!context.initialized) {
    throw new Error("useB3 must be used within a B3Provider");
  }

  // Return a stable reference
  return useMemo(() => context, [context]);
}
