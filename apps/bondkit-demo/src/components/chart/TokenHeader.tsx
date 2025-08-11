import { TokenInfo } from '@/types/chart';
import { formatPrice } from '@/utils/chartData';
import { cn } from '@/utils/cn';

interface TokenHeaderProps {
  tokenInfo: TokenInfo;
  className?: string;
}

export function TokenHeader({ tokenInfo, className }: TokenHeaderProps) {
  const { name, symbol, currentPrice, change24h, volume24h } = tokenInfo;
  const isPositive = change24h >= 0;

  return (
    <div className={cn("p-6 bg-gray-800 rounded-lg border border-gray-700", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              {symbol}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-3xl font-mono font-bold text-white">
              ${formatPrice(currentPrice)}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
                isPositive
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              )}
            >
              {isPositive ? '↗' : '↘'}
              {isPositive ? '+' : ''}
              {change24h.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-sm text-gray-400">24h Volume</p>
            <div className="flex items-center gap-1 text-lg font-semibold text-white">
              {volume24h.toLocaleString('en-US', {
                notation: 'compact',
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          
          <div className="w-px h-12 bg-gray-600" />
          
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <div className="flex items-center gap-2 text-lg font-semibold text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 