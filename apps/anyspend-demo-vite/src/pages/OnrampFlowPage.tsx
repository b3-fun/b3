import { OrderType, Token, TradeType, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { useAnyspendQuote, WebviewOnrampPayment } from "@b3dotfun/sdk/anyspend/react";
import { useSearchParamsSSR, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { useMemo } from "react";
import { parseUnits } from "viem";

export default function OnrampFlowPage() {
  const searchParams = useSearchParamsSSR();
  const amount = searchParams.get("amount") || "0";
  const recipientAddress = searchParams.get("recipient") || "";
  const userId = searchParams.get("userId") || "";
  const chainId = Number(searchParams.get("toChainId")) || 8453;
  const destinationTokenAddress = searchParams.get("toCurrency") || "";
  const destinationTokenChainId = Number(searchParams.get("toChainId")) || 8453;
  if (!destinationTokenAddress || !destinationTokenChainId) {
    throw new Error("Missing destination token address or chain ID");
  }

  // Get destination token from URL params
  const { data: tokenMetadata } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  // Create destination token with fallback valuesc
  const destinationToken = useMemo(
    () => ({
      symbol: tokenMetadata?.symbol || "",
      chainId: destinationTokenChainId,
      address: destinationTokenAddress,
      name: tokenMetadata?.name || "",
      decimals: tokenMetadata?.decimals || 18,
      metadata: {
        logoURI: tokenMetadata?.logoURI
      }
    }),
    [tokenMetadata, destinationTokenChainId, destinationTokenAddress]
  ) as Token;

  // Get quote for the transaction
  const { anyspendQuote } = useAnyspendQuote(true, {
    type: OrderType.Swap,
    srcChain: 8453, // Base chain ID
    srcTokenAddress: USDC_BASE.address,
    dstChain: chainId,
    dstTokenAddress: destinationTokenAddress,
    amount: parseUnits(amount || "0", USDC_BASE.decimals).toString(),
    tradeType: TradeType.EXACT_INPUT
  });

  // Handle order creation
  const handlePaymentSuccess = (orderId: string) => {
    // Use window.location.href for a full page reload
    window.location.href = `${window.location.origin}/onramp/status?orderId=${orderId}`;
  };

  return (
    <WebviewOnrampPayment
      srcAmountOnRamp={amount}
      recipientAddress={recipientAddress}
      destinationToken={destinationToken}
      anyspendQuote={anyspendQuote}
      onPaymentSuccess={handlePaymentSuccess}
      userId={userId || undefined}
    />
  );
}
