"use client";

import { cn } from "@b3dotfun/sdk/shared/utils";
import { Button } from "../../../global-account/react/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../global-account/react/components/ui/dropdown-menu";
import { CURRENCY_NAMES, CURRENCY_SYMBOLS, SupportedCurrency, useCurrencyStore } from "../stores/currencyStore";

const currencies: SupportedCurrency[] = ["B3", "ETH", "SOL", "USD", "EUR", "GBP", "KRW", "JPY", "CAD", "AUD"];

interface CurrencySelectorProps {
  labelClassName?: string;
  buttonVariant?: "dark" | "primary" | "ghost" | "gold";
  label?: string;
}

export function CurrencySelector({ labelClassName, buttonVariant = "dark", label }: CurrencySelectorProps) {
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3">
            {label && (
              <span
                className={cn(
                  "text-foreground text-sm font-medium leading-none tracking-tight sm:text-base",
                  labelClassName,
                )}
              >
                {label}
              </span>
            )}
            <Button variant={buttonVariant as any} className="flex items-center gap-2">
              <span className="text-sm font-medium">{CURRENCY_NAMES[selectedCurrency]}</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] min-w-[200px]">
          {currencies.map(currency => (
            <div key={currency}>
              <DropdownMenuItem
                onClick={() => setSelectedCurrency(currency)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition-colors ${
                  selectedCurrency === currency ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <span className="text-foreground text-sm font-medium">{CURRENCY_NAMES[currency]}</span>
                <span className="text-muted-foreground text-xs font-medium">{CURRENCY_SYMBOLS[currency]}</span>
              </DropdownMenuItem>
              {currency === "SOL" && <DropdownMenuSeparator key="separator" className="bg-border my-1" />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
