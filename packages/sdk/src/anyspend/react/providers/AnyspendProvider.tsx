"use client";

import { TooltipProvider } from "@b3dotfun/sdk/global-account/react";
import { FingerprintJSPro, FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface AnyspendProviderProps {
  children: ReactNode;
  fingerprintApiKey?: string;
  fingerprintEndpoint?: string;
  fingerprintScriptUrlPattern?: string;
}

const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30000,
    },
  },
} as const;

/**
 * AnyspendProvider is a top-level provider that wraps your application to provide
 * query caching and state management for all Anyspend hooks.
 *
 * Features:
 * - Memoized QueryClient instance to prevent unnecessary re-renders
 * - Optimized for performance with React.memo
 * - Safe to use at the application root
 * - Configures sensible defaults for query caching
 * - Integrates FingerprintJS for order tracking (optional)
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnyspendProvider
 *       fingerprintApiKey={process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY}
 *       // Optional: Custom endpoint and script URL pattern
 *       fingerprintEndpoint="https://anyspend.com/vgLZDEEXL1BY56Wn/4d6axAdvhDmOUJkz"
 *       fingerprintScriptUrlPattern="https://anyspend.com/vgLZDEEXL1BY56Wn/br6Lx2MEGkgEHGiA"
 *     >
 *       <YourApp />
 *     </AnyspendProvider>
 *   );
 * }
 * ```
 */
export const AnyspendProvider = function AnyspendProvider({
  children,
  fingerprintApiKey,
  fingerprintEndpoint,
  fingerprintScriptUrlPattern,
}: AnyspendProviderProps) {
  const [queryClient] = useState(() => new QueryClient(defaultQueryClientConfig));

  // If no fingerprint API key is provided, skip the FingerprintJS provider
  if (!fingerprintApiKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FpjsProvider
        loadOptions={{
          apiKey: fingerprintApiKey,
          endpoint: fingerprintEndpoint ? [fingerprintEndpoint, FingerprintJSPro.defaultEndpoint] : undefined,
          scriptUrlPattern: fingerprintScriptUrlPattern
            ? [fingerprintScriptUrlPattern, FingerprintJSPro.defaultScriptUrlPattern]
            : undefined,
        }}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </FpjsProvider>
    </QueryClientProvider>
  );
};
