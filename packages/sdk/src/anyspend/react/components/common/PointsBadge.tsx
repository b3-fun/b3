interface PointsBadgeProps {
  pointsAmount: number;
  pointsMultiplier?: number;
  onClick?: () => void;
}

export function PointsBadge({ pointsAmount, pointsMultiplier, onClick }: PointsBadgeProps) {
  return (
    <button
      className="bg-as-brand hover:scale-102 active:scale-98 relative flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 transition-all"
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 h-full w-full rounded-lg border border-white/10 border-t-white/20 bg-gradient-to-b from-white/10 to-white/0" />
      <span className="relative text-xs text-white">
        +{pointsAmount.toLocaleString()} pts
        {pointsMultiplier && pointsMultiplier > 1 && <span className="ml-1 opacity-80">({pointsMultiplier}x)</span>}
      </span>
    </button>
  );
}
