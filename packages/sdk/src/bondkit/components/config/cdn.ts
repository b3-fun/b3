/**
 * CDN Configuration
 * Configure your CDN URLs here
 */

export const CDN_CONFIG = {
  // Base CDN URL - will use your custom domain or R2 public URL
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.b3.fun",

  // TradingView charting library paths
  chartingLibrary: {
    basePath: "/static/charting_library",
    files: {
      main: "/charting_library.js",
      esm: "/charting_library.esm.js",
      cjs: "/charting_library.cjs.js",
      standalone: "/charting_library.standalone.js",
      types: "/charting_library.d.ts",
      bundles: "/bundles",
    },
  },

  // Datafeeds paths
  datafeeds: {
    basePath: "/static/datafeeds",
    udf: "/udf/src/udf-compatible-datafeed.js",
  },
} as const;

/**
 * Get full CDN URL for a resource
 */
export function getCDNUrl(path: string): string {
  return `${CDN_CONFIG.baseUrl}${path}`;
}

/**
 * Get TradingView library path for widget configuration
 */
export function getTradingViewLibraryPath(): string {
  return getCDNUrl(CDN_CONFIG.chartingLibrary.basePath + "/");
}

/**
 * Check if CDN is enabled (useful for development)
 */
export function isCDNEnabled(): boolean {
  return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_FORCE_CDN === "true";
}

/**
 * Check if we're using a custom CDN domain vs the default R2 URL
 */
export function isUsingCustomDomain(): boolean {
  return !!process.env.NEXT_PUBLIC_CDN_URL;
}

/**
 * Get library path - Always use CDN since static files are removed
 */
export function getLibraryPath(): string {
  return getTradingViewLibraryPath();
}
