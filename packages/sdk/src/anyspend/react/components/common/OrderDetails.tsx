"use client";

import {
  ALL_CHAINS,
  getChainName,
  getErrorDisplay,
  getExplorerTxUrl,
  getPaymentUrl,
  getStatusDisplay,
  isNativeToken,
  RELAY_SOLANA_MAINNET_CHAIN_ID,
  ZERO_ADDRESS,
} from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import {
  Badge,
  Button,
  CopyToClipboard,
  ShinyButton,
  Skeleton,
  TextLoop,
  TextShimmer,
  useAccountWallet,
  useB3,
  useModalStore,
  useProfile,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { useRouter, useSearchParams } from "@b3dotfun/sdk/shared/react/hooks";
import { cn } from "@b3dotfun/sdk/shared/utils";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";

import { toast } from "@b3dotfun/sdk/global-account/react";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust, WalletWalletConnect } from "@web3icons/react";
import { CheckIcon, ChevronRight, Copy, ExternalLink, Home, Loader2, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimeAgo from "react-timeago";

import { encodeFunctionData, erc20Abi } from "viem";
import { b3 } from "viem/chains";
import { useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import { usePhantomTransfer } from "../../hooks/usePhantomTransfer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./Accordion";
import ConnectWalletPayment from "./ConnectWalletPayment";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { InsufficientDepositPayment } from "./InsufficientDepositPayment";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";
import { OrderStatus } from "./OrderStatus";
import PaymentVendorUI from "./PaymentVendorUI";
import { TransferCryptoDetails } from "./TransferCryptoDetails";

interface OrderDetailsProps {
  mode?: "modal" | "page";
  order: components["schemas"]["Order"];
  depositTxs: components["schemas"]["DepositTx"][];
  relayTxs: components["schemas"]["RelayTx"][];
  executeTx: components["schemas"]["ExecuteTx"] | null;
  refundTxs: components["schemas"]["RefundTx"][];
  cryptoPaymentMethod?: CryptoPaymentMethodType; // Now optional since we read from URL
  selectedCryptoPaymentMethod?: CryptoPaymentMethodType; // For OrderStatus integration
  onPaymentMethodChange?: (method: CryptoPaymentMethodType) => void; // Callback for payment method switching
  onBack?: () => void;
  disableUrlParamManagement?: boolean; // When true, will not modify URL parameters
  points?: number | undefined; // Points earned from the transaction
}

// Add this helper function near the top or just above the component
function getOrderSuccessText({
  order,
  tournament,
  formattedActualDstAmount,
  formattedExpectedDstAmount,
  dstToken,
  recipientName,
  centerTruncate,
}: {
  order: components["schemas"]["Order"];
  tournament?: any;
  formattedActualDstAmount?: string;
  formattedExpectedDstAmount?: string;
  dstToken: any;
  recipientName?: string;
  centerTruncate: (address: string, n: number) => string;
}) {
  const recipient = recipientName || centerTruncate(order.recipientAddress, 8);

  let actionText = "";
  switch (order.type) {
    case "swap":
      actionText = `sent ${formattedActualDstAmount || "--"} ${dstToken.symbol}`;
      return `Successfully ${actionText} to ${recipient}`;
    case "mint_nft":
      actionText = `minted ${order.metadata.nft.name}`;
      return `Successfully ${actionText} to ${recipient}`;
    case "join_tournament":
      actionText = `joined ${tournament?.name}`;
      return `Successfully ${actionText} for ${recipient}`;
    case "fund_tournament":
      actionText = `funded ${tournament?.name}`;
      return `Successfully ${actionText}`;
    case "hype_duel":
      actionText = `deposited ${formattedExpectedDstAmount || "--"} HYPE`;
      return `Successfully ${actionText} to ${recipient}`;
    case "custom":
      actionText = order.metadata.action || `executed contract`;
      return `Successfully ${actionText}`;
    case "x402_swap":
      actionText = `sent ${formattedActualDstAmount || "--"} ${dstToken.symbol}`;
      return `Successfully ${actionText} to ${recipient}`;
    case "custom_exact_in":
      actionText = `executed contract`;
      return `Successfully ${actionText}`;
    default:
      throw new Error("Invalid order type");
  }
}

/**
 * Rounds a token amount to 6 significant digits after the first non-zero in the decimal part.
 * Always rounds up (not standard rounding) if there are more than 6 significant digits.
 * For example:
 *    0.000123456 -> 0.000123456 (unchanged, as it has 6 significant digits)
 *    0.0001234561 -> 0.000123457 (rounded up to 6 significant digits)
 *    0.0001234564 -> 0.000123457 (always rounded up, even if digit < 5)
 *    1,234,567.000123456789 -> 1,234,567.000123457 (decimal part rounded up to 6 sig digits)
 *    1,234,567.000123123123 -> 1,234,567.000123124 (decimal part rounded up to 6 sig digits)
 * @param amount The amount value as a string
 * @returns The rounded amount string
 */
function roundTokenAmount(amount: string | undefined): string | undefined {
  if (!amount) {
    return undefined;
  }

  // Split the number into whole and decimal parts
  const parts = amount.split(".");
  if (parts.length === 1) {
    // No decimal part
    return amount;
  }

  const wholePart = parts[0];
  const decimalPart = parts[1];

  // Check if decimal has 6 or fewer significant digits
  if (decimalPart.length <= 6) {
    return amount;
  }

  // Find the position of the first non-zero digit in the decimal part
  let firstNonZeroPos = 0;
  while (firstNonZeroPos < decimalPart.length && decimalPart[firstNonZeroPos] === "0") {
    firstNonZeroPos++;
  }

  // Calculate how many significant digits we have after the first non-zero
  const significantDigitsAfterFirstNonZero = decimalPart.length - firstNonZeroPos;

  // If we have 6 or fewer significant digits, return as is
  if (significantDigitsAfterFirstNonZero <= 6) {
    return amount;
  }

  // We need to round to 6 significant digits after the first non-zero
  // Keep all leading zeros plus 6 significant digits
  const keepLength = firstNonZeroPos + 6;

  // Always round up if there are more digits
  const shouldRoundUp = decimalPart.length > keepLength;

  // Create array of digits we're keeping (to handle carry)
  const digits = decimalPart.substring(0, keepLength).split("");

  // Apply rounding (always round up)
  if (shouldRoundUp) {
    // Start from the last position and carry as needed
    let i = digits.length - 1;
    let carry = 1;

    while (i >= 0 && carry > 0) {
      const digit = parseInt(digits[i], 10) + carry;
      if (digit === 10) {
        digits[i] = "0";
        carry = 1;
      } else {
        digits[i] = digit.toString();
        carry = 0;
      }
      i--;
    }

    // Handle carry into the whole part if needed
    if (carry > 0) {
      return `${(parseInt(wholePart, 10) + 1).toString()}.${digits.join("")}`;
    }
  }

  // Join the parts back together
  const roundedDecimalPart = digits.join("");
  return `${wholePart}.${roundedDecimalPart}`;
}

export const OrderDetails = memo(function OrderDetails({
  mode = "modal",
  order,
  depositTxs,
  relayTxs,
  executeTx,
  refundTxs,
  cryptoPaymentMethod,
  selectedCryptoPaymentMethod,
  onPaymentMethodChange,
  onBack,
  disableUrlParamManagement = false,
  points,
}: OrderDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get theme from B3Provider context
  const { theme } = useB3();
  const colorMode = theme || "light";

  // Read crypto payment method from URL parameters
  const cryptoPaymentMethodFromUrl = searchParams.get("cryptoPaymentMethod") as CryptoPaymentMethodType | null;
  const effectiveCryptoPaymentMethod =
    selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE
      ? selectedCryptoPaymentMethod
      : cryptoPaymentMethod || cryptoPaymentMethodFromUrl || CryptoPaymentMethodType.NONE;

  const setB3ModalOpen = useModalStore((state: any) => state.setB3ModalOpen);

  const srcToken = order.metadata.srcToken;
  const dstToken = order.metadata.dstToken;
  const nft = order.type === "mint_nft" ? order.metadata.nft : undefined;
  const tournament =
    order.type === "join_tournament" || order.type === "fund_tournament" ? order.metadata.tournament : undefined;

  const profile = useProfile({ address: order.recipientAddress });
  const recipientName = profile.data?.name?.replace(/\.b3\.fun/g, "");

  const account = useAccountWallet();

  const { data: walletClient } = useWalletClient();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [showQRCode, setShowQRCode] = useState(false);
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { switchChainAndExecuteWithEOA, switchChainAndExecute, isSwitchingOrExecuting } =
    useUnifiedChainSwitchAndExecute();

  // Track if auto-payment was attempted to avoid re-triggering
  const autoPaymentAttempted = useRef(false);
  // Track if component is ready for auto-payment (all data loaded)
  const [isComponentReady, setIsComponentReady] = useState(false);

  const roundedUpSrcAmount = useMemo(() => {
    // Display the full transfer amount without rounding since users need to see the exact value they're transferring.
    // Use 21 significant digits (max allowed by Intl.NumberFormat)
    const formattedSrcAmount = srcToken
      ? formatTokenAmount(BigInt(order.srcAmount), srcToken.decimals, 21, false)
      : undefined;

    return roundTokenAmount(formattedSrcAmount);
  }, [order.srcAmount, srcToken]);

  // Calculate deposit amounts - moved here to be used in useCallback hooks
  const depositedAmount = useMemo(() => {
    return depositTxs ? depositTxs.reduce((acc, curr) => acc + BigInt(curr.amount), BigInt(0)) : BigInt(0);
  }, [depositTxs]);

  const depositDeficit = useMemo(() => {
    return BigInt(order.srcAmount) - depositedAmount;
  }, [order.srcAmount, depositedAmount]);

  const depositEnoughAmount = useMemo(() => {
    return depositDeficit <= BigInt(0);
  }, [depositDeficit]);

  const formattedDepositDeficit = useMemo(() => {
    return formatTokenAmount(BigInt(depositDeficit), srcToken.decimals);
  }, [depositDeficit, srcToken.decimals]);

  // Unified payment handler for both EOA and AA wallets
  const handleUnifiedPaymentProcess = useCallback(async () => {
    let txData: `0x${string}` | undefined;
    let value: bigint;
    let to: `0x${string}`;

    // Use the existing depositDeficit calculation to determine amount to send
    const amountToSend = depositDeficit > BigInt(0) ? depositDeficit : BigInt(order.srcAmount);

    if (isNativeToken(order.srcTokenAddress)) {
      // Native token transfer
      to = order.globalAddress as `0x${string}`;
      value = amountToSend;
    } else {
      // ERC20 token transfer - encode the transfer function call using proper ABI
      txData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [order.globalAddress as `0x${string}`, amountToSend],
      });
      to = order.srcTokenAddress as `0x${string}`;
      value = BigInt(0);
    }

    // Use appropriate execution method based on payment method
    let txHash: string | undefined;
    if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET) {
      txHash = await switchChainAndExecute(order.srcChain, { to, data: txData, value });
    } else {
      txHash = await switchChainAndExecuteWithEOA(order.srcChain, { to, data: txData, value });
    }

    if (txHash) {
      setTxHash(txHash as `0x${string}`);
    }
  }, [order, switchChainAndExecuteWithEOA, switchChainAndExecute, depositDeficit, effectiveCryptoPaymentMethod]);

  // Use Phantom transfer hook for Solana payments
  const { initiateTransfer: initiatePhantomTransfer, getConnectedAddress: getPhantomAddress } = usePhantomTransfer();

  // Main payment handler that triggers chain switch and payment
  const handlePayment = useCallback(async () => {
    console.log("Initiating payment process. Target chain:", order.srcChain, "Current chain:", walletClient?.chain?.id);
    const amountToSend = depositDeficit > BigInt(0) ? depositDeficit.toString() : order.srcAmount;
    if (order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID) {
      // Solana payment flow
      await initiatePhantomTransfer({
        amountLamports: amountToSend,
        tokenAddress: order.srcTokenAddress,
        recipientAddress: order.globalAddress,
      });
    } else {
      // EVM payment flow (EOA and AA wallets)
      // Note: Hyperliquid is NOT supported as source chain, only as destination chain
      await handleUnifiedPaymentProcess();
    }
  }, [order, walletClient?.chain?.id, depositDeficit, handleUnifiedPaymentProcess, initiatePhantomTransfer]);

  // When waitingForDeposit is true, we show a message to the user to wait for the deposit to be processed.
  const setWaitingForDeposit = useCallback(() => {
    if (disableUrlParamManagement) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("waitingForDeposit", "true");
    router.push(`?${params}`);
  }, [router, searchParams, disableUrlParamManagement]);

  // Clean up URL parameters before closing modal or navigating back
  const cleanupUrlParams = useCallback(() => {
    if (disableUrlParamManagement) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("waitingForDeposit");
    params.delete("orderId");
    params.delete("paymentMethod");

    // Only update URL if params were actually removed
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params}`);
    }
  }, [router, searchParams, disableUrlParamManagement]);

  // Helper functions that clean up URL params before executing actions
  const handleCloseModal = useCallback(() => {
    cleanupUrlParams();
    setB3ModalOpen(false);
  }, [cleanupUrlParams, setB3ModalOpen]);

  const handleBack = useCallback(() => {
    cleanupUrlParams();
    onBack?.();
  }, [cleanupUrlParams, onBack]);

  useEffect(() => {
    if (txSuccess) {
      toast.success("Transaction successful! We are processing your order.", { duration: 10000 });
      setWaitingForDeposit();
      setTxHash(undefined);
    }
  }, [setWaitingForDeposit, txSuccess]);

  // Get connected Phantom wallet address if available
  const phantomWalletAddress = useMemo(() => getPhantomAddress(), [getPhantomAddress]);

  // Calculate status display before using it
  const { text: statusText, status: statusDisplay } = getStatusDisplay(order);

  // Memoize the payable state calculation to avoid recalculating on every render
  const isPayableState = useMemo(() => {
    const waitingForDeposit = new URLSearchParams(window.location.search).get("waitingForDeposit") === "true";

    return (
      refundTxs.length === 0 &&
      !executeTx &&
      !(relayTxs.length > 0 && relayTxs.every(tx => tx.status === "success")) &&
      !depositTxs?.length &&
      !waitingForDeposit &&
      statusDisplay === "processing" &&
      !order.onrampMetadata &&
      (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
        effectiveCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET)
    );
  }, [
    refundTxs.length,
    executeTx,
    relayTxs,
    depositTxs?.length,
    statusDisplay,
    order.onrampMetadata,
    effectiveCryptoPaymentMethod,
  ]);

  // Mark component as ready once all critical data is available
  // This ensures we don't trigger payment before the component has fully initialized
  useEffect(() => {
    if (!isComponentReady && srcToken && dstToken && statusDisplay) {
      setIsComponentReady(true);
    }
  }, [isComponentReady, srcToken, dstToken, statusDisplay]);

  // Auto-trigger payment when component is ready and order is in payable state
  // This effect only runs when isPayableState or isComponentReady changes
  useEffect(() => {
    // Only trigger payment if:
    // 1. We haven't attempted payment yet
    // 2. Component is fully ready (all data loaded)
    // 3. Order is in a payable state
    if (!autoPaymentAttempted.current && isComponentReady && isPayableState) {
      autoPaymentAttempted.current = true;
      handlePayment();
    }
  }, [isPayableState, isComponentReady, handlePayment]);

  if (!srcToken || !dstToken) {
    return <div>Loading...</div>;
  }

  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? "0"
      : order.payload.expectedDstAmount.toString();
  const formattedExpectedDstAmount = formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);

  const actualDstAmount = order.settlement?.actualDstAmount;
  const formattedActualDstAmount = actualDstAmount
    ? formatTokenAmount(BigInt(actualDstAmount), dstToken.decimals)
    : undefined;

  if (refundTxs.length > 0) {
    return (
      <>
        <OrderStatus order={order} selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod} />
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points}
        />
        <Accordion type="single" collapsible className="order-details-accordion w-full">
          <AccordionItem value="refund-details" className="order-details-refund-item">
            <AccordionTrigger className="accordion-trigger">Transaction Details</AccordionTrigger>
            <AccordionContent className="accordion-content pl-2">
              <div className="relative flex w-full flex-col gap-4">
                <div className="bg-as-surface-secondary absolute bottom-2 left-4 top-2 z-[5] w-2">
                  <motion.div
                    className="bg-as-border-primary absolute left-[2px] top-0 z-10 w-[3px]"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  ></motion.div>
                </div>
                {depositTxs
                  ? depositTxs.map(dTx => (
                      <TransactionDetails
                        key={dTx.txHash}
                        title={
                          order.onrampMetadata?.vendor === "stripe-web2"
                            ? `Received payment`
                            : `Received ${formatTokenAmount(BigInt(dTx.amount), srcToken.decimals)} ${srcToken.symbol}`
                        }
                        chainId={order.srcChain}
                        tx={dTx}
                        isProcessing={false}
                      />
                    ))
                  : null}
                {refundTxs
                  ? refundTxs.map(rTx => (
                      <TransactionDetails
                        key={rTx.txHash}
                        title={`Refunded ${formatTokenAmount(BigInt(rTx.amount), srcToken.decimals)} ${srcToken.symbol}`}
                        chainId={order.srcChain}
                        tx={rTx}
                        isProcessing={false}
                      />
                    ))
                  : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {order.errorDetails && (
          <div className="flex justify-center">
            <span className="text-as-primary/50 text-center text-sm" style={{ maxWidth: "40ch" }}>
              {getErrorDisplay(order.errorDetails)}
            </span>
          </div>
        )}
        <button
          className="order-close-button order-details-close-btn bg-as-brand flex w-full items-center justify-center gap-2 rounded-lg p-2 font-semibold text-white"
          onClick={mode === "page" ? handleBack : handleCloseModal}
        >
          {mode === "page" ? (
            <>
              Return to Home <Home className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Close"
          )}
        </button>
      </>
    );
  }

  if (executeTx) {
    return (
      <>
        <OrderStatus order={order} selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod} />
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points}
        />
        <Accordion type="single" collapsible className="order-details-accordion w-full">
          <AccordionItem value="execute-details" className="order-details-execute-item">
            <AccordionTrigger className="accordion-trigger">Transaction Details</AccordionTrigger>
            <AccordionContent className="accordion-content pl-2">
              <div className="relative flex w-full flex-col gap-4">
                <div className="bg-as-surface-secondary absolute bottom-2 left-4 top-2 z-[5] w-2">
                  <motion.div
                    className="bg-as-border-primary absolute left-[2px] top-0 z-10 w-[3px]"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  ></motion.div>
                </div>
                {depositTxs
                  ? depositTxs.map(dTxs => (
                      <TransactionDetails
                        key={dTxs.txHash}
                        title={
                          order.onrampMetadata?.vendor === "stripe-web2"
                            ? `Received payment`
                            : `Received ${formatTokenAmount(BigInt(dTxs.amount), srcToken.decimals)} ${srcToken.symbol}`
                        }
                        chainId={order.srcChain}
                        tx={dTxs}
                        isProcessing={false}
                      />
                    ))
                  : null}
                {relayTxs
                  ? relayTxs.map(relayTx => (
                      <TransactionDetails
                        key={relayTx.txHash}
                        title="Processed Transaction"
                        chainId={relayTx.chain}
                        tx={relayTx}
                        delay={0.5}
                        isProcessing={false}
                      />
                    ))
                  : null}

                <TransactionDetails
                  title={
                    order.type === "swap"
                      ? "Processed Swap"
                      : order.type === "mint_nft"
                        ? "Minted NFT"
                        : order.type === "join_tournament"
                          ? "Joined Tournament"
                          : order.type === "fund_tournament"
                            ? "Funded Tournament"
                            : "Processed Order"
                  }
                  chainId={order.dstChain}
                  tx={executeTx}
                  isProcessing={false}
                  delay={1}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex w-full flex-col gap-8">
          <Button variant="link" asChild>
            <a
              href={getExplorerTxUrl(order.dstChain, executeTx.txHash)}
              target="_blank"
              className="order-success-text text-as-primary/70 hover:text-as-primary"
              style={{ whiteSpace: "normal" }} // Don't know why but class can't override.
            >
              {getOrderSuccessText({
                order,
                tournament,
                formattedActualDstAmount: formattedActualDstAmount,
                formattedExpectedDstAmount: formattedExpectedDstAmount,
                dstToken,
                recipientName,
                centerTruncate,
              })}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {order.type === "join_tournament" && order.status === "executed" && (
          <ShinyButton
            accentColor={"hsl(var(--as-brand))"}
            textColor="text-white"
            className="flex w-full items-center gap-2"
            disabled={txLoading || isSwitchingOrExecuting}
            onClick={handleCloseModal}
          >
            <span className="pl-4">Continue to Tournament</span>
            <ChevronRight className="h-4 w-4" />
          </ShinyButton>
        )}

        {order.status === "executed" && (
          <button
            className="order-close-button order-details-close-btn bg-as-brand flex w-full items-center justify-center gap-2 rounded-lg p-2 font-semibold text-white"
            onClick={mode === "page" ? handleBack : handleCloseModal}
          >
            {mode === "page" ? (
              <>
                Return to Home <Home className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Close"
            )}
          </button>
        )}
      </>
    );
  }

  if (relayTxs.length > 0 && relayTxs.every(tx => tx.status === "success")) {
    return (
      <>
        <OrderStatus order={order} selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod} />
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points}
        />
        <Accordion type="single" collapsible className="order-details-accordion w-full">
          <AccordionItem value="more-details" className="order-details-more-item">
            <AccordionTrigger className="accordion-trigger">More Details</AccordionTrigger>
            <AccordionContent className="accordion-content pl-2">
              <div className="relative flex w-full flex-col gap-4">
                <div className="bg-as-surface-secondary absolute bottom-2 left-4 top-2 z-[5] w-2">
                  <motion.div
                    className="bg-as-border-primary absolute left-[2px] top-0 z-10 w-[3px]"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  ></motion.div>
                </div>
                {depositTxs
                  ? depositTxs.map(dTxs => (
                      <TransactionDetails
                        key={dTxs.txHash}
                        title={
                          order.onrampMetadata?.vendor === "stripe-web2"
                            ? `Received payment`
                            : `Received ${formatTokenAmount(BigInt(dTxs.amount), srcToken.decimals)} ${srcToken.symbol}`
                        }
                        chainId={order.srcChain}
                        tx={dTxs}
                        isProcessing={false}
                      />
                    ))
                  : null}
                {relayTxs.map(relayTx => (
                  <TransactionDetails
                    title="Processed Transaction"
                    chainId={relayTx.chain}
                    isProcessing={false}
                    tx={relayTx}
                    delay={0.5}
                  />
                ))}
                {order.status === "executing" && (
                  <TransactionDetails
                    title={
                      order.type === "swap" || order.type === "x402_swap"
                        ? "Processing Swap"
                        : order.type === "mint_nft"
                          ? "Minting NFT"
                          : order.type === "join_tournament"
                            ? "Joining Tournament"
                            : order.type === "fund_tournament"
                              ? "Funding Tournament"
                              : order.type === "hype_duel"
                                ? "Depositing Hype Duel"
                                : order.type === "custom" || order.type === "custom_exact_in"
                                  ? "Executing Contract"
                                  : "Processing Bridge"
                    }
                    chainId={order.dstChain}
                    isProcessing={true}
                    tx={null}
                    delay={1}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* <div className="flex w-full flex-col gap-8">
          <Button variant="link" asChild>
            <a
              href={getExplorerTxUrl(order.dstChain, relayTx.txHash)}
              target="_blank"
              className="order-success-text text-as-primary/70 hover:text-as-primary"
              style={{ whiteSpace: "normal" }}
            >
              {getOrderSuccessText({
                order,
                tournament,
                formattedActualDstAmount,
                dstToken,
                recipientName,
                centerTruncate,
              })}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div> */}

        {order.type === "join_tournament" && order.status === "executed" && (
          <ShinyButton
            accentColor={"hsl(var(--as-brand))"}
            textColor="text-white"
            className="flex w-full items-center gap-2"
            disabled={txLoading || isSwitchingOrExecuting}
            onClick={handleCloseModal}
          >
            <span className="pl-4">Continue to Tournament</span>
            <ChevronRight className="h-4 w-4" />
          </ShinyButton>
        )}

        {order.status === "executed" && (
          <button
            className="order-close-button order-details-close-btn bg-as-brand flex w-full items-center justify-center gap-2 rounded-lg p-2 font-semibold text-white"
            onClick={mode === "page" ? handleBack : handleCloseModal}
          >
            {mode === "page" ? (
              <>
                Return to Home <Home className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Close"
            )}
          </button>
        )}
      </>
    );
  }

  // This boolean indicates that user finish payment, and waiting for the deposit to be confirmed. We get this from query params (waitingForDeposit=true)
  const waitingForDeposit = new URLSearchParams(window.location.search).get("waitingForDeposit") === "true";
  if (depositTxs?.length || waitingForDeposit) {
    return (
      <>
        <OrderStatus order={order} selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod} />
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points}
        />
        <Accordion type="single" collapsible className="order-details-accordion w-full">
          <AccordionItem value="deposit-details" className="order-details-deposit-item">
            <AccordionTrigger className="accordion-trigger">Transaction Details</AccordionTrigger>
            <AccordionContent className="accordion-content pl-2">
              <div className="relative flex w-full flex-col gap-6">
                <div className="bg-as-surface-secondary absolute bottom-2 left-4 top-2 z-[5] w-2">
                  <motion.div
                    className="from-as-brand/50 absolute left-[2px] top-0 z-10 w-[3px] bg-gradient-to-b from-20% via-purple-500/50 via-80% to-transparent"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  ></motion.div>
                </div>
                {(depositTxs || []).map((dTxs, index) => (
                  <TransactionDetails
                    key={dTxs.txHash}
                    title={
                      order.onrampMetadata?.vendor === "stripe-web2"
                        ? `Received payment`
                        : `Received ${formatTokenAmount(BigInt(dTxs.amount), srcToken.decimals)} ${srcToken.symbol}`
                    }
                    chainId={order.srcChain}
                    tx={dTxs}
                    isProcessing={index < (depositTxs || []).length - 1 ? false : !depositEnoughAmount}
                  />
                ))}
                {statusDisplay === "failure" ? (
                  <TransactionDetails
                    title={statusText}
                    chainId={order.srcChain}
                    tx={null}
                    isProcessing={false}
                    delay={0.5}
                  />
                ) : depositEnoughAmount ? (
                  <TransactionDetails
                    title={
                      order.type === "swap"
                        ? "Processing Swap"
                        : order.type === "mint_nft"
                          ? "Minting NFT"
                          : order.type === "join_tournament"
                            ? "Joining Tournament"
                            : order.type === "fund_tournament"
                              ? "Funding Tournament"
                              : "Processing Transaction"
                    }
                    chainId={order.srcChain}
                    tx={null}
                    isProcessing={true}
                    delay={0.5}
                  />
                ) : (
                  <TransactionDetails
                    title={
                      order.onrampMetadata?.vendor === "stripe-web2"
                        ? `Waiting for payment`
                        : `Waiting for deposit ${formattedDepositDeficit} ${srcToken.symbol}`
                    }
                    chainId={order.srcChain}
                    tx={null}
                    isProcessing={true}
                    delay={0.5}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Show payment UI for insufficient deposit while scanning for transaction */}
        {depositTxs?.length > 0 && !depositEnoughAmount && order.status === "scanning_deposit_transaction" && (
          <InsufficientDepositPayment
            order={order}
            srcToken={srcToken}
            depositDeficit={depositDeficit}
            phantomWalletAddress={phantomWalletAddress}
            txLoading={txLoading}
            isSwitchingOrExecuting={isSwitchingOrExecuting}
            onPayment={handlePayment}
          />
        )}

        {/* <DelayedSupportMessage /> */}
      </>
    );
  }

  return (
    <>
      <OrderStatus order={order} selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod} />
      {statusDisplay === "processing" && (
        <>
          {order.onrampMetadata ? (
            <PaymentVendorUI order={order} dstTokenSymbol={dstToken.symbol} />
          ) : effectiveCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
            effectiveCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET ? (
            <ConnectWalletPayment
              order={order}
              onPayment={handlePayment}
              onCancel={handleBack}
              txLoading={txLoading}
              isSwitchingOrExecuting={isSwitchingOrExecuting}
              phantomWalletAddress={phantomWalletAddress}
              tournament={tournament}
              nft={nft}
              cryptoPaymentMethod={effectiveCryptoPaymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
            />
          ) : effectiveCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO ? (
            // Transfer Crypto Payment Method - Show new card-based UI
            <TransferCryptoDetails
              order={order}
              recipientName={recipientName}
              srcToken={srcToken}
              dstToken={dstToken}
              tournament={tournament}
              nft={nft}
              onBack={handleBack}
              onPaymentMethodChange={onPaymentMethodChange}
            />
          ) : (
            <div className="order-details-payment-section relative flex w-full flex-1 flex-col">
              <div className={"order-details-amount-section flex flex-col gap-1"}>
                <span className={"text-as-primary/50 order-details-amount-label"}>Please send</span>
                <div className="order-details-amount-container flex w-full flex-wrap items-center gap-6 sm:justify-between sm:gap-0">
                  <CopyToClipboard
                    text={roundedUpSrcAmount}
                    onCopy={() => {
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <div className="order-details-amount-display flex items-center gap-2">
                      <strong className="border-as-brand text-as-primary order-details-amount-text border-b-2 pb-1 text-2xl font-semibold sm:text-xl">
                        {roundedUpSrcAmount} {srcToken.symbol}
                      </strong>
                      <Copy className="text-as-primary/50 hover:text-as-primary order-details-copy-icon h-5 w-5 cursor-pointer transition-all duration-200" />
                    </div>
                  </CopyToClipboard>

                  <Badge variant="outline" className="flex h-10 items-center gap-2 px-3 py-1 pr-2 text-sm">
                    on {getChainName(order.srcChain)}
                    <img
                      src={ALL_CHAINS[order.srcChain].logoUrl}
                      alt={getChainName(order.srcChain)}
                      className={cn("h-6 rounded-full", order.srcChain === b3.id && "h-5 rounded-none")}
                    />
                  </Badge>
                </div>
                <span className={"text-as-primary/50 order-details-address-label mb-1 mt-2"}> to the address:</span>
              </div>
              <CopyToClipboard
                text={order.globalAddress}
                onCopy={() => {
                  toast.success("Copied to clipboard");
                }}
              >
                <div className="bg-b3-react-background border-b3-react-border hover:border-as-brand order-details-address-container group flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 px-4 shadow-md transition-all duration-200">
                  <div className="text-as-primary order-details-address-text overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                    {order.globalAddress}
                  </div>
                  <Copy className="group-hover:text-as-brand text-as-primary/50 order-details-address-copy-icon h-5 w-5 cursor-pointer transition-all duration-200" />
                </div>
              </CopyToClipboard>

              {(account?.address || phantomWalletAddress) && !showQRCode ? (
                <div className="mb-4 mt-8 flex w-full flex-col items-center gap-4">
                  {/* Default - Show both options */}
                  <>
                    <div className="relative flex w-full flex-col items-center gap-2">
                      <ShinyButton
                        accentColor={"hsl(var(--as-brand))"}
                        textColor="text-white"
                        className="flex w-5/6 items-center gap-2 sm:px-0"
                        disabled={txLoading || isSwitchingOrExecuting}
                        onClick={handlePayment}
                      >
                        {txLoading ? (
                          <>
                            Transaction Pending
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          </>
                        ) : (
                          <>
                            <span className="pl-4 text-lg md:text-sm">
                              {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                                ? "Pay from Phantom Wallet"
                                : "Pay from Connected Wallet"}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </ShinyButton>
                      <span className="label-style text-as-primary/50 text-xs">
                        Connected to:{" "}
                        {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                          ? centerTruncate(phantomWalletAddress, 6)
                          : centerTruncate(account?.address || "", 6)}
                      </span>
                    </div>

                    <div className="flex w-full flex-col items-center gap-2">
                      <ShinyButton
                        accentColor={colorMode === "dark" ? "#ffffff" : "#000000"}
                        className="flex w-5/6 items-center gap-2 sm:px-0"
                        onClick={() => setShowQRCode(true)}
                      >
                        <span className="pl-4 text-lg md:text-sm">Pay from a different wallet</span>
                        <ChevronRight className="h-4 w-4" />
                      </ShinyButton>

                      <div className="flex items-center gap-2">
                        <WalletMetamask className="h-5 w-5" variant="branded" />
                        <WalletCoinbase className="h-5 w-5" variant="branded" />
                        <WalletPhantom className="h-5 w-5" variant="branded" />
                        <WalletTrust className="h-5 w-5" variant="branded" />
                        <WalletWalletConnect className="h-5 w-5" variant="branded" />
                        <span className="label-style text-as-primary/30 text-xs">& more</span>
                      </div>
                    </div>
                  </>
                </div>
              ) : (
                // Default case - existing QR code flow
                <motion.div
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex w-full items-center justify-evenly gap-4"
                >
                  <div className="order-details-qr-container mt-8 flex flex-col items-center rounded-lg bg-white p-6 pb-3">
                    <QRCodeSVG
                      value={getPaymentUrl(
                        order.globalAddress,
                        BigInt(order.srcAmount),
                        order.srcTokenAddress === ZERO_ADDRESS ? srcToken?.symbol || "ETH" : order.srcTokenAddress,
                        order.srcChain,
                        srcToken?.decimals,
                      )}
                      className="order-details-qr-code max-w-[200px]"
                    />
                    <div className="order-details-qr-wallets mt-3 flex items-center justify-center gap-2 text-sm">
                      <span className="label-style text-as-brand/70 text-sm">Scan with</span>
                      <TextLoop interval={3}>
                        <WalletMetamask className="h-5 w-5" variant="branded" />
                        <WalletCoinbase className="h-5 w-5" variant="branded" />
                        <WalletPhantom className="h-5 w-5" variant="branded" />
                        <WalletTrust className="h-5 w-5" variant="branded" />
                      </TextLoop>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </>
      )}

      <div className="order-details-time-remaining flex w-full items-center justify-center gap-1 text-sm">
        <div className="text-as-primary/30 order-details-time-label">Time remaining:</div>
        <div className="text-as-primary order-details-time-value">
          {depositEnoughAmount ? (
            "Received"
          ) : order.status === "expired" ? (
            "Expired"
          ) : (
            <TimeAgo date={new Date(order.expiredAt)} live={true} />
          )}
        </div>
      </div>

      {statusDisplay !== "processing" && (
        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
          points={points}
        />
      )}

      <button
        className="text-b3-primary-blue hover:text-b3-primary-blue/50 order-details-cancel-btn flex w-full items-center justify-center gap-2 underline"
        onClick={handleBack}
      >
        <RefreshCcw className="ml-2 h-4 w-4" /> Cancel and start over
      </button>

      {/* <DelayedSupportMessage /> */}
    </>
  );
});

function TransactionDetails({
  title,
  chainId,
  tx,
  isProcessing,
  delay,
}: {
  title: string;
  chainId: number;
  tx: components["schemas"]["DepositTx"] | components["schemas"]["RelayTx"] | components["schemas"]["ExecuteTx"] | null;
  isProcessing: boolean;
  delay?: number;
}) {
  return (
    <div className={"order-details-transaction-item relative flex w-full flex-1 items-center justify-between gap-4"}>
      <div className="order-details-transaction-content flex grow items-center gap-4">
        <motion.div className="bg-as-surface-secondary relative h-10 w-10 rounded-full">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut", delay }}
              className="border-as-border-secondary absolute z-10 m-2 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm"
            >
              <Loader2 className="text-as-primary h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay }}
              className="bg-as-success-secondary absolute z-10 m-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 shadow-lg backdrop-blur-sm"
            >
              <CheckIcon className="text-as-content-icon-success h-4 w-4" />
            </motion.div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut", delay }}
          className={"shrink-0 text-base"}
        >
          {isProcessing ? (
            <TextShimmer duration={1}>{title}</TextShimmer>
          ) : (
            <span className="text-as-primary">{title}</span>
          )}
        </motion.div>
      </div>
      <div className="flex flex-col gap-1">
        {tx ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: (delay || 0) + 0.3 }}
            className="flex items-center gap-3"
          >
            <a href={getExplorerTxUrl(chainId, tx.txHash)} target="_blank">
              <div className={"text-as-primary/30 font-mono text-xs"}>{centerTruncate(tx?.txHash, 6)}</div>
            </a>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

export const OrderDetailsLoadingView = (
  <div className={"mx-auto flex w-[460px] max-w-full flex-col items-center gap-4"}>
    {/* Status Badge */}
    <Badge
      variant="default"
      className="hover:bg-b3-react-background flex items-center gap-3 border-white/20 bg-white/10 px-4 py-1 text-base transition-colors"
    >
      <Loader2 className="text-as-primary h-4 w-4 animate-spin" />
      <TextShimmer duration={1} className="font-sf-rounded text-base font-semibold">
        Loading...
      </TextShimmer>
    </Badge>

    {/* Main Content Area */}
    <div className="flex w-full flex-1 flex-col">
      {/* Amount and Chain Info */}
      <div className="mb-4 flex flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="ml-4 h-8 w-32" />
        </div>
        <Skeleton className="mt-4 h-8 w-24" />
      </div>

      {/* Address Box */}
      <Skeleton className="mb-4 h-12 w-full" />

      {/* QR and Wallet Section */}
      <div className="flex w-full items-center justify-between gap-4">
        {/* QR Code Area */}
        <Skeleton className="rounded-lg p-6 pb-3">
          <div className="h-[200px] w-[200px]" />
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-5 w-5 rounded-full" />
          </div>
        </Skeleton>

        {/* Wallet Buttons */}
        <div className="flex flex-1 flex-col gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>

    {/* Share Section */}
    <div className="bg-b3-react-background mt-8 w-full rounded-lg p-4">
      <Skeleton className="mb-3 h-4 w-48" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>

    {/* Cancel Button */}
    <Skeleton className="h-10 w-full" />
  </div>
);
