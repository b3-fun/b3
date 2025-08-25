import { HelpCircle } from "lucide-react";

export function ChainTokenIcon({
  chainUrl,
  tokenUrl,
  className = "",
}: {
  chainUrl: string;
  tokenUrl?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {tokenUrl ? (
        <img src={tokenUrl} alt="Token" className="h-full w-full rounded-full" />
      ) : (
        <HelpCircle className="text-b3-react-foreground h-full w-full" />
      )}
      <div className="bg-as-on-surface-1 border-as-stroke absolute bottom-0 right-0 h-[45%] w-[45%] rounded border">
        <img src={chainUrl} alt="Chain" className="h-full w-full rounded" />
      </div>
    </div>
  );
}
