import { TokenInfo } from "@/types/chart";
import { formatPrice } from "@/utils/chartData";
import { cn } from "@/utils/cn";

interface TokenHeaderProps {
  tokenInfo: TokenInfo;
  className?: string;
}

export function TokenHeader({ tokenInfo, className }: TokenHeaderProps) {
  const { name, symbol, currentPrice, change24h, volume24h } = tokenInfo;
  const isPositive = change24h >= 0;

  return (
    <div className={cn("rounded-lg border border-gray-700 bg-gray-800 p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-b3-react-foreground text-2xl font-bold">{name}</h1>
            <p className="text-sm uppercase tracking-wide text-gray-400">{symbol}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-b3-react-foreground font-mono text-3xl font-bold">${formatPrice(currentPrice)}</div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium",
                isPositive ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400",
              )}
            >
              {isPositive ? "↗" : "↘"}
              {isPositive ? "+" : ""}
              {change24h.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-sm text-gray-400">24h Volume</p>
            <div className="text-b3-react-foreground flex items-center gap-1 text-lg font-semibold">
              {volume24h.toLocaleString("en-US", {
                notation: "compact",
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="h-12 w-px bg-gray-600" />

          <div>
            <p className="text-sm text-gray-400">Status</p>
            <div className="flex items-center gap-2 text-lg font-semibold text-green-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Live
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
