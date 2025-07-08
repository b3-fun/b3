export function formatUsername(username: string) {
  // Remove .b3.fun and put an @ before it
  // Make it all lowercase
  return `@${username.replace(".b3.fun", "").toLowerCase()}`;
}

/**
 * Helper functions for formatting data
 */

/**
 * Truncates a wallet address to show first 4 and last 4 characters
 * @param address Wallet address to truncate
 * @returns Truncated address in format "0x1234...5678"
 */
export const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 9) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export * from "./cn";
