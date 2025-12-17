import { useB3Config } from "./useB3Config";

/**
 * Hook to access the B3 configuration
 * @deprecated This is just an alias for useB3Config. Use useB3Config directly instead.
 */
export function useB3() {
  return useB3Config();
}
