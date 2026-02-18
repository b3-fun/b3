"use client";

import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendQuote";
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { useAnyspendTokenList } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendTokens";
import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend";
import { useAccountWallet, useSimTokenBalance, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainTokenIcon } from "../common/ChainTokenIcon";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CryptoCheckoutPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  buttonText?: string;
  themeColor?: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  classes?: AnySpendCheckoutClasses;
}

export function CryptoCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  buttonText = "Pay",
  themeColor,
  onSuccess,
  onError,
  classes,
}: CryptoCheckoutPanelProps) {
  const [selectedSrcChainId, setSelectedSrcChainId] = useState(destinationTokenChainId);
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"] | null>(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  // Get wallet
  const { address: walletAddress } = useAccountWallet();

  // Get destination token data
  const { data: dstTokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  // Get token list for source chain
  const { data: tokenList, isLoading: isLoadingTokens } = useAnyspendTokenList(selectedSrcChainId, tokenSearchQuery);

  // Set default source token to destination token (same-chain, no swap needed)
  useEffect(() => {
    if (!selectedSrcToken && tokenList && tokenList.length > 0) {
      // Try to find the destination token in the list
      const dstToken = tokenList.find(
        (t: components["schemas"]["Token"]) =>
          t.address.toLowerCase() === destinationTokenAddress.toLowerCase() && t.chainId === destinationTokenChainId,
      );
      if (dstToken) {
        setSelectedSrcToken(dstToken);
      } else {
        // Default to first token
        setSelectedSrcToken(tokenList[0]);
      }
    }
  }, [tokenList, selectedSrcToken, destinationTokenAddress, destinationTokenChainId]);

  // Compute source amount from destination amount using quote
  const isSameToken =
    selectedSrcToken &&
    selectedSrcToken.address.toLowerCase() === destinationTokenAddress.toLowerCase() &&
    selectedSrcToken.chainId === destinationTokenChainId;

  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote({
    type: "swap",
    srcChain: selectedSrcChainId,
    dstChain: destinationTokenChainId,
    srcTokenAddress: selectedSrcToken?.address || "",
    dstTokenAddress: destinationTokenAddress,
    tradeType: "EXACT_OUTPUT",
    amount: totalAmount,
  });

  // Get balance
  const tokenAddress = selectedSrcToken ? (isNativeToken(selectedSrcToken.address) ? "native" : selectedSrcToken.address) : undefined;
  const { data: balanceData } = useSimTokenBalance(walletAddress, tokenAddress, selectedSrcChainId);

  const balance = useMemo(() => {
    const b = balanceData?.balances?.[0];
    if (!b?.amount) return { raw: BigInt(0), formatted: "0", decimals: 18 };
    return {
      raw: BigInt(b.amount),
      formatted: formatTokenAmount(BigInt(b.amount), b.decimals),
      decimals: b.decimals,
    };
  }, [balanceData]);

  // Determine the amount to pay in source token
  const srcAmount = useMemo(() => {
    if (isSameToken) return totalAmount;
    return anyspendQuote?.data?.currencyIn?.amount || "0";
  }, [isSameToken, totalAmount, anyspendQuote]);

  const srcAmountFormatted = useMemo(() => {
    if (!selectedSrcToken) return "0";
    const decimals = selectedSrcToken.decimals || 18;
    return formatTokenAmount(BigInt(srcAmount || "0"), decimals);
  }, [srcAmount, selectedSrcToken]);


  // Check if user has enough balance
  const hasEnoughBalance = balance.raw >= BigInt(srcAmount || "0");

  // Create order
  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: (data: any) => {
      onSuccess?.({ orderId: data?.id, txHash: data?.txHash });
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const handlePay = useCallback(() => {
    if (!selectedSrcToken || !walletAddress) return;

    const dstToken: components["schemas"]["Token"] = {
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: dstTokenData?.decimals || 18,
      symbol: dstTokenData?.symbol || "",
      name: dstTokenData?.name || "",
      metadata: {
        logoURI: dstTokenData?.logoURI || "",
      },
    };

    createOrder({
      recipientAddress,
      orderType: "swap",
      srcChain: selectedSrcChainId,
      dstChain: destinationTokenChainId,
      srcToken: selectedSrcToken,
      dstToken,
      srcAmount,
      expectedDstAmount: totalAmount,
    });
  }, [
    selectedSrcToken,
    walletAddress,
    recipientAddress,
    selectedSrcChainId,
    destinationTokenChainId,
    destinationTokenAddress,
    dstTokenData,
    srcAmount,
    totalAmount,
    createOrder,
  ]);

  const handleSelectToken = (token: components["schemas"]["Token"]) => {
    setSelectedSrcToken(token);
    setSelectedSrcChainId(token.chainId);
    setShowTokenSelector(false);
    setTokenSearchQuery("");
  };

  const isLoading = isLoadingAnyspendQuote || isLoadingTokens;
  const canPay = walletAddress && selectedSrcToken && hasEnoughBalance && !isLoading && !isCreatingOrder;

  return (
    <div className={cn("anyspend-crypto-panel flex flex-col gap-4", classes?.cryptoPanel)}>
      {/* Token Selector */}
      <div className="anyspend-token-selector relative">
        <label className="anyspend-token-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Pay with</label>
        <button
          onClick={() => setShowTokenSelector(!showTokenSelector)}
          className={cn(
            "anyspend-token-btn flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
            classes?.tokenSelector,
          )}
        >
          {selectedSrcToken ? (
            <div className="flex items-center gap-3">
              <ChainTokenIcon
                chainUrl={ALL_CHAINS[selectedSrcToken.chainId]?.logoUrl || ""}
                tokenUrl={selectedSrcToken.metadata?.logoURI}
                className="h-8 w-8"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSrcToken.symbol}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Balance: {balance.formatted}</p>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Select token</span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* Token Dropdown */}
        <AnimatePresence>
          {showTokenSelector && (
            <motion.div
              key="token-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="anyspend-token-dropdown absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="anyspend-token-search sticky top-0 z-10 border-b border-gray-100 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                <input
                  type="text"
                  value={tokenSearchQuery}
                  onChange={e => setTokenSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="anyspend-token-search-input w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  autoFocus
                />
              </div>
              {tokenList?.map((token: components["schemas"]["Token"]) => (
                <button
                  key={`${token.chainId}-${token.address}`}
                  onClick={() => handleSelectToken(token)}
                  className="anyspend-token-option flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChainTokenIcon
                    chainUrl={ALL_CHAINS[token.chainId]?.logoUrl || ""}
                    tokenUrl={token.metadata?.logoURI}
                    className="h-7 w-7"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{token.symbol}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{token.name}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quote Display */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "anyspend-quote-display rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50",
          classes?.quoteDisplay,
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">You pay</span>
          <AnimatePresence mode="wait">
            {isLoadingAnyspendQuote ? (
              <motion.div
                key="quote-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TextShimmer duration={1} className="text-sm">Fetching quote...</TextShimmer>
              </motion.div>
            ) : (
              <motion.span
                key="quote-amount"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {srcAmountFormatted} {selectedSrcToken?.symbol || ""}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Insufficient Balance Warning */}
      <AnimatePresence>
        {walletAddress && selectedSrcToken && !hasEnoughBalance && !isLoading && (
          <motion.p
            key="balance-warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="anyspend-balance-warning text-center text-sm text-red-500"
          >
            Insufficient {selectedSrcToken.symbol} balance
          </motion.p>
        )}
      </AnimatePresence>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={!canPay}
        className={cn(
          "anyspend-crypto-pay-btn w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
          canPay
            ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            : "cursor-not-allowed bg-gray-300 dark:bg-gray-600",
          classes?.payButton,
        )}
        style={themeColor && canPay ? { backgroundColor: themeColor } : undefined}
      >
        {isCreatingOrder ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : !walletAddress ? (
          "Connect Wallet to Pay"
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
