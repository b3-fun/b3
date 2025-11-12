import { ShinyButton } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import Link from "next/link";

interface PointsDetailPanelProps {
  pointsAmount?: number;
  onBack: () => void;
}

export function PointsDetailPanel({ pointsAmount = 0, onBack }: PointsDetailPanelProps) {
  return (
    <div className="mx-auto flex w-[460px] max-w-full flex-col items-center gap-4 px-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <h3 className="text-as-primary text-xl font-bold">Earn Points with Every Swap</h3>
        <p className="text-as-primary/70 text-balance text-sm leading-relaxed">
          You'll earn <span className="text-as-brand font-semibold">+{pointsAmount.toLocaleString()} points</span>{" "}
          towards the{" "}
          <Link href="https://anyspend.com/points" target="_blank" className="text-as-brand underline">
            next AnySpend airdrop
          </Link>{" "}
          when you complete this transaction.
        </p>
        <div className="bg-as-surface-primary border-as-border-secondary mt-2 w-full rounded-lg border p-4 text-left">
          <h4 className="text-as-primary mb-2 font-semibold">How it works:</h4>
          <ul className="text-as-primary/70 space-y-1 text-sm">
            <li>• Points are earned based on transaction volume</li>
            <li>• Higher volume = more points</li>
            <li>• Points contribute to future airdrops</li>
            <li>• Keep swapping to maximize your rewards</li>
          </ul>
        </div>
        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          onClick={onBack}
          className={cn("as-main-button !bg-as-brand relative w-full")}
          textClassName={cn("text-white")}
        >
          Back to Swap
        </ShinyButton>
      </div>
    </div>
  );
}
