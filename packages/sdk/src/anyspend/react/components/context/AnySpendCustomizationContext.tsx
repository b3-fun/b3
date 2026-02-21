"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AnySpendContent, AnySpendSlots, AnySpendTheme } from "../types/customization";

interface AnySpendCustomizationContextValue {
  slots: AnySpendSlots;
  content: AnySpendContent;
  theme: AnySpendTheme;
}

const AnySpendCustomizationContext = createContext<AnySpendCustomizationContextValue>({
  slots: {},
  content: {},
  theme: {},
});

/** Convert a hex color to HSL string (e.g. "210 50% 40%") */
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const CSS_VAR_MAP: Record<string, string> = {
  primary: "--as-primary",
  secondary: "--as-secondary",
  tertiary: "--as-tertiary",
  surfacePrimary: "--as-surface-primary",
  surfaceSecondary: "--as-surface-secondary",
  brand: "--as-brand",
  borderPrimary: "--as-border-primary",
  borderSecondary: "--as-border-secondary",
};

export interface AnySpendCustomizationProviderProps {
  slots?: AnySpendSlots;
  content?: AnySpendContent;
  theme?: AnySpendTheme;
  children: ReactNode;
}

export function AnySpendCustomizationProvider({
  slots,
  content,
  theme,
  children,
}: AnySpendCustomizationProviderProps) {
  const value = useMemo<AnySpendCustomizationContextValue>(
    () => ({
      slots: slots || {},
      content: content || {},
      theme: theme || {},
    }),
    [slots, content, theme],
  );

  const cssVarOverrides = useMemo(() => {
    const vars: Record<string, string> = {};

    // Convert brandColor hex → HSL → --as-brand
    if (theme?.brandColor) {
      const hsl = hexToHsl(theme.brandColor);
      if (hsl) vars["--as-brand"] = hsl;
    }

    // Apply explicit color overrides
    if (theme?.colors) {
      for (const [key, val] of Object.entries(theme.colors)) {
        const cssVar = CSS_VAR_MAP[key];
        if (cssVar && val) vars[cssVar] = val;
      }
    }

    return vars;
  }, [theme?.brandColor, theme?.colors]);

  const hasOverrides = Object.keys(cssVarOverrides).length > 0;

  return (
    <AnySpendCustomizationContext.Provider value={value}>
      {hasOverrides ? (
        <div style={cssVarOverrides as React.CSSProperties}>{children}</div>
      ) : (
        children
      )}
    </AnySpendCustomizationContext.Provider>
  );
}

export function useAnySpendCustomization(): AnySpendCustomizationContextValue {
  return useContext(AnySpendCustomizationContext);
}
