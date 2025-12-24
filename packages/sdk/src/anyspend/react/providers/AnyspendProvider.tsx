"use client";

import { ReactNode } from "react";
import { FeatureFlags, FeatureFlagsProvider } from "../contexts/FeatureFlagsContext";
import { StripeRedirectHandler } from "./StripeRedirectHandler";

interface AnyspendProviderProps {
  children: ReactNode;
  featureFlags?: FeatureFlags;
}

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
  return (
    <FeatureFlagsProvider featureFlags={featureFlags}>
      <StripeRedirectHandler />
      {children}
    </FeatureFlagsProvider>
  );
};
