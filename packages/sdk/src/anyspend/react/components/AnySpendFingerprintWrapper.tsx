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
    return <>{children}</>;
  }

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: fingerprint.apiKey,
        endpoint: fingerprint.endpoint ? [fingerprint.endpoint, FingerprintJSPro.defaultEndpoint] : undefined,
        scriptUrlPattern: fingerprint.scriptUrlPattern
          ? [fingerprint.scriptUrlPattern, FingerprintJSPro.defaultScriptUrlPattern]
          : undefined,
      }}
    >
      {children}
    </FpjsProvider>
  );
}

// Helper function to get fingerprint config from environment or context
export function getFingerprintConfig(): FingerprintConfig | undefined {
  const apiKey =
    typeof window !== "undefined"
      ? (window as any).NEXT_PUBLIC_FINGERPRINT_API_KEY || process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY
      : process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  return {
    apiKey,
    endpoint:
      typeof window !== "undefined"
        ? (window as any).NEXT_PUBLIC_FINGERPRINT_ENDPOINT || process.env.NEXT_PUBLIC_FINGERPRINT_ENDPOINT
        : process.env.NEXT_PUBLIC_FINGERPRINT_ENDPOINT,
    scriptUrlPattern:
      typeof window !== "undefined"
        ? (window as any).NEXT_PUBLIC_FINGERPRINT_SCRIPT_URL || process.env.NEXT_PUBLIC_FINGERPRINT_SCRIPT_URL
        : process.env.NEXT_PUBLIC_FINGERPRINT_SCRIPT_URL,
  };
}
