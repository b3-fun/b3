"use client";

import { TooltipProvider } from "@b3dotfun/sdk/global-account/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { FeatureFlags, FeatureFlagsProvider } from "../contexts/FeatureFlagsContext";
import { StripeRedirectHandler } from "./StripeRedirectHandler";

interface AnyspendProviderProps {
  children: ReactNode;
  featureFlags?: FeatureFlags;
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
 * - Handles Stripe payment redirects and modal state
 * - Provides feature flags configuration
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnyspendProvider featureFlags={{ showPoints: true }}>
 *       <YourApp />
 *     </AnyspendProvider>
 *   );
 * }
 * ```
 */
export const AnyspendProvider = function AnyspendProvider({ children, featureFlags }: AnyspendProviderProps) {
  const [queryClient] = useState(() => new QueryClient(defaultQueryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider featureFlags={featureFlags}>
        <TooltipProvider>
          <StripeRedirectHandler />
          {children}
        </TooltipProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
};
