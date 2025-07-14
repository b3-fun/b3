import { OrderType } from "@b3dotfun/sdk/anyspend";
import { StyleRoot, useHasMounted, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { useMemo } from "react";
import { encodeFunctionData } from "viem";
import { ABI_BONDKIT_BUY_FOR } from "../../abis/bondKit";
import { BondKitBuyForParams } from "../../types/bondKit";
import { AnySpendCustom } from "./AnySpendCustom";

export function AnyspendBondkit({
  loadOrder,
  mode = "modal",
  recipientAddress,
  contractAddress,
  chainId,
  minTokensOut,
  ethAmount,
  imageUrl,
  tokenName = "BondKit Token",
  onSuccess,
}: BondKitBuyForParams) {
  const hasMounted = useHasMounted();

  // Get native token data for the chain
  const { data: tokenData, isError: isTokenError } = useTokenData(
    chainId,
    "0x0000000000000000000000000000000000000000",
  );

  // Convert token data to AnySpend Token type
  const dstToken = useMemo(() => {
    if (!tokenData) return null;

    return {
      address: tokenData.address,
      chainId: chainId,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      metadata: {
        logoURI: tokenData.logoURI,
      },
    };
  }, [tokenData, chainId]);

  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        <img
          alt="token preview"
          className="size-full rounded-lg object-cover"
          src={imageUrl || "https://cdn.b3.fun/nft-placeholder.png"}
        />
      </div>
      <div className="mt-[-60px] w-full rounded-t-lg bg-white">
        <div className="h-[60px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">{tokenName}</span>
        </div>
      </div>
    </>
  );

  // If we don't have token data, show error state
  if (!dstToken || isTokenError) {
    return (
      <StyleRoot>
        <div className="b3-root b3-modal bg-b3-react-background flex w-full flex-col items-center p-8">
          <p className="text-as-red text-center text-sm">
            Failed to fetch native token information for chain {chainId}. Please try again.
          </p>
        </div>
      </StyleRoot>
    );
  }

  const encodedData = encodeFunctionData({
    abi: [ABI_BONDKIT_BUY_FOR],
    functionName: "buyFor",
    args: [recipientAddress as `0x${string}`, BigInt(minTokensOut)],
  });

  return (
    <AnySpendCustom
      isMainnet={true}
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={recipientAddress}
      orderType={OrderType.Custom}
      dstChainId={chainId}
      dstToken={dstToken}
      dstAmount={ethAmount} // Set the ETH amount to be sent with the transaction
      contractAddress={contractAddress}
      encodedData={encodedData}
      metadata={{
        type: OrderType.Custom,
        action: "BondKit Buy",
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={true}
    />
  );
}
