import { Button, ShinyButton } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ArrowDown } from "lucide-react";
import { components } from "../../../types/api";

interface FeeDetailPanelProps {
  fee: components["schemas"]["Fee"];
  decimals?: number;
  transactionAmountUsd?: number;
  onBack: () => void;
}

// Fee tier definitions
const CRYPTO_FEE_TIERS = [
  { min: 0, max: 10, bps: 120, label: "$0 – $10" },
  { min: 10, max: 500, bps: 80, label: "$10 – $500" },
  { min: 500, max: 5000, bps: 60, label: "$500 – $5,000" },
  { min: 5000, max: 50000, bps: 40, label: "$5,000 – $50,000" },
  { min: 50000, max: Infinity, bps: 28, label: "$50,000+" },
];

const FIAT_FEE_TIERS = [
  { min: 0.01, max: 25, fee: "$1", label: "$0.01 – $25" },
  { min: 25.01, max: 250, fee: "2%", label: "$25.01 – $250" },
  { min: 251, max: Infinity, fee: "3%", label: "$251+" },
];

// Whale discount tiers based on $ANY holdings
const WHALE_DISCOUNT_TIERS = [
  { minAny: 100000, discountPercent: 50, label: "Tier 1: 100k $ANY" },
  { minAny: 500000, discountPercent: 75, label: "Tier 2: 500k $ANY" },
  { minAny: 1000000, discountPercent: 100, label: "Tier 3: 1M+ $ANY" },
];

export function FeeDetailPanel({
  fee,
  decimals = 6,
  transactionAmountUsd,
  onBack,
}: FeeDetailPanelProps) {
  // Detect if this is a fiat onramp order (Stripe) vs regular crypto swap
  // stripeweb2_fee = Stripe/fiat onramp (uses FIAT_FEE_TIERS)
  // standard_fee = Regular crypto swap (uses CRYPTO_FEE_TIERS)
  const isStripeFee = fee.type === "stripeweb2_fee";

  // Convert basis points to percentage
  const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

  // Format amount
  const formatAmount = (amount: string) => {
    const divisor = Math.pow(10, decimals);
    const formatted = (Number(amount) / divisor).toFixed(2);
    return `$${formatted}`;
  };

  // Check if discount is active
  const hasWhaleDiscount = fee.anyspendWhaleDiscountBps > 0;
  const hasPartnerDiscount = fee.anyspendPartnerDiscountBps > 0;
  const hasAnyDiscount = hasWhaleDiscount || hasPartnerDiscount;

  // Find current tier based on transaction amount
  const getCurrentCryptoTier = (amount?: number) => {
    if (!amount) return null;
    return CRYPTO_FEE_TIERS.find(tier => amount >= tier.min && amount < tier.max);
  };

  const getCurrentFiatTier = (amount?: number) => {
    if (!amount) return null;
    return FIAT_FEE_TIERS.find(tier => amount >= tier.min && amount < tier.max);
  };

  const currentCryptoTier = getCurrentCryptoTier(transactionAmountUsd);
  const currentFiatTier = getCurrentFiatTier(transactionAmountUsd);

  // The whale discount is a percentage discount on the base fee itself
  // Example: 50% discount on 80 bps fee = 40 bps discount, final fee = 40 bps
  // So: finalFee = baseFee - (baseFee * discountPercent / 100)
  // Which means: discountPercent = ((baseFee - finalFee) / baseFee) * 100
  const baseFee = fee.type === "standard_fee" ? fee.anyspendFeeBps : 0;

  // The whale discount percentage (50%, 75%, or 100%)
  const whaleDiscountPercent = baseFee > 0 && hasWhaleDiscount
    ? Math.round(((baseFee - fee.finalFeeBps) / baseFee) * 100)
    : 0;

  // Determine which whale tier based on the discount percentage
  const currentWhaleTier = WHALE_DISCOUNT_TIERS.find(
    tier => Math.abs(whaleDiscountPercent - tier.discountPercent) <= 5
  );

  // Calculate partner discount percentage
  const partnerDiscountPercent = baseFee > 0 && hasPartnerDiscount
    ? Math.round((fee.anyspendPartnerDiscountBps / baseFee) * 100)
    : 0;

  return (
    <div className="mx-auto flex w-[460px] max-w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-as-primary/70 hover:text-as-primary flex items-center gap-2"
        >
          <ArrowDown className="h-4 w-4 rotate-90" />
          Back
        </Button>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="text-center">
          <h3 className="text-as-primary text-lg font-bold">Fee Breakdown</h3>
        </div>

        {/* Base Fee Schedule Section */}
        <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
          <h4 className="text-as-primary mb-3 text-sm font-semibold">
            {isStripeFee ? "Fiat Fee Schedule" : "Base Fee Schedule"}
          </h4>
          <div className="space-y-1.5">
            {isStripeFee
              ? FIAT_FEE_TIERS.map((tier, idx) => {
                  const isCurrentTier = currentFiatTier?.label === tier.label;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isCurrentTier
                          ? "bg-as-brand/10 text-as-brand font-semibold"
                          : "text-as-primary/60",
                      )}
                    >
                      <span>{tier.label}</span>
                      <span>CC Fee + {tier.fee}</span>
                    </div>
                  );
                })
              : CRYPTO_FEE_TIERS.map((tier, idx) => {
                  const isCurrentTier = currentCryptoTier?.label === tier.label;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isCurrentTier
                          ? "bg-as-brand/10 text-as-brand font-semibold"
                          : "text-as-primary/60",
                      )}
                    >
                      <span>{tier.label}</span>
                      <span>{bpsToPercent(tier.bps)}%</span>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Whale Discount Tiers - Only show if user has whale discount or partner discount */}
        {!isStripeFee && (hasWhaleDiscount || hasPartnerDiscount) && (
          <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
            <h4 className="text-as-primary mb-3 text-sm font-semibold">
              {hasWhaleDiscount ? "Whale Discount Tiers" : "Partner Discount"}
            </h4>
            <div className="space-y-1.5">
              {hasWhaleDiscount ? (
                WHALE_DISCOUNT_TIERS.map((tier, idx) => {
                  const isCurrentTier = currentWhaleTier?.label === tier.label;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isCurrentTier ? "bg-green-500/10 text-green-600 font-semibold" : "text-as-primary/60",
                      )}
                    >
                      <span>{tier.label}</span>
                      <span>{tier.discountPercent}% discount</span>
                    </div>
                  );
                })
              ) : (
                <div className="bg-green-500/10 text-green-600 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold">
                  <span>Partner Discount</span>
                  <span>{partnerDiscountPercent}% discount</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Summary */}
        {transactionAmountUsd && (
          <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
            <div className="text-as-secondary space-y-1 text-center text-xs">
              <p>
                Your transaction of <span className="text-as-primary font-semibold">${transactionAmountUsd.toFixed(2)}</span>
              </p>
              {isStripeFee && currentFiatTier && (
                <p>
                  Tier: <span className="text-as-brand font-semibold">{currentFiatTier.label}</span> → CC Fee +{" "}
                  {currentFiatTier.fee}
                </p>
              )}
              {!isStripeFee && currentCryptoTier && (
                <>
                  <p>
                    Fee Tier: <span className="text-as-brand font-semibold">{currentCryptoTier.label}</span> → Base fee{" "}
                    {bpsToPercent(currentCryptoTier.bps)}% ($
                    {((transactionAmountUsd * currentCryptoTier.bps) / 10000).toFixed(2)})
                  </p>
                  {hasWhaleDiscount && currentWhaleTier && (
                    <p>
                      Whale Tier: <span className="text-green-600 font-semibold">{currentWhaleTier.label}</span> →{" "}
                      {currentWhaleTier.discountPercent}% discount ($
                      {((transactionAmountUsd * baseFee * currentWhaleTier.discountPercent) / 100 / 10000).toFixed(2)})
                    </p>
                  )}
                  {hasPartnerDiscount && (
                    <p>
                      Partner Discount:{" "}
                      <span className="text-green-600 font-semibold">
                        {partnerDiscountPercent}% ($
                        {((transactionAmountUsd * baseFee * partnerDiscountPercent) / 100 / 10000).toFixed(2)})
                      </span>
                    </p>
                  )}
                  {hasAnyDiscount && (
                    <p>
                      Final fee:{" "}
                      <span className="text-as-brand font-semibold">
                        {bpsToPercent(fee.finalFeeBps)}% ($
                        {((transactionAmountUsd * fee.finalFeeBps) / 10000).toFixed(2)})
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          onClick={onBack}
          className={cn("as-main-button !bg-as-brand relative w-full")}
          textClassName={cn("text-white")}
        >
          Back to {isStripeFee ? "Payment" : "Swap"}
        </ShinyButton>
      </div>
    </div>
  );
}
