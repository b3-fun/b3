"use client";

import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendQuote";
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { useAnyspendTokenList } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendTokens";
import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend";
import { useAccountWallet, useB3Config, useModalStore, useSimTokenBalance, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Chain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { useIsMobile } from "@b3dotfun/sdk/global-account/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@b3dotfun/sdk/global-account/react/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@b3dotfun/sdk/global-account/react/components/ui/drawer";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Get wallet & modal
  const { address: walletAddress } = useAccountWallet();
  const { partnerId } = useB3Config();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

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
      <div className="anyspend-token-selector">
        <label className="anyspend-token-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Pay with</label>
        <button
          onClick={() => setShowTokenSelector(true)}
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
      </div>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        open={showTokenSelector}
        onClose={() => { setShowTokenSelector(false); setTokenSearchQuery(""); }}
        tokenList={tokenList}
        tokenSearchQuery={tokenSearchQuery}
        onSearchChange={setTokenSearchQuery}
        onSelectToken={handleSelectToken}
        selectedToken={selectedSrcToken}
      />

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

      {/* Pay / Connect Wallet Button */}
      {!walletAddress ? (
        <button
          onClick={() => {
            setB3ModalContentType({ type: "signInWithB3", showBackButton: false, chain: thirdwebB3Chain, partnerId });
            setB3ModalOpen(true);
          }}
          className={cn(
            "anyspend-crypto-pay-btn w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
            "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
            classes?.payButton,
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          Connect Wallet to Pay
        </button>
      ) : (
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
          ) : (
            buttonText
          )}
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Token Selector Modal
// -------------------------------------------------------------------

interface TokenSelectorModalProps {
  open: boolean;
  onClose: () => void;
  tokenList: components["schemas"]["Token"][] | undefined;
  tokenSearchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectToken: (token: components["schemas"]["Token"]) => void;
  selectedToken: components["schemas"]["Token"] | null;
}

function TokenSelectorModal({
  open,
  onClose,
  tokenList,
  tokenSearchQuery,
  onSearchChange,
  onSelectToken,
  selectedToken,
}: TokenSelectorModalProps) {
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const ModalComponent = isMobile ? Drawer : Dialog;
  const ModalContent = isMobile ? DrawerContent : DialogContent;
  const ModalTitle = isMobile ? DrawerTitle : DialogTitle;
  const ModalDescription = isMobile ? DrawerDescription : DialogDescription;

  return (
    <ModalComponent open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <ModalContent className="anyspend-token-modal flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-xl sm:max-h-[70dvh] dark:bg-gray-900">
        <ModalTitle className="sr-only">Select token</ModalTitle>
        <ModalDescription className="sr-only">Choose a token to pay with</ModalDescription>

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Select token</h3>
          </div>

          {/* Search */}
          <div className="anyspend-token-search border-y border-gray-100 px-5 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={tokenSearchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search tokens..."
                className="anyspend-token-search-input w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Token List */}
          <div className="anyspend-token-list flex-1 overflow-y-auto">
            {tokenList?.map((token: components["schemas"]["Token"]) => {
              const isSelected =
                selectedToken &&
                selectedToken.address.toLowerCase() === token.address.toLowerCase() &&
                selectedToken.chainId === token.chainId;

              return (
                <button
                  key={`${token.chainId}-${token.address}`}
                  onClick={() => onSelectToken(token)}
                  className={cn(
                    "anyspend-token-option flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20",
                  )}
                >
                  <ChainTokenIcon
                    chainUrl={ALL_CHAINS[token.chainId]?.logoUrl || ""}
                    tokenUrl={token.metadata?.logoURI}
                    className="h-8 w-8"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{token.symbol}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{token.name}</p>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
            {tokenList && tokenList.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No tokens found</div>
            )}
          </div>
        </div>
      </ModalContent>
    </ModalComponent>
  );
}
