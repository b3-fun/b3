import { components } from "../../../types/api";

interface FeeBreakDownProps {
  fee: components["schemas"]["Fee"];
}

export function FeeBreakDown({ fee }: FeeBreakDownProps) {
  const isStripeFee = fee.type === "stripeweb2_fee";

  // Convert basis points to percentage
  const bpsToPercent = (bps: number) => (bps / 100).toFixed(2);

  return (
    <div className="w-44">
      {/* Section 1: Fee Breakdown */}
      <div className="mb-3">
        <h3 className="text-as-primary mb-2 text-sm font-semibold">Fee Breakdown</h3>
        <table className="w-full">
          <tbody className="text-as-secondary text-xs">
            {isStripeFee && (
              <tr>
                <td className="py-1">Stripe Fee</td>
                <td className="py-1 text-right">{bpsToPercent(fee.stripeFeeBps)}%</td>
              </tr>
            )}
            <tr>
              <td className="py-1">Original Fee</td>
              <td className="py-1 text-right">{bpsToPercent(fee.anyspendFeeBps)}%</td>
            </tr>
            <tr>
              <td className="py-1">Whale Discount</td>
              <td className="py-1 text-right">-{bpsToPercent(fee.anyspendWhaleDiscountBps)}%</td>
            </tr>
            <tr>
              <td className="py-1">Partner Discount</td>
              <td className="py-1 text-right">-{bpsToPercent(fee.anyspendPartnerDiscountBps)}%</td>
            </tr>
            <tr className="text-as-primary font-semibold">
              <td className="py-1">Final Fee</td>
              <td className="py-1 text-right">{bpsToPercent(fee.finalFeeBps)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Divider */}
      {isStripeFee && (
        <>
          <div className="border-as-border-secondary my-3 border-t"></div>

          {/* Section 2: Amount Calculation (only for Stripe) */}
          <div>
            <h3 className="text-as-primary mb-2 text-sm font-semibold">Amount Calculation</h3>
            <table className="w-full">
              <tbody className="text-as-secondary text-xs">
                <tr>
                  <td className="py-1">Original Amount</td>
                  <td className="py-1 text-right">{(Number(fee.originalAmount) / 1e6).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1">Final Fee ({bpsToPercent(fee.finalFeeBps)}%)</td>
                  <td className="py-1 text-right">
                    -{((Number(fee.originalAmount) - Number(fee.finalAmount)) / 1e6).toFixed(2)}
                  </td>
                </tr>
                <tr className="text-as-primary font-semibold">
                  <td className="py-1">Final Amount</td>
                  <td className="py-1 text-right">{(Number(fee.finalAmount) / 1e6).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
