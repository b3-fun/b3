import { components } from "../../../types/api";

interface FeeBreakDownProps {
  fee: components["schemas"]["Fee"];
  /** Number of decimals for amount display (default: 6 for USDC) */
  decimals?: number;
  /** Show currency symbol for amounts (default: true) */
  showCurrency?: boolean;
  /** Custom className for the container */
  className?: string;
}

export function FeeBreakDown({ fee, decimals = 6, showCurrency = true, className = "" }: FeeBreakDownProps) {
  const isStripeFee = fee.type === "stripeweb2_fee";

  // Convert basis points to percentage
  const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

  // Format amount with optional currency
  const formatAmount = (amount: string) => {
    const divisor = Math.pow(10, decimals);
    const formatted = (Number(amount) / divisor).toFixed(2);
    return showCurrency ? `$${formatted}` : formatted;
  };

  // Check if discount is active
  const hasWhaleDiscount = fee.anyspendWhaleDiscountBps > 0;
  const hasPartnerDiscount = fee.anyspendPartnerDiscountBps > 0;

  return (
    <div className={`min-w-[240px] ${className}`}>
      {/* Fee Breakdown Section */}
      <div className="mb-4">
        <h3 className="text-as-primary mb-2 text-sm font-semibold">Fee Breakdown</h3>
        <table className="w-full">
          <tbody className="text-as-secondary text-xs">
            {isStripeFee && (
              <tr>
                <td className="py-1">Stripe Fee</td>
                <td className="py-1 text-right">
                  {bpsToPercent(fee.stripeFeeBps)}% + ${fee.stripeFeeUsd.toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-1">AnySpend Fee</td>
              <td className="py-1 text-right">
                {bpsToPercent(fee.anyspendFeeBps)}%
                {isStripeFee && fee.anyspendFeeUsd > 0 && ` + $${fee.anyspendFeeUsd.toFixed(2)}`}
              </td>
            </tr>
            {hasWhaleDiscount && (
              <tr className="text-green-600">
                <td className="py-1">Whale Discount</td>
                <td className="py-1 text-right">-{bpsToPercent(fee.anyspendWhaleDiscountBps)}%</td>
              </tr>
            )}
            {hasPartnerDiscount && (
              <tr className="text-green-600">
                <td className="py-1">Partner Discount</td>
                <td className="py-1 text-right">-{bpsToPercent(fee.anyspendPartnerDiscountBps)}%</td>
              </tr>
            )}
            <tr className="border-as-border-secondary border-t">
              <td className="text-as-primary py-1.5 pt-2 font-semibold">Total Fee</td>
              <td className="text-as-primary py-1.5 pt-2 text-right font-semibold">
                {bpsToPercent(fee.finalFeeBps)}%{isStripeFee && ` + $${fee.finalFeeUsd.toFixed(2)}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount Calculation Section (Stripe only) */}
      {isStripeFee && (
        <>
          <div className="border-as-border-secondary my-3 border-t"></div>
          <div>
            <h3 className="text-as-primary mb-2 text-sm font-semibold">Amount Calculation</h3>
            <table className="w-full">
              <tbody className="text-as-secondary text-xs">
                <tr>
                  <td className="py-1">Original Amount</td>
                  <td className="py-1 text-right font-medium">{formatAmount(fee.originalAmount)}</td>
                </tr>
                <tr>
                  <td className="py-1">Total Fee</td>
                  <td className="py-1 text-right text-red-600">
                    -{formatAmount((Number(fee.originalAmount) - Number(fee.finalAmount)).toString())}
                  </td>
                </tr>
                <tr className="border-as-border-secondary border-t">
                  <td className="text-as-primary py-1.5 pt-2 font-semibold">You Receive</td>
                  <td className="text-as-primary py-1.5 pt-2 text-right font-semibold">
                    {formatAmount(fee.finalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
