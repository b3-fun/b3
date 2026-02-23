import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { getNativeRequired } from "@b3dotfun/sdk/anyspend/utils/chain";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { useSimTokenBalance } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { useMemo } from "react";
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
  const tokenAddress = isNativeToken(token.address) ? "native" : token.address;
  const { data, isLoading } = useSimTokenBalance(walletAddress, tokenAddress, token.chainId);

  const { rawBalance, formattedBalance } = useMemo(() => {
    const balance = data?.balances?.[0];
    if (!balance?.amount) {
      return { rawBalance: null, formattedBalance: "0" };
    }
    const raw = BigInt(balance.amount);
    return {
      rawBalance: raw,
      formattedBalance: formatTokenAmount(raw, balance.decimals),
    };
  }, [data]);

  const handlePercentageClick = (percentage: number) => {
    if (!rawBalance) return;

    let amount: bigint;

    if (percentage === 100) {
      // For MAX button on native tokens, reserve gas for the transaction
      if (isNativeToken(token.address)) {
        const gasReserve = getNativeRequired(token.chainId);
        // Ensure we don't go negative
        amount = rawBalance > gasReserve ? rawBalance - gasReserve : BigInt(0);
      } else {
        // For ERC20 tokens, use full balance
        amount = rawBalance;
      }
    } else {
      // Calculate the amount based on percentage of balance
      // Multiply first, then divide to avoid BigInt truncation
      amount = (rawBalance * BigInt(percentage)) / BigInt(100);
    }

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
