export function ChainTokenIcon({
  chainUrl,
  tokenUrl,
  className = "",
}: {
  chainUrl: string;
  tokenUrl: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <img src={tokenUrl} alt="Token" className="h-full w-full rounded-full" />
      <div className="bg-as-on-surface-1 border-as-stroke absolute bottom-0 right-0 h-[45%] w-[45%] rounded border">
        <img src={chainUrl} alt="Chain" className="h-full w-full rounded" />
      </div>
    </div>
  );
}
