export function FeeBreakDown() {
  return (
    <div className="w-44">
      {/* Section 1: Fee Breakdown */}
      <div className="mb-3">
        <h3 className="text-as-primary mb-2 text-sm font-semibold">Fee Breakdown</h3>
        <table className="w-full">
          <tbody className="text-as-secondary text-xs">
            <tr>
              <td className="py-1">Original Fee</td>
              <td className="py-1 text-right">0.30%</td>
            </tr>
            <tr>
              <td className="py-1">Whale Discount</td>
              <td className="py-1 text-right">-0.05%</td>
            </tr>
            <tr>
              <td className="py-1">Partner Discount</td>
              <td className="py-1 text-right">-0.03%</td>
            </tr>
            <tr className="text-as-primary font-semibold">
              <td className="py-1">Final Fee</td>
              <td className="py-1 text-right">0.22%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Divider */}
      <div className="border-as-border-secondary my-3 border-t"></div>

      {/* Section 2: Amount Calculation */}
      <div>
        <h3 className="text-as-primary mb-2 text-sm font-semibold">Amount Calculation</h3>
        <table className="w-full">
          <tbody className="text-as-secondary text-xs">
            <tr>
              <td className="py-1">Original Amount</td>
              <td className="py-1 text-right">1000</td>
            </tr>
            <tr>
              <td className="py-1">Final Fee (0.22%)</td>
              <td className="py-1 text-right">-2.2</td>
            </tr>
            <tr className="text-as-primary font-semibold">
              <td className="py-1">Final Amount</td>
              <td className="py-1 text-right">997.8</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
