/**
 * List of IPFS gateways to use for converting ipfs:// URLs to HTTP URLs
 * These gateways must match the allowed list in profileDisplay.ts validateImageUrl()
 */
const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs", // Primary gateway - fast and reliable
  "https://ipfs.io/ipfs", // Fallback gateway
  "https://gateway.pinata.cloud/ipfs", // Additional option
  "https://dweb.link/ipfs", // Additional option
  "https://nftstorage.link/ipfs", // Additional option
  "https://w3s.link/ipfs", // Additional option
] as const;

/**
 * Converts an IPFS URL to a gateway URL
 * @param ipfsUrl - URL in format ipfs://CID/path or just the CID
 * @param gatewayIndex - Optional index to specify which gateway to use (0: Cloudflare, 1: ipfs.io)
 * @returns HTTP URL using the specified IPFS gateway
 * @example
 * // returns 'https://cloudflare-ipfs.com/ipfs/QmUbJ4p.../2.png'
 * getIpfsUrl('ipfs://QmUbJ4pnHMNXGeWWhBFFSEqCGuc6cEtDyz35wQfv7k2TXy/2.png')
 * // returns 'https://ipfs.io/ipfs/QmUbJ4p.../2.png'
 * getIpfsUrl('ipfs://QmUbJ4pnHMNXGeWWhBFFSEqCGuc6cEtDyz35wQfv7k2TXy/2.png', 1)
 */
export function getIpfsUrl(ipfsUrl: string, gatewayIndex = 0): string {
  if (!ipfsUrl) return "";

  // If it's already an HTTP URL, return as is
  if (ipfsUrl.startsWith("http")) {
    return ipfsUrl;
  }

  // Remove ipfs:// prefix if present
  const path = ipfsUrl.replace("ipfs://", "");

  // Use specified gateway or fallback to first one
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];

  return `${gateway}/${path}`;
}
