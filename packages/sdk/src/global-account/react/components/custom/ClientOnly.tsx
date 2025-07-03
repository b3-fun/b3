"use client";

import { useHasMounted } from "@b3dotfun/sdk/global-account/react";
import React from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const hasMounted = useHasMounted();

  // During SSR and initial client render, show fallback
  if (!hasMounted) {
    return fallback || null;
  }

  return children;
}
