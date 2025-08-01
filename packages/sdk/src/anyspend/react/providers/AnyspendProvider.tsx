"use client";

import { TooltipProvider } from "@b3dotfun/sdk/global-account/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { StripeRedirectHandler } from "./StripeRedirectHandler";
import { RelayKitProviderWrapper } from "./RelayKitProviderWrapper";

interface AnyspendProviderProps {
  children: ReactNode;
  simDuneApiKey?: string;
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
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnyspendProvider>
 *       <YourApp />
 *     </AnyspendProvider>
 *   );
 * }
 * ```
 */
export const AnyspendProvider = function AnyspendProvider({ children, simDuneApiKey }: AnyspendProviderProps) {
  const [queryClient] = useState(() => new QueryClient(defaultQueryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      <RelayKitProviderWrapper isMainnet={true} simDuneApiKey={simDuneApiKey}>
        <TooltipProvider>
          <StripeRedirectHandler />
          {children}
        </TooltipProvider>
      </RelayKitProviderWrapper>
    </QueryClientProvider>
  );
};
