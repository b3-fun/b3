"use client";

import { createContext, useContext, ReactNode } from "react";

export interface FeatureFlags {
  showPoints?: boolean;
}

interface FeatureFlagsContextType {
  featureFlags: FeatureFlags;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  featureFlags?: FeatureFlags;
}

const defaultFeatureFlags: FeatureFlags = {
  showPoints: false,
};

export function FeatureFlagsProvider({ children, featureFlags = defaultFeatureFlags }: FeatureFlagsProviderProps) {
  return (
    <FeatureFlagsContext.Provider value={{ featureFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    return defaultFeatureFlags;
  }
  return context.featureFlags;
}