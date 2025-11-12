import { useB3BalanceFromAddresses, useNativeBalance } from "@b3dotfun/sdk/global-account/react";
import { useActiveWallet } from "thirdweb/react";
import { B3TokenIcon, EthereumTokenIcon } from "../TokenIcon";
import { TokenBalanceRow } from "./TokenBalanceRow";

const TokenContent = () => {
  // Get active wallet state
  const activeWallet = useActiveWallet();
  //const globalAccountWallet = useGlobalWalletState(state => state.globalAccountWallet);
  const activeAccount = activeWallet?.getAccount();
  const activeAddress = activeAccount?.address;

  // Balance data fetching - use active wallet address
  const { data: activeNativeBalance } = useNativeBalance(activeAddress);
  console.log("activeNativeBalance :", activeNativeBalance);
  const { data: activeB3Balance } = useB3BalanceFromAddresses(activeAddress);
  console.log("activeB3Balance :", activeB3Balance);

  if (!activeAddress) {
    return <div className="col-span-3 py-12 text-center text-gray-500">No tokens found</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TokenBalanceRow
        icon={<B3TokenIcon className="size-10" />}
        name="B3"
        balance={`${activeB3Balance?.formattedTotal || "0.00"} B3`}
        usdValue={activeB3Balance?.balanceUsdFormatted || "0.00"}
        priceChange={activeB3Balance?.priceChange24h}
      />
      <TokenBalanceRow
        icon={<EthereumTokenIcon className="size-10" />}
        name="Ethereum"
        balance={`${activeNativeBalance?.formattedTotal || "0.00"} ETH`}
        usdValue={activeNativeBalance?.formattedTotalUsd || "0.00"}
        priceChange={activeNativeBalance?.priceChange24h}
      />
    </div>
  );
};

export default TokenContent;
