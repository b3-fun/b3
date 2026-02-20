"use client";

import { ALL_CHAINS, ZERO_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { getPaymentUrl } from "@b3dotfun/sdk/anyspend/utils/chain";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendQuote";
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendOrderAndTransactions";
import { useCreateDepositFirstOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useCreateDepositFirstOrder";
import { useOnOrderSuccess } from "@b3dotfun/sdk/anyspend/react/hooks/useOnOrderSuccess";
import { useAnyspendTokenList } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendTokens";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { useAccountWallet, useB3Config, useModalStore, TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Chain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChainTokenIcon } from "../common/ChainTokenIcon";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";
import { TokenSelectorModal } from "./CryptoCheckoutPanel";

interface QRCheckoutPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  themeColor?: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
}

// Default source token: ETH on Base
const DEFAULT_ETH_ON_BASE: components["schemas"]["Token"] = {
  chainId: 8453,
  address: ZERO_ADDRESS,
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  metadata: { logoURI: "https://assets.relay.link/icons/1/light.png" },
};

export function QRCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  themeColor,
  onSuccess,
  onError,
  callbackMetadata,
  classes,
}: QRCheckoutPanelProps) {
  const [selectedSrcChainId, setSelectedSrcChainId] = useState(8453); // Base
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(DEFAULT_ETH_ON_BASE);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { address: walletAddress } = useAccountWallet();
  const { partnerId } = useB3Config();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  // Token list for selector
  const { data: tokenList, isLoading: isLoadingTokens } = useAnyspendTokenList(selectedSrcChainId, tokenSearchQuery);

  // Quote: how much source token is needed for the destination amount
  const isSameToken =
    selectedSrcToken.address.toLowerCase() === destinationTokenAddress.toLowerCase() &&
    selectedSrcToken.chainId === destinationTokenChainId;

  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote({
    type: "swap",
    srcChain: selectedSrcChainId,
    dstChain: destinationTokenChainId,
    srcTokenAddress: selectedSrcToken.address,
    dstTokenAddress: destinationTokenAddress,
    tradeType: "EXACT_OUTPUT",
    amount: totalAmount,
  });

  const srcAmount = useMemo(() => {
    if (isSameToken) return totalAmount;
    return anyspendQuote?.data?.currencyIn?.amount || "0";
  }, [isSameToken, totalAmount, anyspendQuote]);

  const srcAmountFormatted = useMemo(() => {
    const decimals = selectedSrcToken.decimals || 18;
    return formatTokenAmount(BigInt(srcAmount || "0"), decimals);
  }, [srcAmount, selectedSrcToken]);

  // Order state
  const [orderId, setOrderId] = useState<string | undefined>();
  const [globalAddress, setGlobalAddress] = useState<string | undefined>();
  const orderCreatedRef = useRef(false);

  // Create deposit_first order
  const { createOrder, isCreatingOrder } = useCreateDepositFirstOrder({
    onSuccess: (data: any) => {
      const id = data?.data?.id;
      const addr = data?.data?.globalAddress;
      setOrderId(id);
      setGlobalAddress(addr);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Build destination token object
  const dstToken: components["schemas"]["Token"] = useMemo(
    () => ({
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: 18,
      symbol: "",
      name: "",
      metadata: {},
    }),
    [destinationTokenAddress, destinationTokenChainId],
  );

  // Create order when token is selected and we don't have one yet
  useEffect(() => {
    if (orderCreatedRef.current) return;
    if (!selectedSrcToken) return;

    orderCreatedRef.current = true;
    createOrder({
      recipientAddress,
      srcChain: selectedSrcChainId,
      dstChain: destinationTokenChainId,
      srcToken: selectedSrcToken,
      dstToken,
      callbackMetadata,
    });
  }, [
    recipientAddress,
    selectedSrcChainId,
    destinationTokenChainId,
    selectedSrcToken,
    dstToken,
    callbackMetadata,
    createOrder,
  ]);

  // Poll order status
  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  // Call onSuccess when order is executed
  useOnOrderSuccess({
    orderData: oat,
    orderId,
    onSuccess: (txHash?: string) => {
      onSuccess?.({ orderId, txHash });
    },
  });

  const displayAddress = globalAddress || "";

  // Generate QR code value with amount from quote
  const qrAmount = srcAmount && srcAmount !== "0" ? BigInt(srcAmount) : undefined;
  const qrValue = displayAddress
    ? getPaymentUrl(
        displayAddress,
        qrAmount,
        isNativeToken(selectedSrcToken.address) ? "ETH" : selectedSrcToken.address,
        selectedSrcChainId,
        selectedSrcToken.decimals,
      )
    : "";

  const handleCopyAddress = async () => {
    if (displayAddress) {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectToken = (token: components["schemas"]["Token"]) => {
    setSelectedSrcToken(token);
    setSelectedSrcChainId(token.chainId);
    setShowTokenSelector(false);
    setTokenSearchQuery("");
    // Reset order so a new one is created with the new token
    setOrderId(undefined);
    setGlobalAddress(undefined);
    orderCreatedRef.current = false;
  };

  return (
    <div className={cn("anyspend-qr-checkout-panel flex flex-col gap-4", classes?.cryptoPanel)}>
      {/* Token Selector */}
      <div className="anyspend-token-selector">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit token</label>
        <button
          onClick={() => setShowTokenSelector(true)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
            classes?.tokenSelector,
          )}
        >
          <div className="flex items-center gap-3">
            <ChainTokenIcon
              chainUrl={ALL_CHAINS[selectedSrcToken.chainId]?.logoUrl || ""}
              tokenUrl={selectedSrcToken.metadata?.logoURI}
              className="h-8 w-8"
            />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSrcToken.symbol}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{ALL_CHAINS[selectedSrcChainId]?.name || ""}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        open={showTokenSelector}
        onClose={() => {
          setShowTokenSelector(false);
          setTokenSearchQuery("");
        }}
        tokenList={tokenList}
        isLoadingTokens={isLoadingTokens}
        tokenSearchQuery={tokenSearchQuery}
        onSearchChange={setTokenSearchQuery}
        onSelectToken={handleSelectToken}
        selectedToken={selectedSrcToken}
        walletAddress={walletAddress}
        chainId={selectedSrcChainId}
        onChainChange={chainId => {
          setSelectedSrcChainId(chainId);
          setTokenSearchQuery("");
        }}
      />

      {/* Quote Display */}
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50",
          classes?.quoteDisplay,
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">You pay</span>
          {isLoadingAnyspendQuote ? (
            <TextShimmer duration={1} className="text-sm">
              Fetching quote...
            </TextShimmer>
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {srcAmountFormatted} {selectedSrcToken.symbol}
            </span>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {isCreatingOrder && !globalAddress ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Creating deposit address...</p>
        </div>
      ) : displayAddress ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          {/* QR Code + Address side by side */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-lg bg-white p-2">
              <QRCodeSVG value={qrValue} size={80} level="M" marginSize={0} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Deposit address:</span>
              <div className="flex items-start gap-1.5">
                <span className="min-w-0 break-all font-mono text-xs leading-relaxed text-gray-900 dark:text-gray-100">
                  {displayAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="mt-0.5 shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Only send {selectedSrcToken.symbol} on {ALL_CHAINS[selectedSrcChainId]?.name || "the specified chain"}.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Copy / Connect Wallet Button */}
      {!walletAddress ? (
        <button
          onClick={() => {
            setB3ModalContentType({ type: "signInWithB3", showBackButton: false, chain: thirdwebB3Chain, partnerId });
            setB3ModalOpen(true);
          }}
          className={cn(
            "w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
            "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
            classes?.payButton,
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          Connect Wallet
        </button>
      ) : displayAddress ? (
        <button
          onClick={handleCopyAddress}
          className={cn(
            "w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
            "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
            classes?.payButton,
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          {copied ? "Copied!" : "Copy deposit address"}
        </button>
      ) : null}
    </div>
  );
}
