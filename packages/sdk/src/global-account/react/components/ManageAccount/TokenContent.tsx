import { useB3BalanceFromAddresses, useNativeBalance } from "@b3dotfun/sdk/global-account/react";
import { useFirstEOA } from "../../hooks/useFirstEOA";
import { B3TokenIcon, EthereumTokenIcon } from "../TokenIcon";
import { TokenBalanceRow } from "./TokenBalanceRow";

const TokenContent = () => {
  //const globalAccount = useGlobalAccount();
  const { address: eoaAddress } = useFirstEOA();

  // Balance data fetching
  const { data: eoaNativeBalance, isLoading: eoaNativeLoading } = useNativeBalance(eoaAddress);
  const { data: eoaB3Balance, isLoading: eoaB3Loading } = useB3BalanceFromAddresses(eoaAddress);
  // const { data: b3Balance, isLoading: b3Loading } = useB3BalanceFromAddresses(globalAccount?.address);
  // const { data: nativeBalance, isLoading: nativeLoading } = useNativeBalance(globalAccount?.address);

  // const globalAccountTotalUsd = (b3Balance?.balanceUsd || 0) + (nativeBalance?.totalUsd || 0);
  // const eoaTotalUsd = (eoaB3Balance?.balanceUsd || 0) + (eoaNativeBalance?.totalUsd || 0);

  // // Check if both data sets are ready (not loading and have data)
  // const isGlobalDataReady = !b3Loading && !nativeLoading && b3Balance !== undefined && nativeBalance !== undefined;
  // const isEoaDataReady =
  //   !eoaAddress || (!eoaB3Loading && !eoaNativeLoading && eoaB3Balance !== undefined && eoaNativeBalance !== undefined);

  if (!eoaAddress) {
    return <div className="col-span-3 py-12 text-center text-gray-500">No tokens found</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TokenBalanceRow
        icon={<B3TokenIcon className="size-10" />}
        name="B3"
        balance={`${eoaB3Balance?.formattedTotal || "0.00"} B3`}
        usdValue={eoaB3Balance?.balanceUsdFormatted || "0.00"}
        priceChange={eoaB3Balance?.priceChange24h}
      />
      <TokenBalanceRow
        icon={<EthereumTokenIcon className="size-10" />}
        name="Ethereum"
        balance={`${eoaNativeBalance?.formattedTotal || "0.00"} ETH`}
        usdValue={eoaNativeBalance?.formattedTotalUsd || "0.00"}
        priceChange={eoaNativeBalance?.priceChange24h}
      />
    </div>
  );
};

export default TokenContent;
