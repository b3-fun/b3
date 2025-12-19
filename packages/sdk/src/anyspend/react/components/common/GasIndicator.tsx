"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { motion } from "motion/react";
import type { GasPriceData } from "../../../types/gas";

export interface GasIndicatorProps {
  gasPrice: GasPriceData;
  className?: string;
}

function formatGwei(gweiString: string): string {
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
      className={cn("flex flex-col gap-1 rounded-lg bg-orange-500/10 px-3 py-2", className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-orange-500">Gas is high - transaction may fail or cost more</span>
        <span className="text-xs font-medium text-orange-500">{formatGwei(gasPrice.gasPriceGwei)} Gwei</span>
      </div>
      <span className="text-as-secondary text-xs">Consider swapping later for better rates</span>
    </motion.div>
  );
}
