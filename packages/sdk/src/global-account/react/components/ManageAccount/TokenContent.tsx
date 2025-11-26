import { useSimBalance } from "@b3dotfun/sdk/global-account/react";
import { getChainLogo } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { useActiveWallet } from "thirdweb/react";
import { TokenBalanceRow } from "./TokenBalanceRow";

// Chain logo URLs mapping
const CHAIN_LOGOS: Record<number, string> = [1, 8453, 8333].map(chainId => getChainLogo(chainId));

const TokenContent = () => {
  // Get active wallet state
  const activeWallet = useActiveWallet();
  const activeAccount = activeWallet?.getAccount();
  const activeAddress = activeAccount?.address;

  const { data: simBalance } = useSimBalance(activeAddress, [8453, 8333, 1]);
  console.log("simBalance :", simBalance);

  if (!activeAddress) {
    return <div className="col-span-3 py-12 text-center text-gray-500">No tokens found</div>;
  }

  if (!simBalance?.balances || simBalance.balances.length === 0) {
    return <div className="col-span-3 py-12 text-center text-gray-500">No tokens found</div>;
  }

  // Sort by USD value descending
  const sortedBalances = [...simBalance.balances].sort((a, b) => {
    const valueA = a.value_usd || 0;
    const valueB = b.value_usd || 0;
    return valueB - valueA;
  });

  return (
    <div className="flex max-h-[132px] flex-col gap-3 overflow-y-auto">
      {sortedBalances.map((token, index) => {
        // Format balance
        const balance = (Number(token.amount) / Math.pow(10, token.decimals)).toFixed(4);
        const usdValue = token.value_usd?.toFixed(2) || "0.00";

        // Calculate 24h price change (if available in future API updates)
        const priceChange = null; // API doesn't provide this yet

        // Determine token logo
        // For native tokens, use ETH logo instead of chain logo
        let tokenLogo = token.token_metadata?.logo || "";
        if (token.address === "native" && token.symbol === "ETH") {
          tokenLogo = CHAIN_LOGOS[0];
        }

        return (
          <TokenBalanceRow
            key={`${token.chain_id}-${token.address}-${index}`}
            tokenLogo={tokenLogo}
            chainLogo={CHAIN_LOGOS[token.chain_id] || ""}
            name={token.name || token.symbol}
            balance={`${balance} ${token.symbol}`}
            usdValue={usdValue}
            priceChange={priceChange}
          />
        );
      })}
    </div>
  );
};

export default TokenContent;
