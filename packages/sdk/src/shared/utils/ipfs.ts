/**
 * List of IPFS gateways to use for converting ipfs:// URLs to HTTP URLs
 * These gateways must match the allowed list in profileDisplay.ts validateImageUrl()
 */
const IPFS_GATEWAYS = [
  "https://dweb.link/ipfs", // Primary gateway - Protocol Labs maintained
  "https://w3s.link/ipfs", // web3.storage gateway - reliable
  "https://nftstorage.link/ipfs", // NFT.storage gateway
  "https://gateway.pinata.cloud/ipfs", // Pinata gateway
  "https://ipfs.io/ipfs", // Fallback gateway
  "https://cloudflare-ipfs.com/ipfs", // Cloudflare gateway (can be slow/unreliable)
] as const;

/**
 * Converts an IPFS URL to a gateway URL
 * @param ipfsUrl - URL in format ipfs://CID/path or just the CID
 * @param gatewayIndex - Optional index to specify which gateway to use (0: dweb.link, 1: w3s.link, etc.)
 * @returns HTTP URL using the specified IPFS gateway
 * @example
 * // returns 'https://dweb.link/ipfs/QmUbJ4p.../2.png'
 * getIpfsUrl('ipfs://QmUbJ4pnHMNXGeWWhBFFSEqCGuc6cEtDyz35wQfv7k2TXy/2.png')
 * // returns 'https://w3s.link/ipfs/QmUbJ4p.../2.png'
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
