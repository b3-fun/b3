import { ShinyButton } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { components } from "../../../types/api";
import type { FeeDetailPanelClasses } from "../types/classes";

interface FeeDetailPanelProps {
  fee: components["schemas"]["Fee"];
  transactionAmountUsd?: number;
  onBack: () => void;
  classes?: FeeDetailPanelClasses;
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

export function FeeDetailPanel({ fee, transactionAmountUsd, onBack, classes }: FeeDetailPanelProps) {
  // Detect if this is a fiat onramp order (Stripe) vs regular crypto swap
  // stripeweb2_fee = Stripe/fiat onramp (uses FIAT_FEE_TIERS)
  // standard_fee = Regular crypto swap (uses CRYPTO_FEE_TIERS)
  const isStripeFee = fee.type === "stripeweb2_fee";

  // Convert basis points to percentage
  const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

  // Check if discount is active
  const hasWhaleDiscount = fee.anyspendWhaleDiscountBps > 0;
  const hasPartnerDiscount = fee.anyspendPartnerDiscountBps > 0;

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
  const whaleDiscountPercent =
    baseFee > 0 && hasWhaleDiscount ? Math.round(((baseFee - fee.finalFeeBps) / baseFee) * 100) : 0;

  // Determine which whale tier based on the discount percentage
  const currentWhaleTier = WHALE_DISCOUNT_TIERS.find(
    tier => Math.abs(whaleDiscountPercent - tier.discountPercent) <= 5,
  );

  // Calculate partner discount percentage
  const partnerDiscountPercent =
    baseFee > 0 && hasPartnerDiscount ? Math.round((fee.anyspendPartnerDiscountBps / baseFee) * 100) : 0;

  // State for expanding tier lists
  const [showAllFeeTiers, setShowAllFeeTiers] = useState(false);
  const [showAllDiscountTiers, setShowAllDiscountTiers] = useState(false);

  return (
    <div className={classes?.container || "mx-auto flex w-[460px] max-w-full flex-col items-center gap-3 px-5"}>
      <div className="flex w-full flex-col gap-3">
        <div className="text-center">
          <h3 className={classes?.title || "text-as-primary text-lg font-bold"}>Fee Breakdown</h3>
        </div>

        {/* Base Fee Schedule Section */}
        <div
          className={classes?.tierCard || "bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4"}
        >
          <h4 className={classes?.tierCardTitle || "text-as-primary mb-3 text-sm font-semibold"}>
            {isStripeFee ? "Fiat Fee Schedule" : "Base Fee Schedule"}
          </h4>
          <div className="space-y-1.5">
            {isStripeFee
              ? FIAT_FEE_TIERS.map((tier, idx) => {
                  const isCurrentTier = currentFiatTier?.label === tier.label;
                  const currentTierIndex = FIAT_FEE_TIERS.findIndex(t => t.label === currentFiatTier?.label);

                  // Show all tiers if expanded, otherwise show up to current tier
                  if (!showAllFeeTiers && currentTierIndex !== -1 && idx > currentTierIndex) {
                    return null;
                  }

                  return (
                    <div
                      key={idx}
                      className={cn(
                        isCurrentTier
                          ? classes?.tierRowActive ||
                              "bg-as-brand/10 text-as-brand flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                          : classes?.tierRow ||
                              "text-as-primary/60 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      )}
                    >
                      <span className={classes?.tierLabel}>{tier.label}</span>
                      <span className={classes?.tierValue}>Credit Card Fee + {tier.fee}</span>
                    </div>
                  );
                })
              : CRYPTO_FEE_TIERS.map((tier, idx) => {
                  const isCurrentTier = currentCryptoTier?.label === tier.label;
                  const currentTierIndex = CRYPTO_FEE_TIERS.findIndex(t => t.label === currentCryptoTier?.label);

                  // Show all tiers if expanded, otherwise show up to current tier
                  if (!showAllFeeTiers && currentTierIndex !== -1 && idx > currentTierIndex) {
                    return null;
                  }

                  return (
                    <div
                      key={idx}
                      className={cn(
                        isCurrentTier
                          ? classes?.tierRowActive ||
                              "bg-as-brand/10 text-as-brand flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                          : classes?.tierRow ||
                              "text-as-primary/60 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      )}
                    >
                      <span className={classes?.tierLabel}>{tier.label}</span>
                      <span className={classes?.tierValue}>{bpsToPercent(tier.bps)}%</span>
                    </div>
                  );
                })}
          </div>

          {/* Show expand button if there are lower tiers */}
          {(() => {
            const currentTierIndex = isStripeFee
              ? FIAT_FEE_TIERS.findIndex(t => t.label === currentFiatTier?.label)
              : CRYPTO_FEE_TIERS.findIndex(t => t.label === currentCryptoTier?.label);
            const totalTiers = isStripeFee ? FIAT_FEE_TIERS.length : CRYPTO_FEE_TIERS.length;
            const hasMoreTiers = currentTierIndex !== -1 && currentTierIndex < totalTiers - 1;

            if (hasMoreTiers) {
              return (
                <button
                  onClick={() => setShowAllFeeTiers(!showAllFeeTiers)}
                  className={
                    classes?.expandButton ||
                    "text-as-primary/60 hover:text-as-primary mt-2 flex w-full items-center justify-center gap-1 text-xs transition-colors"
                  }
                >
                  <span>{showAllFeeTiers ? "Show less" : "Show higher tiers"}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAllFeeTiers && "rotate-180")} />
                </button>
              );
            }
            return null;
          })()}
        </div>

        {/* Whale Discount Tiers - Always show for crypto (not fiat) */}
        {!isStripeFee && (
          <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
            <h4 className="text-as-primary mb-3 text-sm font-semibold">
              {hasWhaleDiscount ? "Whale Discount Tiers" : hasPartnerDiscount ? "Partner Discount" : "Discount Tiers"}
            </h4>
            <div className="space-y-1.5">
              {hasPartnerDiscount && !hasWhaleDiscount ? (
                <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-3 py-2.5 text-sm font-semibold text-green-600">
                  <span>Partner Discount</span>
                  <span>{partnerDiscountPercent}% discount</span>
                </div>
              ) : (
                <>
                  {WHALE_DISCOUNT_TIERS.map((tier, idx) => {
                    const isCurrentTier = currentWhaleTier?.label === tier.label;
                    const currentTierIndex = WHALE_DISCOUNT_TIERS.findIndex(t => t.label === currentWhaleTier?.label);

                    // If no whale discount, show only first tier; otherwise show up to current tier
                    if (!showAllDiscountTiers) {
                      if (!hasWhaleDiscount && idx > 0) {
                        return null;
                      }
                      if (hasWhaleDiscount && currentTierIndex !== -1 && idx > currentTierIndex) {
                        return null;
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                          isCurrentTier ? "bg-green-500/10 font-semibold text-green-600" : "text-as-primary/60",
                        )}
                      >
                        <span>{tier.label}</span>
                        <span>{tier.discountPercent}% discount</span>
                      </div>
                    );
                  })}

                  {/* Show expand button */}
                  {(() => {
                    const currentTierIndex = WHALE_DISCOUNT_TIERS.findIndex(t => t.label === currentWhaleTier?.label);
                    const hasMoreTiers = hasWhaleDiscount
                      ? currentTierIndex !== -1 && currentTierIndex < WHALE_DISCOUNT_TIERS.length - 1
                      : WHALE_DISCOUNT_TIERS.length > 1;

                    if (hasMoreTiers) {
                      return (
                        <button
                          onClick={() => setShowAllDiscountTiers(!showAllDiscountTiers)}
                          className="text-as-primary/60 hover:text-as-primary mt-2 flex w-full items-center justify-center gap-1 text-xs transition-colors"
                        >
                          <span>{showAllDiscountTiers ? "Show less" : "Show all tiers"}</span>
                          <ChevronDown
                            className={cn("h-3.5 w-3.5 transition-transform", showAllDiscountTiers && "rotate-180")}
                          />
                        </button>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* Transaction Summary */}
        {transactionAmountUsd && (
          <div
            className={
              classes?.summaryCard || "bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4"
            }
          >
            <div className="space-y-2 text-sm">
              <div className={classes?.summaryRow || "flex items-center justify-between"}>
                <span className={classes?.summaryLabel || "text-as-secondary"}>Transaction</span>
                <span className={classes?.summaryValue || "text-as-primary font-semibold"}>
                  ${transactionAmountUsd.toFixed(2)}
                </span>
              </div>

              {isStripeFee && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-as-secondary">
                      Credit Card Fee ({fee.stripeFeeBps ? `${bpsToPercent(fee.stripeFeeBps)}%` : "0%"} + $
                      {fee.stripeFeeUsd?.toFixed(2) || "0.00"})
                    </span>
                    <span className="text-as-primary font-medium">
                      ${((transactionAmountUsd * (fee.stripeFeeBps || 0)) / 10000 + (fee.stripeFeeUsd || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-as-secondary">
                      AnySpend Fee ({fee.anyspendFeeBps ? `${bpsToPercent(fee.anyspendFeeBps)}%` : "0%"}
                      {fee.anyspendFeeUsd && fee.anyspendFeeUsd > 0 ? ` + $${fee.anyspendFeeUsd.toFixed(2)}` : ""})
                    </span>
                    <span className="text-as-primary font-medium">
                      $
                      {((transactionAmountUsd * (fee.anyspendFeeBps || 0)) / 10000 + (fee.anyspendFeeUsd || 0)).toFixed(
                        2,
                      )}
                    </span>
                  </div>
                  <div className={classes?.summaryDivider || "border-as-border-secondary border-t pt-2"}>
                    <div className={classes?.totalRow || "flex items-center justify-between"}>
                      <span className={classes?.totalLabel || "text-as-primary font-semibold"}>Total Fee</span>
                      <span className={classes?.totalValue || "text-as-brand font-semibold"}>
                        ${((transactionAmountUsd * (fee.finalFeeBps || 0)) / 10000 + (fee.finalFeeUsd || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!isStripeFee && currentCryptoTier && (
                <>
                  <div className={classes?.summaryRow || "flex items-center justify-between"}>
                    <span className={classes?.summaryLabel || "text-as-secondary"}>
                      Base Fee ({bpsToPercent(currentCryptoTier.bps)}%)
                    </span>
                    <span className={classes?.summaryValue || "text-as-primary font-medium"}>
                      ${((transactionAmountUsd * currentCryptoTier.bps) / 10000).toFixed(2)}
                    </span>
                  </div>

                  {hasWhaleDiscount && currentWhaleTier && (
                    <div className={classes?.summaryRow || "flex items-center justify-between"}>
                      <span className="text-green-600">Discount ({currentWhaleTier.discountPercent}% off)</span>
                      <span className="font-medium text-green-600">
                        -$
                        {((transactionAmountUsd * baseFee * currentWhaleTier.discountPercent) / 100 / 10000).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {hasPartnerDiscount && (
                    <div className={classes?.summaryRow || "flex items-center justify-between"}>
                      <span className="text-green-600">Partner Discount ({partnerDiscountPercent}% off)</span>
                      <span className="font-medium text-green-600">
                        -${((transactionAmountUsd * baseFee * partnerDiscountPercent) / 100 / 10000).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className={classes?.summaryDivider || "border-as-border-secondary border-t pt-2"}>
                    <div className={classes?.totalRow || "flex items-center justify-between"}>
                      <span className={classes?.totalLabel || "text-as-primary font-semibold"}>Total Fee</span>
                      <span className={classes?.totalValue || "text-as-brand font-semibold"}>
                        ${((transactionAmountUsd * fee.finalFeeBps) / 10000).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          onClick={onBack}
          className={classes?.backButton || cn("as-main-button !bg-as-brand relative w-full")}
          textClassName={cn("text-white")}
        >
          Back to {isStripeFee ? "Payment" : "Swap"}
        </ShinyButton>
      </div>
    </div>
  );
}
