import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useTokenBalance } from "@b3dotfun/sdk/global-account/react";
import { formatUnits } from "viem";

export function TokenBalance({
  token,
  walletAddress,
  onChangeInput,
}: {
  token: components["schemas"]["Token"];
  walletAddress: string | undefined;
  onChangeInput: (value: string) => void;
}) {
  const { rawBalance, formattedBalance, isLoading } = useTokenBalance({
    token,
    address: walletAddress,
  });

  const handlePercentageClick = (percentage: number) => {
    if (!rawBalance) return;

    // Calculate the amount based on percentage of balance
    // Multiply first, then divide to avoid BigInt truncation
    const amount = percentage === 100 ? rawBalance : (rawBalance * BigInt(percentage)) / BigInt(100);

    onChangeInput(formatUnits(amount, token.decimals));
  };

  return (
    <div className="flex h-7 items-center justify-end gap-1" key={`balance-${token.address}-${token.chainId}`}>
      {!isLoading && (
        <>
          <div className="text-as-primary/50 inline-flex rounded-lg text-sm">
            {rawBalance ? `Balance: ${formattedBalance}` : `Balance: 0`}
          </div>

          {!!rawBalance && (
            <>
              {/* <button
                onClick={() => handlePercentageClick(20)}
                className="text-as-primary/50 bg-as-on-surface-2 hover:bg-as-on-surface-3 inline-flex rounded-lg px-2 py-1 text-xs transition-colors sm:hidden"
              >
                20%
              </button>
              <button
                onClick={() => handlePercentageClick(50)}
                className="text-as-primary/50 bg-as-on-surface-2 hover:bg-as-on-surface-3 inline-flex rounded-lg px-2 py-1 text-xs transition-colors"
              >
                50%
              </button> */}
              <button
                onClick={() => handlePercentageClick(100)}
                className="text-as-primary/50 bg-as-on-surface-2 hover:bg-as-on-surface-3 inline-flex cursor-pointer rounded-lg px-2 py-1 text-xs transition-colors"
              >
                MAX
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
