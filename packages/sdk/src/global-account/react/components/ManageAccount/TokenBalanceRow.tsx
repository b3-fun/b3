import { Triangle } from "lucide-react";
import { ReactNode } from "react";

interface TokenBalanceRowProps {
  icon: ReactNode;
  name: string;
  balance: string;
  usdValue: string;
  priceChange?: number | null;
}

export function TokenBalanceRow({ icon, name, balance, usdValue, priceChange }: TokenBalanceRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-b3-grey font-neue-montreal-semibold">{name}</span>
          </div>
          <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">{balance}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-b3-grey font-neue-montreal-semibold">${usdValue}</div>
        <div className="flex items-center gap-1">
          {priceChange !== null && priceChange !== undefined ? (
            <>
              <Triangle
                className={`size-3 ${priceChange >= 0 ? "text-b3-positive fill-b3-positive" : "text-b3-negative fill-b3-negative rotate-180"}`}
              />
              <span
                className={`font-neue-montreal-medium text-sm ${priceChange >= 0 ? "text-b3-positive" : "text-b3-negative"}`}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </span>
            </>
          ) : (
            <span className="text-b3-foreground-muted font-neue-montreal-medium text-sm">--</span>
          )}
        </div>
      </div>
    </div>
  );
}
