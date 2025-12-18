"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { motion } from "motion/react";
import type { GasPriceData } from "../../../types/gas";

export interface GasIndicatorProps {
  gasPrice: GasPriceData;
  className?: string;
}

const LEVEL_LABELS: Record<GasPriceData["level"], string> = {
  low: "Low",
  normal: "Normal",
  elevated: "Elevated",
  high: "High",
  spike: "Spike",
};

const LEVEL_STYLES: Record<GasPriceData["level"], string> = {
  low: "bg-green-500/20 text-green-500",
  normal: "bg-as-surface-tertiary text-as-secondary",
  elevated: "bg-yellow-500/20 text-yellow-600",
  high: "bg-orange-500/20 text-orange-500",
  spike: "bg-red-500/20 text-red-500",
};

function formatGasPrice(gweiString: string): string {
  const gwei = parseFloat(gweiString);
  if (gwei < 0.001) return "<0.001";
  if (gwei < 1) return gwei.toFixed(3);
  if (gwei < 10) return gwei.toFixed(2);
  return gwei.toFixed(1);
}

export function GasIndicator({ gasPrice, className }: GasIndicatorProps) {
  // Only show when gas is high or spike
  if (!["high", "spike"].includes(gasPrice.level)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2",
        gasPrice.isSpike ? "bg-yellow-500/10" : "bg-as-surface-secondary",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-as-secondary text-xs">Gas on {gasPrice.chainName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", LEVEL_STYLES[gasPrice.level])}>
          {LEVEL_LABELS[gasPrice.level]}
        </span>
        <span className="text-as-primary text-xs font-medium">{formatGasPrice(gasPrice.gasPriceGwei)} Gwei</span>
      </div>
    </motion.div>
  );
}
