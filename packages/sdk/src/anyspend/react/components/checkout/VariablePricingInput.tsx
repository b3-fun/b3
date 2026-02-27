"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface VariablePricingConfig {
  enabled: boolean;
  minAmount?: string;
  maxAmount?: string;
  suggestedAmount?: string;
  label?: string;
  currency?: string;
}

interface VariablePricingInputProps {
  config: VariablePricingConfig;
  tokenDecimals: number;
  tokenSymbol: string;
  themeColor?: string;
  onChange: (amountWei: string) => void;
}

export function VariablePricingInput({
  config,
  tokenDecimals,
  tokenSymbol,
  themeColor,
  onChange,
}: VariablePricingInputProps) {
  const currency = config.currency || tokenSymbol;

  // Convert suggested amount from wei to display
  const initialValue = useMemo(() => {
    if (config.suggestedAmount) {
      try {
        return formatUnits(config.suggestedAmount, tokenDecimals);
      } catch {
        return "";
      }
    }
    return "";
  }, [config.suggestedAmount, tokenDecimals]);

  const [displayValue, setDisplayValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Min/max in display units
  const minDisplay = useMemo(() => {
    if (!config.minAmount) return null;
    try {
      return parseFloat(formatUnits(config.minAmount, tokenDecimals));
    } catch {
      return null;
    }
  }, [config.minAmount, tokenDecimals]);

  const maxDisplay = useMemo(() => {
    if (!config.maxAmount) return null;
    try {
      return parseFloat(formatUnits(config.maxAmount, tokenDecimals));
    } catch {
      return null;
    }
  }, [config.maxAmount, tokenDecimals]);

  // Preset amounts
  const presetAmounts = useMemo(() => {
    const presets: { label: string; value: string }[] = [];

    if (config.suggestedAmount) {
      try {
        const suggested = parseFloat(formatUnits(config.suggestedAmount, tokenDecimals));
        const candidates = [suggested / 2, suggested, suggested * 2];

        for (const val of candidates) {
          if (val <= 0) continue;
          if (minDisplay !== null && val < minDisplay) continue;
          if (maxDisplay !== null && val > maxDisplay) continue;
          const display = val % 1 === 0 ? val.toString() : val.toFixed(2);
          presets.push({ label: `${display}`, value: display });
        }
      } catch {
        // skip presets
      }
    }
    return presets;
  }, [config.suggestedAmount, tokenDecimals, minDisplay, maxDisplay]);

  const validate = useCallback(
    (value: string): string | null => {
      if (!value || parseFloat(value) <= 0) return "Please enter an amount";
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return "Please enter a valid number";
      if (minDisplay !== null && parsed < minDisplay) {
        const display = minDisplay % 1 === 0 ? minDisplay.toString() : minDisplay.toFixed(2);
        return `Minimum amount is ${display} ${currency}`;
      }
      if (maxDisplay !== null && parsed > maxDisplay) {
        const display = maxDisplay % 1 === 0 ? maxDisplay.toString() : maxDisplay.toFixed(2);
        return `Maximum amount is ${display} ${currency}`;
      }
      return null;
    },
    [minDisplay, maxDisplay, currency],
  );

  const convertToWei = useCallback(
    (value: string): string => {
      try {
        const [whole, frac = ""] = value.split(".");
        const paddedFrac = frac.padEnd(tokenDecimals, "0").slice(0, tokenDecimals);
        const factor = BigInt(10) ** BigInt(tokenDecimals);
        return (BigInt(whole || "0") * factor + BigInt(paddedFrac)).toString();
      } catch {
        return "0";
      }
    },
    [tokenDecimals],
  );

  const handleChange = useCallback(
    (value: string) => {
      setDisplayValue(value);
      const validationError = validate(value);
      setError(validationError);

      if (!validationError && value && parseFloat(value) > 0) {
        onChange(convertToWei(value));
      } else {
        onChange("0");
      }
    },
    [validate, convertToWei, onChange],
  );

  const handlePresetClick = useCallback(
    (value: string) => {
      setDisplayValue(value);
      setError(null);
      onChange(convertToWei(value));
    },
    [convertToWei, onChange],
  );

  // Notify parent with initial value on mount
  useEffect(() => {
    if (initialValue && !validate(initialValue)) {
      onChange(convertToWei(initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatHint = () => {
    if (minDisplay !== null && maxDisplay !== null) {
      const minStr = minDisplay % 1 === 0 ? minDisplay.toString() : minDisplay.toFixed(2);
      const maxStr = maxDisplay % 1 === 0 ? maxDisplay.toString() : maxDisplay.toFixed(2);
      return `${minStr} – ${maxStr} ${currency}`;
    }
    if (minDisplay !== null) {
      const minStr = minDisplay % 1 === 0 ? minDisplay.toString() : minDisplay.toFixed(2);
      return `Min: ${minStr} ${currency}`;
    }
    if (maxDisplay !== null) {
      const maxStr = maxDisplay % 1 === 0 ? maxDisplay.toString() : maxDisplay.toFixed(2);
      return `Max: ${maxStr} ${currency}`;
    }
    return null;
  };

  const hint = formatHint();

  return (
    <div className="anyspend-variable-pricing mb-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{config.label || "Enter amount"}</h2>

      {/* Preset buttons */}
      {presetAmounts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {presetAmounts.map(preset => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                displayValue === preset.value
                  ? "border-transparent text-white"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800",
              )}
              style={
                displayValue === preset.value ? { backgroundColor: themeColor || "hsl(var(--as-brand))" } : undefined
              }
            >
              {preset.label} {currency}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="number"
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-16 text-lg font-semibold text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-400"
          placeholder="0.00"
          step={(1 / Math.pow(10, Math.min(tokenDecimals, 8))).toFixed(Math.min(tokenDecimals, 8))}
          min="0"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500">
          {currency}
        </span>
      </div>

      {/* Hint */}
      {hint && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}

      {/* Error */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="variable-price-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mt-1.5 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
