"use client";

import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendQuote";
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendOrderAndTransactions";
import { useCreateDepositFirstOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useCreateDepositFirstOrder";
import { useOnOrderSuccess } from "@b3dotfun/sdk/anyspend/react/hooks/useOnOrderSuccess";
import { ALL_CHAINS, RELAY_SOLANA_MAINNET_CHAIN_ID, getAvailableChainIds } from "@b3dotfun/sdk/anyspend";
import { getPaymentUrl } from "@b3dotfun/sdk/anyspend/utils/chain";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import {
  useAccountWallet,
  useB3Config,
  useIsMobile,
  useModalStore,
  useSimTokenBalance,
  useTokenData,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { ShinyButton, TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Chain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { Check, ChevronDown, ChevronsUpDown, Copy, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { encodeFunctionData, erc20Abi } from "viem";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TokenSelector } from "@relayprotocol/relay-kit-ui";
import { ChainTokenIcon } from "../common/ChainTokenIcon";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CryptoPayPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  buttonText?: string;
  themeColor?: string;
  /** @deprecated Use onOrderCreated instead. Kept for backward compatibility. */
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  /** Called when an order is created and payment committed — triggers lifecycle tracking in parent */
  onOrderCreated?: (orderId: string) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
  /** Optional sender address for pre-fetching balances. Falls back to connected wallet. */
  senderAddress?: string;
}

export function CryptoPayPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  buttonText = "Pay",
  themeColor,
  onSuccess,
  onOrderCreated,
  onError,
  callbackMetadata,
  classes,
  senderAddress,
}: CryptoPayPanelProps) {
  // Stable refs for callback props to avoid re-triggering effects
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onOrderCreatedRef = useRef(onOrderCreated);
  onOrderCreatedRef.current = onOrderCreated;

  /* ------------------------------------------------------------------ */
  /* Shared state: token selection, quote, balance                      */
  /* ------------------------------------------------------------------ */
  const [selectedSrcChainId, setSelectedSrcChainId] = useState(destinationTokenChainId);
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"] | null>(null);
  const [copied, setCopied] = useState(false);

  const { address: walletAddress } = useAccountWallet();
  const effectiveAddress = senderAddress || walletAddress;
  const { partnerId } = useB3Config();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const { data: dstTokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  // Default to destination token data once available
  useEffect(() => {
    if (!selectedSrcToken && dstTokenData) {
      setSelectedSrcToken({
        address: destinationTokenAddress,
        chainId: destinationTokenChainId,
        decimals: dstTokenData.decimals || 18,
        symbol: dstTokenData.symbol || "",
        name: dstTokenData.name || "",
        metadata: { logoURI: dstTokenData.logoURI || "" },
      });
    }
  }, [selectedSrcToken, dstTokenData, destinationTokenAddress, destinationTokenChainId]);

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

  const tokenAddress = selectedSrcToken
    ? isNativeToken(selectedSrcToken.address)
      ? "native"
      : selectedSrcToken.address
    : undefined;
  const { data: balanceData } = useSimTokenBalance(effectiveAddress, tokenAddress, selectedSrcChainId);

  const balance = useMemo(() => {
    const b = balanceData?.balances?.[0];
    if (!b?.amount) return { raw: BigInt(0), formatted: "0", decimals: 18 };
    return { raw: BigInt(b.amount), formatted: formatTokenAmount(BigInt(b.amount), b.decimals), decimals: b.decimals };
  }, [balanceData]);

  const srcAmount = useMemo(() => {
    if (isSameToken) return totalAmount;
    return anyspendQuote?.data?.currencyIn?.amount || "0";
  }, [isSameToken, totalAmount, anyspendQuote]);

  const srcAmountFormatted = useMemo(() => {
    if (!selectedSrcToken) return "0";
    return formatTokenAmount(BigInt(srcAmount || "0"), selectedSrcToken.decimals || 18);
  }, [srcAmount, selectedSrcToken]);

  const hasEnoughBalance = balance.raw >= BigInt(srcAmount || "0");

  /* ------------------------------------------------------------------ */
  /* Destination token object (shared by both flows)                    */
  /* ------------------------------------------------------------------ */
  const dstToken: components["schemas"]["Token"] = useMemo(
    () => ({
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: dstTokenData?.decimals || 18,
      symbol: dstTokenData?.symbol || "",
      name: dstTokenData?.name || "",
      metadata: { logoURI: dstTokenData?.logoURI || "" },
    }),
    [destinationTokenAddress, destinationTokenChainId, dstTokenData],
  );

  /* ------------------------------------------------------------------ */
  /* QR / deposit-first order (always created for QR display)           */
  /* ------------------------------------------------------------------ */
  const [qrOrderId, setQrOrderId] = useState<string | undefined>();
  const [globalAddress, setGlobalAddress] = useState<string | undefined>();
  const qrOrderCreatedRef = useRef(false);

  const { createOrder: createDepositOrder, isCreatingOrder: isCreatingQrOrder } = useCreateDepositFirstOrder({
    onSuccess: data => {
      setQrOrderId(data.data?.id);
      setGlobalAddress(data.data?.globalAddress);
    },
    onError: (error: Error) => {
      qrOrderCreatedRef.current = false;
      onErrorRef.current?.(error);
    },
  });

  // Create deposit-first order on mount and when token changes
  useEffect(() => {
    if (qrOrderCreatedRef.current) return;
    if (!selectedSrcToken) return;
    qrOrderCreatedRef.current = true;
    createDepositOrder({
      recipientAddress,
      srcChain: selectedSrcChainId,
      dstChain: destinationTokenChainId,
      srcToken: selectedSrcToken,
      dstToken,
      callbackMetadata,
      creatorAddress: effectiveAddress,
    });
  }, [
    selectedSrcToken,
    selectedSrcChainId,
    recipientAddress,
    destinationTokenChainId,
    dstToken,
    callbackMetadata,
    createDepositOrder,
    effectiveAddress,
  ]);

  const { orderAndTransactions: qrOat } = useAnyspendOrderAndTransactions(qrOrderId);
  useOnOrderSuccess({
    orderData: qrOat,
    orderId: qrOrderId,
    onSuccess: (txHash?: string) => onSuccess?.({ orderId: qrOrderId, txHash }),
  });

  // Notify parent when a deposit is detected on the QR/deposit-first order
  const qrDepositNotifiedRef = useRef(false);
  useEffect(() => {
    if (
      qrOrderId &&
      !qrDepositNotifiedRef.current &&
      qrOat?.data?.depositTxs?.length &&
      qrOat.data.depositTxs.length > 0
    ) {
      qrDepositNotifiedRef.current = true;
      onOrderCreatedRef.current?.(qrOrderId);
    }
  }, [qrOrderId, qrOat?.data?.depositTxs?.length]);

  // QR code value
  const qrAmount = srcAmount && srcAmount !== "0" ? BigInt(srcAmount) : undefined;
  const qrValue =
    globalAddress && selectedSrcToken
      ? getPaymentUrl(
          globalAddress,
          qrAmount,
          isNativeToken(selectedSrcToken.address) ? "ETH" : selectedSrcToken.address,
          selectedSrcChainId,
          selectedSrcToken.decimals,
        )
      : "";

  /* ------------------------------------------------------------------ */
  /* Wallet / swap order (created on button click)                      */
  /* ------------------------------------------------------------------ */
  const [walletOrderId, setWalletOrderId] = useState<string | undefined>();
  const [isSendingDeposit, setIsSendingDeposit] = useState(false);
  const [depositRejected, setDepositRejected] = useState(false);
  const depositSentRef = useRef(false);
  const { switchChainAndExecute } = useUnifiedChainSwitchAndExecute();

  const { createOrder: createSwapOrder, isCreatingOrder: isCreatingSwapOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      const id = data.data?.id;
      if (id) setWalletOrderId(id);
    },
    onError: (error: Error) => {
      setIsSendingDeposit(false);
      onErrorRef.current?.(error);
    },
  });

  const { orderAndTransactions: walletOat } = useAnyspendOrderAndTransactions(walletOrderId);

  // Auto-send deposit tx once swap order is ready
  useEffect(() => {
    if (!walletOat?.data?.order || depositSentRef.current || depositRejected) return;
    const order = walletOat.data.order;
    if (order.status !== "scanning_deposit_transaction") return;
    if (walletOat.data.depositTxs?.length) return;
    depositSentRef.current = true;

    const sendDeposit = async () => {
      try {
        setIsSendingDeposit(true);
        const amount = BigInt(order.srcAmount);
        if (isNativeToken(order.srcTokenAddress)) {
          await switchChainAndExecute(order.srcChain, {
            to: order.globalAddress as `0x${string}`,
            value: amount,
          });
        } else {
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [order.globalAddress as `0x${string}`, amount],
          });
          await switchChainAndExecute(order.srcChain, {
            to: order.srcTokenAddress as `0x${string}`,
            data,
            value: BigInt(0),
          });
        }
        // Deposit sent — notify parent to transition to order lifecycle tracking
        if (walletOrderId) {
          onOrderCreatedRef.current?.(walletOrderId);
        }
      } catch (error: any) {
        depositSentRef.current = false;
        const isUserRejection =
          error?.code === 4001 || error?.message?.includes("rejected") || error?.message?.includes("denied");
        if (isUserRejection) {
          setDepositRejected(true);
        }
        onErrorRef.current?.(error instanceof Error ? error : new Error(error?.message || "Transaction rejected"));
      } finally {
        setIsSendingDeposit(false);
      }
    };
    sendDeposit();
  }, [walletOat, switchChainAndExecute, walletOrderId, depositRejected]);

  useOnOrderSuccess({
    orderData: walletOat,
    orderId: walletOrderId,
    onSuccess: (txHash?: string) => onSuccess?.({ orderId: walletOrderId, txHash }),
  });

  const isWaitingForExecution = !!walletOrderId && walletOat?.data?.order.status !== "executed";

  const handleWalletPay = useCallback(() => {
    if (!selectedSrcToken || !walletAddress) return;
    depositSentRef.current = false;
    createSwapOrder({
      recipientAddress,
      orderType: "swap",
      srcChain: selectedSrcChainId,
      dstChain: destinationTokenChainId,
      srcToken: selectedSrcToken,
      dstToken,
      srcAmount,
      expectedDstAmount: totalAmount,
      callbackMetadata,
      creatorAddress: effectiveAddress,
    });
  }, [
    selectedSrcToken,
    walletAddress,
    effectiveAddress,
    recipientAddress,
    selectedSrcChainId,
    destinationTokenChainId,
    dstToken,
    srcAmount,
    totalAmount,
    callbackMetadata,
    createSwapOrder,
  ]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */
  const handleSelectToken = (token: components["schemas"]["Token"]) => {
    setSelectedSrcToken(token);
    setSelectedSrcChainId(token.chainId);
    // Reset both order flows
    setQrOrderId(undefined);
    setGlobalAddress(undefined);
    qrOrderCreatedRef.current = false;
    qrDepositNotifiedRef.current = false;
    setWalletOrderId(undefined);
    depositSentRef.current = false;
  };

  const handleCopyAddress = async () => {
    if (globalAddress) {
      await navigator.clipboard.writeText(globalAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectWallet = () => {
    setB3ModalContentType({ type: "signInWithB3", showBackButton: false, chain: thirdwebB3Chain, partnerId });
    setB3ModalOpen(true);
  };

  const isLoading = isLoadingAnyspendQuote;
  const isPending = isCreatingSwapOrder || isSendingDeposit || isWaitingForExecution;
  const canPay = walletAddress && selectedSrcToken && hasEnoughBalance && !isLoading && !isPending;

  const chainName = ALL_CHAINS[selectedSrcChainId]?.name || "the specified chain";
  const chainLogoUrl = ALL_CHAINS[selectedSrcChainId]?.logoUrl;

  // Collapse QR on mobile when a wallet connector is available
  const isMobile = useIsMobile();
  const hasWalletConnector = typeof window !== "undefined" && !!(window as any).ethereum;
  const [qrExpanded, setQrExpanded] = useState(!isMobile || !hasWalletConnector);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className={cn("anyspend-crypto-pay-panel flex flex-col gap-4", classes?.cryptoPanel)}>
      {/* ---- Token Selector (Relay SDK) ---- */}
      <div className="anyspend-token-selector">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Pay with</label>
        <TokenSelector
          address={effectiveAddress}
          chainIdsFilter={getAvailableChainIds("from")}
          context="from"
          fromChainWalletVMSupported={true}
          isValidAddress={true}
          lockedChainIds={getAvailableChainIds("from")}
          multiWalletSupportEnabled={true}
          onAnalyticEvent={undefined}
          popularChainIds={[1, 8453, RELAY_SOLANA_MAINNET_CHAIN_ID]}
          setToken={token => {
            handleSelectToken({
              address: token.address,
              chainId: token.chainId,
              decimals: token.decimals,
              metadata: { logoURI: token.logoURI },
              name: token.name,
              symbol: token.symbol,
            });
          }}
          supportedWalletVMs={["evm", "svm"]}
          token={undefined}
          trigger={
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
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
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            </button>
          }
        />
      </div>

      {/* ---- Quote ---- */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50",
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
                <TextShimmer duration={1} className="text-sm">
                  Fetching quote...
                </TextShimmer>
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

      {/* ---- Insufficient balance warning ---- */}
      <AnimatePresence>
        {walletAddress && selectedSrcToken && !hasEnoughBalance && !isLoading && (
          <motion.p
            key="balance-warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-center text-sm text-red-500"
          >
            Insufficient {selectedSrcToken.symbol} balance
          </motion.p>
        )}
      </AnimatePresence>

      {/* ---- Wallet Pay Button ---- */}
      {!walletAddress ? (
        <ShinyButton
          accentColor={themeColor || "hsl(var(--as-brand))"}
          onClick={handleConnectWallet}
          className={cn("w-full", classes?.payButton)}
          textClassName="text-white"
        >
          Connect Wallet to Pay
        </ShinyButton>
      ) : (
        <ShinyButton
          accentColor={themeColor || "hsl(var(--as-brand))"}
          onClick={handleWalletPay}
          disabled={!canPay}
          className={cn("w-full", classes?.payButton)}
          textClassName={cn(!canPay ? "text-as-secondary" : "text-white")}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isCreatingSwapOrder
                ? "Creating order..."
                : isSendingDeposit
                  ? "Confirm in wallet..."
                  : "Confirming transaction..."}
            </span>
          ) : (
            buttonText
          )}
        </ShinyButton>
      )}

      {/* ---- "or" divider / accordion toggle ---- */}
      {isMobile && hasWalletConnector ? (
        <button
          type="button"
          onClick={() => setQrExpanded(prev => !prev)}
          className="flex w-full items-center gap-3 py-1"
        >
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
            {qrExpanded ? (
              "or send directly"
            ) : (
              <>
                <QrCode className="h-3 w-3" /> or send with QR code
              </>
            )}
            <ChevronDown className={cn("h-3 w-3 transition-transform", qrExpanded && "rotate-180")} />
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </button>
      ) : (
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">or send directly</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* ---- QR + Deposit Section ---- */}
      <AnimatePresence initial={false}>
        {qrExpanded && (
          <motion.div
            key="qr-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {isCreatingQrOrder && !globalAddress ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Creating deposit address...</span>
              </div>
            ) : globalAddress ? (
              <div className="flex items-center gap-4">
                {/* QR Code — left */}
                <div className="shrink-0 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-gray-100 dark:bg-white dark:ring-gray-200">
                  <QRCodeSVG value={qrValue} size={132} level="M" marginSize={0} />
                </div>

                {/* Info — right */}
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  {/* Instruction label */}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {srcAmountFormatted} {selectedSrcToken?.symbol}
                    </span>{" "}
                    on{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {chainLogoUrl && (
                        <img
                          src={chainLogoUrl}
                          alt=""
                          className="mb-px mr-0.5 inline h-3.5 w-3.5 rounded-full align-text-bottom"
                        />
                      )}
                      {chainName}
                    </span>{" "}
                    to:
                  </p>

                  {/* Address with copy */}
                  <button
                    onClick={handleCopyAddress}
                    className="group flex items-start gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <span className="min-w-0 break-all font-mono text-xs leading-relaxed text-gray-800 dark:text-gray-200">
                      {globalAddress}
                    </span>
                    <span className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  {/* Warning */}
                  <p className="text-xs leading-snug text-orange-500/80 dark:text-orange-400/80">
                    Only send {selectedSrcToken?.symbol} on{" "}
                    {chainLogoUrl && (
                      <img src={chainLogoUrl} alt="" className="mr-0.5 inline h-3 w-3 rounded-full align-text-bottom" />
                    )}
                    {chainName}. Sending other tokens or using a different network may result in loss of funds.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
