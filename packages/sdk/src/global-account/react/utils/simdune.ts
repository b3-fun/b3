export const SIMDUNE_API_HOST = "https://simdune-api.sean-430.workers.dev";

/**
 * Builds a Simdune API URL with the proxy wrapper and optional dev mode key.
 * @param endpoint - The Simdune API endpoint (e.g., "/v1/evm/balances/0x...")
 * @param queryParams - Optional URLSearchParams to append
 */
export function buildSimduneUrl(endpoint: string, queryParams?: URLSearchParams): string {
  const baseUrl = `${SIMDUNE_API_HOST}/?url=https://api.sim.dune.com${endpoint}`;

  let url = baseUrl;
  if (queryParams && queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  if (process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET) {
    url += `${queryParams?.toString() ? "&" : "?"}localkey=${process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET}`;
  }

  return url;
}
