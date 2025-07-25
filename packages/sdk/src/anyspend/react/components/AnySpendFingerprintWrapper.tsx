import { FingerprintJSPro, FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";
import { ReactNode } from "react";

interface FingerprintConfig {
  apiKey: string;
  endpoint?: string;
  scriptUrlPattern?: string;
}

interface AnySpendFingerprintWrapperProps {
  children: ReactNode;
  fingerprint?: FingerprintConfig;
}

/**
 * Internal wrapper that only initializes FingerprintJS when AnySpend components are actually used.
 * This prevents unnecessary fingerprinting of users who don't interact with AnySpend.
 */
export function AnySpendFingerprintWrapper({ children, fingerprint }: AnySpendFingerprintWrapperProps) {
  // If no fingerprint config is provided, render children without fingerprinting
  if (!fingerprint?.apiKey) {
    console.warn("No Fingerprint API key provided. Fingerprinting will be disabled.");
    return <>{children}</>;
  }

  // Ensure endpoint has https:// prefix
  const endpoint =
    fingerprint.endpoint && !fingerprint.endpoint.startsWith("http")
      ? `https://${fingerprint.endpoint}`
      : fingerprint.endpoint;

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: fingerprint.apiKey,
        endpoint: endpoint ? [endpoint, FingerprintJSPro.defaultEndpoint] : undefined,
        scriptUrlPattern: fingerprint.scriptUrlPattern
          ? [fingerprint.scriptUrlPattern, FingerprintJSPro.defaultScriptUrlPattern]
          : undefined,
      }}
    >
      {children}
    </FpjsProvider>
  );
}

// Helper function to get fingerprint config from environment variables
export function getFingerprintConfig(): FingerprintConfig | undefined {
  const apiKey = process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  return {
    apiKey,
    endpoint: process.env.NEXT_PUBLIC_FINGERPRINT_ENDPOINT,
    scriptUrlPattern: process.env.NEXT_PUBLIC_FINGERPRINT_SCRIPT_URL,
  };
}
