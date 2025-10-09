import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { chainIdToPublicClient, getNativeRequired } from "@b3dotfun/sdk/anyspend/utils/chain";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { useTokenBalance } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

function getNativeTransferGasReserve(chainId: number, gasPrice?: bigint): bigint {
  if (!gasPrice) {
    // Fallback to the default required amount if gas price is not provided
    return getNativeRequired(chainId);
  }

  // Native transfer always uses 21000 gas
  const GAS_LIMIT_TRANSFER = BigInt(21000);

  // Calculate gas cost with 2x buffer for safety: gasLimit * gasPrice * 2
  // This buffer accounts for gas price fluctuations between estimation and execution
  return GAS_LIMIT_TRANSFER * gasPrice * BigInt(5);
}

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

  const [gasPrice, setGasPrice] = useState<bigint | undefined>(undefined);

  // Fetch current gas price for accurate gas reserve calculation
  useEffect(() => {
    if (isNativeToken(token.address)) {
      const publicClient = chainIdToPublicClient(token.chainId);
      publicClient
        .getGasPrice()
        .then(setGasPrice)
        .catch(() => {
          // If fetching gas price fails, we'll fall back to default reserve
          setGasPrice(undefined);
        });
    }
  }, [token.address, token.chainId]);

  const handlePercentageClick = (percentage: number) => {
    if (!rawBalance) return;

    let amount: bigint;

    if (percentage === 100) {
      // For MAX button on native tokens, reserve gas for the transaction
      if (isNativeToken(token.address)) {
        const gasReserve = getNativeTransferGasReserve(token.chainId, gasPrice);
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

  // Format balance with max 8 decimal places
  const formatBalanceDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";

    // Format with max 8 decimal places, removing trailing zeros
    const formatted = num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
      useGrouping: false,
    });

    return formatted;
  };

  // Calculate available balance (after gas reserve for native tokens)
  const getAvailableBalance = () => {
    if (!rawBalance) return { raw: BigInt(0), formatted: "0" };

    if (isNativeToken(token.address)) {
      const gasReserve = getNativeTransferGasReserve(token.chainId, gasPrice);
      const available = rawBalance > gasReserve ? rawBalance - gasReserve : BigInt(0);
      const formattedValue = formatUnits(available, token.decimals);
      return {
        raw: available,
        formatted: formatBalanceDisplay(formattedValue),
      };
    }

    return {
      raw: rawBalance,
      formatted: formatBalanceDisplay(formattedBalance),
    };
  };

  const availableBalance = getAvailableBalance();

  return (
    <div className="flex h-7 items-center justify-end gap-1" key={`balance-${token.address}-${token.chainId}`}>
      {!isLoading && (
        <>
          <div
            className="text-as-primary/50 inline-flex rounded-lg text-sm"
            title={
              rawBalance && isNativeToken(token.address)
                ? `Actual balance: ${formatBalanceDisplay(formattedBalance)}`
                : rawBalance
                  ? `Balance: ${formatBalanceDisplay(formattedBalance)}`
                  : undefined
            }
          >
            {rawBalance ? `Balance: ${availableBalance.formatted}` : `Balance: 0`}
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
