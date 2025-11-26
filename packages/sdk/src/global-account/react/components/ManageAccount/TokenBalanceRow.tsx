import { Coins, Triangle } from "lucide-react";

interface TokenBalanceRowProps {
  tokenLogo: string;
  chainLogo: string;
  name: string;
  balance: string;
  usdValue: string;
  priceChange?: number | null;
}

export function TokenBalanceRow({ tokenLogo, chainLogo, name, balance, usdValue, priceChange }: TokenBalanceRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center">
          {/* Token logo */}
          {tokenLogo ? (
            <img src={tokenLogo} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200">
              <Coins className="h-5 w-5 text-gray-400" />
            </div>
          )}
          {/* Chain logo badge */}
          {chainLogo && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white">
              <img src={chainLogo} alt="chain" className="h-full w-full rounded-full object-cover" />
            </div>
          )}
        </div>
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
