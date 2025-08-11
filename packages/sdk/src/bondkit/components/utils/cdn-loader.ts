/**
 * Dynamic CDN Resource Loader
 * Utilities for loading resources from CDN at runtime
 */

import { getCDNUrl } from "../config/cdn";

/**
 * Dynamically load a script from CDN
 */
export async function loadScriptFromCDN(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = getCDNUrl(path);
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${script.src}`));

    document.head.appendChild(script);
  });
}

/**
 * Dynamically load CSS from CDN
 */
export async function loadStyleFromCDN(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = getCDNUrl(path);
    link.crossOrigin = "anonymous";

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${link.href}`));

    document.head.appendChild(link);
  });
}

/**
 * Preload resource from CDN
 */
export function preloadFromCDN(path: string, as: "script" | "style" | "font" | "image" = "script"): void {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = getCDNUrl(path);
  link.as = as;
  link.crossOrigin = "anonymous";

  document.head.appendChild(link);
}

/**
 * Check if a CDN resource is available
 */
export async function checkCDNResource(path: string): Promise<boolean> {
  try {
    const response = await fetch(getCDNUrl(path), { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Load TradingView library dynamically
 */
export async function loadTradingViewLibrary(): Promise<any> {
  // Always load from CDN now that local files are removed
  await loadScriptFromCDN("/static/charting_library/charting_library.js");

  // Return the global TradingView object
  return (window as any).TradingView;
}
