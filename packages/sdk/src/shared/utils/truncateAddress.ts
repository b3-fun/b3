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
