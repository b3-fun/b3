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

        {/* Payment Summary - Simple and Clean */}
        <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
          <table className="w-full">
            <tbody className="text-sm">
              <tr className="border-b border-as-border-secondary">
                <td className="py-2.5">
                  <span className="text-as-primary font-medium">You Pay</span>
                </td>
                <td className="py-2.5 text-right font-semibold text-as-primary">
                  {isStripeFee ? formatAmount(fee.originalAmount) : `${bpsToPercent(fee.finalFeeBps)}%`}
                </td>
              </tr>
              <tr className="border-b border-as-border-secondary">
                <td className="py-2.5">
                  <span className="text-as-primary font-medium">Total Fees</span>
                </td>
                <td className="py-2.5 text-right font-semibold text-red-600">
                  {isStripeFee
                    ? `-${formatAmount((Number(fee.originalAmount) - Number(fee.finalAmount)).toString())}`
                    : `${bpsToPercent(fee.finalFeeBps)}%`
                  }
                </td>
              </tr>
              {hasAnyDiscount && !isStripeFee && (
                <tr className="border-b border-as-border-secondary">
                  <td className="py-2.5">
                    <span className="font-medium text-green-600">Discounts Applied</span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-green-600">
                    -{bpsToPercent(fee.anyspendWhaleDiscountBps + fee.anyspendPartnerDiscountBps)}%
                  </td>
                </tr>
              )}
              <tr className="bg-as-surface-primary/50">
                <td className="py-3">
                  <span className="text-as-primary font-bold">You Receive</span>
                </td>
                <td className="py-3 text-right font-bold text-as-brand">
                  {isStripeFee ? formatAmount(fee.finalAmount) : `After ${bpsToPercent(fee.finalFeeBps)}% fee`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Fee Schedule Section */}
        <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-4">
          <h4 className="text-as-primary mb-3 text-sm font-semibold">
            {isStripeFee ? "Fiat Fee Schedule" : "Crypto Fee Schedule"}
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
          {transactionAmountUsd && (
            <p className="text-as-secondary mt-3 text-center text-xs">
              Your transaction of <span className="text-as-primary font-semibold">${transactionAmountUsd.toFixed(2)}</span>{" "}
              {isStripeFee && currentFiatTier && (
                <>
                  qualifies for <span className="text-as-brand font-semibold">CC Fee + {currentFiatTier.fee}</span>
                </>
              )}
              {!isStripeFee && currentCryptoTier && (
                <>
                  qualifies for <span className="text-as-brand font-semibold">{bpsToPercent(currentCryptoTier.bps)}%</span> fee
                </>
              )}
            </p>
          )}
        </div>

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
