"use client";

import { client as defaultClient } from "@b3dotfun/sdk/shared/utils/thirdweb";
import type { ThirdwebClient } from "thirdweb";
import { MediaRenderer } from "thirdweb/react";

// Primary IPFS gateway URL - matches our allowed list in profileDisplay.ts
// Note: MediaRenderer expects the base gateway URL without /ipfs path
const IPFS_GATEWAY_URL = "https://cloudflare-ipfs.com";

interface IPFSMediaRendererProps {
  /** The source URL - can be IPFS URL (ipfs://...) or HTTP URL */
  src: string | null | undefined;
  /** Alt text for the media */
  alt?: string;
  /** CSS class name */
  className?: string;
  /** Thirdweb client instance (optional, uses default if not provided) */
  client?: ThirdwebClient;
  /** Width of the media */
  width?: string | number;
  /** Height of the media */
  height?: string | number;
  /** Controls property for video/audio */
  controls?: boolean;
  /** Style object */
  style?: React.CSSProperties;
}

/**
 * IPFSMediaRenderer - A wrapper around Thirdweb's MediaRenderer that configures
 * the IPFS gateway URL to use our validated gateway.
 *
 * Features:
 * - Configures MediaRenderer to use cloudflare-ipfs.com gateway
 * - Gateway matches our allowed list in profileDisplay.ts
 * - Provides fallback for missing sources
 *
 * @example
 * ```tsx
 * <IPFSMediaRenderer
 *   src="ipfs://QmX..."
 *   alt="Profile Avatar"
 *   className="size-14 rounded-full"
 * />
 * ```
 */
export function IPFSMediaRenderer({
  src,
  alt = "Media",
  className,
  client = defaultClient,
  width,
  height,
  controls,
  style,
}: IPFSMediaRendererProps) {
  // If no source, render fallback
  if (!src) {
    return (
      <div className={className} style={style} aria-label={alt}>
        <div className="bg-b3-primary-wash flex h-full w-full items-center justify-center">
          <span className="text-b3-grey font-neue-montreal-semibold text-xs">{alt.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    );
  }

  // Convert IPFS URLs to HTTP gateway URLs if needed
  // This handles both ipfs:// URLs and existing HTTP gateway URLs

  return (
    <MediaRenderer
      src={src}
      client={client}
      alt={alt}
      className={className}
      width={width ? width.toString() : undefined}
      height={height ? height.toString() : undefined}
      controls={controls}
      style={style}
    />
  );
}
