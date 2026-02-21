"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface PoweredByBrandingProps {
  organizationName?: string;
  organizationLogo?: string;
  classes?: AnySpendCheckoutClasses;
}

export function PoweredByBranding({ organizationName, organizationLogo, classes }: PoweredByBrandingProps) {
  return (
    <div className={cn("flex items-center justify-between pt-4", classes?.poweredBy)}>
      {organizationLogo || organizationName ? (
        <div className="flex items-center gap-2">
          {organizationLogo && (
            <img src={organizationLogo} alt={organizationName || "Organization"} className="h-5 w-5 rounded-full" />
          )}
          {organizationName && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{organizationName}</span>
          )}
        </div>
      ) : (
        <div />
      )}
      <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        powered by{" "}
        <img
          src="https://cdn.b3.fun/anyspend-logo-brand.svg"
          alt="AnySpend"
          className="inline-block h-3.5 dark:hidden"
        />
        <img
          src="https://cdn.b3.fun/anyspend-logo-brand-dark.svg"
          alt="AnySpend"
          className="hidden h-3.5 dark:inline-block"
        />
      </span>
    </div>
  );
}
