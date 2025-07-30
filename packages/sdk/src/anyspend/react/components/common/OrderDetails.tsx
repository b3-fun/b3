"use client";

import {
  ALL_CHAINS,
  capitalizeFirstLetter,
  EVM_CHAINS,
  getChainName,
  getErrorDisplay,
  getExplorerTxUrl,
  getPaymentUrl,
  getStatusDisplay,
  isNativeToken,
  RELAY_ETH_ADDRESS,
  RELAY_SOLANA_MAINNET_CHAIN_ID,
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
  useChainSwitchWithAction,
  useModalStore,
  useProfile,
} from "@b3dotfun/sdk/global-account/react";
import { useRouter, useSearchParams } from "@b3dotfun/sdk/shared/react/hooks";
import { cn } from "@b3dotfun/sdk/shared/utils";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { useColorMode } from "@chakra-ui/react";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust, WalletWalletConnect } from "@web3icons/react";
import {
  CheckIcon,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Home,
  Loader2,
  RefreshCcw,
  SquareArrowOutUpRight,
} from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import TimeAgo from "react-timeago";
import { toast } from "sonner";
import { Address } from "thirdweb";
import { erc20Abi, WalletClient } from "viem";
import { b3 } from "viem/chains";
import { useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import ConnectWalletPayment from "./ConnectWalletPayment";
import { PaymentMethod } from "./CryptoPaymentMethod";
import PaymentVendorUI from "./PaymentVendorUI";

interface OrderDetailsProps {
  isMainnet: boolean;
  mode?: "modal" | "page";
  order: components["schemas"]["Order"];
  depositTxs: components["schemas"]["DepositTx"][] | null;
  relayTx: components["schemas"]["RelayTx"] | null;
  executeTx: components["schemas"]["ExecuteTx"] | null;
  refundTxs: components["schemas"]["RefundTx"][] | null;
  paymentMethod?: PaymentMethod; // Now optional since we read from URL
  onBack?: () => void;
}

// Add this helper function near the top or just above the component
function getOrderSuccessText({
  order,
  tournament,
  formattedActualDstAmount,
  dstToken,
  recipientName,
  centerTruncate,
}: {
  order: components["schemas"]["Order"];
  tournament?: any;
  formattedActualDstAmount?: string;
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
    case "custom":
      actionText = order.metadata.action || `executed contract`;
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
  isMainnet,
  mode = "modal",
  order,
  depositTxs,
  relayTx,
  executeTx,
  refundTxs,
  paymentMethod = PaymentMethod.NONE,
  onBack,
}: OrderDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read payment method from URL parameters
  const paymentMethodFromUrl = searchParams.get("paymentMethod") as PaymentMethod | null;
  const effectivePaymentMethod = paymentMethodFromUrl || paymentMethod || PaymentMethod.NONE;

  // Debug logging to verify payment method detection
  console.log("OrderDetails - Payment method from URL:", paymentMethodFromUrl);
  console.log("OrderDetails - Effective payment method:", effectivePaymentMethod);

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

  const { switchChainAndExecute, isSwitchingOrExecuting } = useChainSwitchWithAction();

  const { colorMode } = useColorMode();

  const roundedUpSrcAmount = useMemo(() => {
    // Display the full transfer amount without rounding since users need to see the exact value they're transferring.
    // Use 21 significant digits (max allowed by Intl.NumberFormat)
    const formattedSrcAmount = srcToken
      ? formatTokenAmount(BigInt(order.srcAmount), srcToken.decimals, 21, false)
      : undefined;

    return roundTokenAmount(formattedSrcAmount);
  }, [order.srcAmount, srcToken]);

  // This function handles the actual payment process
  const handlePaymentProcess = useCallback(
    async (currentWalletClient: WalletClient) => {
      if (!currentWalletClient || !currentWalletClient?.chain?.id) {
        toast.error("Please connect your wallet");
        return;
      }

      console.log("Processing transaction on chain:", currentWalletClient.chain.id);

      const signer = currentWalletClient.account!;

      // Send transaction
      if (isNativeToken(order.srcTokenAddress)) {
        const hash = await currentWalletClient.sendTransaction({
          account: signer,
          chain: EVM_CHAINS[order.srcChain].viem,
          to: order.globalAddress as `0x${string}`,
          value: BigInt(order.srcAmount),
        });
        setTxHash(hash);
      } else {
        const hash = await currentWalletClient.writeContract({
          account: signer,
          chain: EVM_CHAINS[order.srcChain].viem,
          address: order.srcTokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [order.globalAddress as Address, BigInt(order.srcAmount)],
        });
        setTxHash(hash);
      }
    },
    [order],
  );

  // Main payment handler that triggers chain switch and payment
  const handlePayment = async () => {
    console.log("Initiating payment process. Target chain:", order.srcChain, "Current chain:", walletClient?.chain?.id);
    if (order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID) {
      await initiatePhantomTransfer(order.srcAmount, order.srcTokenAddress, order.globalAddress);
    } else {
      await switchChainAndExecute(order.srcChain, handlePaymentProcess);
    }
  };

  // When waitingForDeposit is true, we show a message to the user to wait for the deposit to be processed.
  const setWaitingForDeposit = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("waitingForDeposit", "true");
    router.push(`?${params}`);
  }, [router, searchParams]);

  // Clean up URL parameters before closing modal or navigating back
  const cleanupUrlParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("waitingForDeposit");
    params.delete("orderId");
    params.delete("paymentMethod");

    // Only update URL if params were actually removed
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params}`);
    }
  }, [router, searchParams]);

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

  const [showOrderDetails, setShowOrderDetails] = useState(true);

  const isPhantomMobile = useMemo(() => navigator.userAgent.includes("Phantom"), []);
  const isPhantomBrowser = useMemo(() => (window as any).phantom?.solana?.isPhantom, []);

  // Get connected Phantom wallet address if available
  const phantomWalletAddress = useMemo(() => {
    const phantom = (window as any).phantom?.solana;
    if (phantom?.isConnected && phantom?.publicKey) {
      return phantom.publicKey.toString();
    }
    return null;
  }, []);

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

  const actualDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? undefined
      : order.payload.actualDstAmount;
  const formattedActualDstAmount = actualDstAmount
    ? formatTokenAmount(BigInt(actualDstAmount), dstToken.decimals)
    : undefined;

  const depositedAmount = depositTxs
    ? depositTxs.reduce((acc, curr) => acc + BigInt(curr.amount), BigInt(0))
    : BigInt(0);
  const depositDeficit = BigInt(order.srcAmount) - depositedAmount;
  const depositEnoughAmount = depositDeficit <= BigInt(0);
  const formattedDepositDeficit = formatTokenAmount(BigInt(depositDeficit), srcToken.decimals);

  const { text: statusText, status: statusDisplay } = getStatusDisplay(order);

  const permalink =
    window.location.origin === "https://basement.fun"
      ? window.location.origin + "/deposit/" + order.id
      : window.location.origin + "?orderId=" + order.id;

  const handleCoinbaseRedirect = () => {
    const coinbaseUrl = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(permalink)}`;
    return coinbaseUrl;
  };

  const initiatePhantomTransfer = async (amountLamports: string, tokenAddress: string, recipientAddress: string) => {
    try {
      if (!isPhantomBrowser && !isPhantomMobile) {
        toast.error("Phantom wallet not installed. Please install Phantom wallet to continue.");
        return;
      }

      // Step 2: Ensure Phantom is connected/unlocked
      const phantom = (window as any).phantom?.solana;
      if (!phantom) {
        toast.error("Phantom wallet not accessible");
        return;
      }

      // Connect and unlock wallet if needed
      let publicKey;
      try {
        const connection = await phantom.connect();
        publicKey = connection.publicKey;
      } catch (connectError) {
        toast.error("Failed to connect to Phantom wallet");
        return;
      }

      // Step 3: Create transaction with priority fees
      const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=efafd9b3-1807-4cf8-8aa4-3d984f56d8fb");

      const fromPubkey = new PublicKey(publicKey.toString());
      const toPubkey = new PublicKey(recipientAddress);
      const amount = BigInt(amountLamports);

      // Step 4: Get recent priority fees to determine optimal pricing
      let priorityFee = 10000; // Default fallback (10,000 micro-lamports)
      try {
        const recentFees = await connection.getRecentPrioritizationFees({
          lockedWritableAccounts: [fromPubkey],
        });

        if (recentFees && recentFees.length > 0) {
          // Use 75th percentile of recent fees for good priority
          const sortedFees = recentFees.map(fee => fee.prioritizationFee).sort((a, b) => a - b);
          const percentile75Index = Math.floor(sortedFees.length * 0.75);
          priorityFee = Math.max(sortedFees[percentile75Index] || 10000, 10000);
        }
      } catch (feeError) {
        console.warn("Failed to fetch recent priority fees, using default:", feeError);
      }

      let transaction: any;

      // Check if this is native SOL transfer
      if (tokenAddress === "11111111111111111111111111111111") {
        // Native SOL transfer with priority fees
        const computeUnitLimit = 1000; // SOL transfer + compute budget instructions need ~600-800 CU
        const computeUnitPrice = Math.min(priorityFee, 100000); // Cap at 100k micro-lamports for safety

        transaction = new Transaction()
          .add(
            // Set compute unit limit first (must come before other instructions)
            ComputeBudgetProgram.setComputeUnitLimit({
              units: computeUnitLimit,
            }),
          )
          .add(
            // Set priority fee
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: computeUnitPrice,
            }),
          )
          .add(
            // Actual transfer instruction
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports: Number(amount),
            }),
          );

        console.log(`Using priority fee: ${computeUnitPrice} micro-lamports per CU, limit: ${computeUnitLimit} CU`);
      } else {
        // SPL Token transfer with priority fees
        const mintPubkey = new PublicKey(tokenAddress);

        // Get associated token accounts
        const fromTokenAccount = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
        const toTokenAccount = getAssociatedTokenAddressSync(mintPubkey, toPubkey);

        // Check if destination token account exists
        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
        const needsDestinationAccount = !toTokenAccountInfo;

        // Get mint info to determine decimals
        const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
        const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 9;

        // SPL transfers need more compute units than SOL transfers
        // Add extra CU if we need to create destination account
        const computeUnitLimit = needsDestinationAccount ? 40000 : 20000;
        const computeUnitPrice = Math.min(priorityFee, 100000);

        // Create transfer instruction
        const transferInstruction = createTransferCheckedInstruction(
          fromTokenAccount,
          mintPubkey,
          toTokenAccount,
          fromPubkey,
          Number(amount),
          decimals,
        );

        transaction = new Transaction()
          .add(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: computeUnitLimit,
            }),
          )
          .add(
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: computeUnitPrice,
            }),
          );

        // Add create destination account instruction if needed
        if (needsDestinationAccount) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              fromPubkey, // payer
              toTokenAccount, // ata
              toPubkey, // owner
              mintPubkey, // mint
            ),
          );
        }

        // Add the transfer instruction
        transaction.add(transferInstruction);

        console.log(
          `SPL Token transfer: ${computeUnitPrice} micro-lamports per CU, limit: ${computeUnitLimit} CU, creating destination: ${needsDestinationAccount}`,
        );
      }

      // Step 5: Get latest blockhash and simulate transaction to verify
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Step 6: Sign and send transaction with priority fees
      const signedTransaction = await phantom.signAndSendTransaction(transaction);

      toast.success(`Transaction successful! Signature: ${signedTransaction.signature}`);
      console.log("Transaction sent with priority fees. Signature:", signedTransaction.signature);
    } catch (error: unknown) {
      console.error("Transfer error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("User rejected")) {
        toast.error("Transaction was cancelled by user");
      } else if (errorMessage.includes("insufficient")) {
        toast.error("Insufficient balance for this transaction");
      } else if (errorMessage.includes("blockhash not found")) {
        toast.error("Network congestion detected. Please try again in a moment.");
      } else {
        toast.error(`Transfer failed: ${errorMessage}`);
      }
    }
  };

  if (refundTxs) {
    return (
      <>
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="bg-b3-react-background absolute bottom-2 left-4 top-2 z-[5] w-2">
            <motion.div
              className="from-as-brand/50 absolute left-[2px] top-0 z-10 w-[3px] bg-gradient-to-b from-20% via-purple-500/50 via-80% to-transparent"
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
        {order.errorDetails && (
          <div className="flex justify-center">
            <span className="text-as-primary/50 text-center text-sm" style={{ maxWidth: "40ch" }}>
              {getErrorDisplay(order.errorDetails)}
            </span>
          </div>
        )}
        <button
          className="bg-as-on-surface-2 text-as-secondary flex w-full items-center justify-center gap-2 rounded-lg p-2"
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
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="bg-b3-react-background absolute bottom-2 left-4 top-2 z-[5] w-2">
            <motion.div
              className="from-as-brand/50 absolute left-[2px] top-0 z-10 w-[3px] bg-gradient-to-b from-20% via-purple-500/50 via-80% to-transparent"
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
          <TransactionDetails
            title="Processed Transaction"
            chainId={order.srcChain}
            tx={relayTx}
            delay={0.5}
            isProcessing={false}
          />
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
        <div className="flex w-full flex-col gap-8">
          <Button variant="link" asChild>
            <a
              href={getExplorerTxUrl(order.dstChain, executeTx.txHash)}
              target="_blank"
              className="text-as-primary/70 hover:text-as-primary"
              style={{ whiteSpace: "normal" }} // Don't know why but class can't override.
            >
              {getOrderSuccessText({
                order,
                tournament,
                formattedActualDstAmount: formattedActualDstAmount,
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
            className="bg-as-on-surface-2 text-as-secondary flex w-full items-center justify-center gap-2 rounded-lg p-2"
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

  if (relayTx && relayTx.status === "success") {
    return (
      <>
        <div className="relative mt-4 flex w-full flex-col gap-4">
          <div className="bg-b3-react-background absolute bottom-2 left-4 top-2 z-[5] w-2">
            <motion.div
              className="from-as-brand/50 absolute left-[2px] top-0 z-10 w-[3px] bg-gradient-to-b from-20% via-purple-500/50 via-80% to-transparent"
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
          {/* If the source and destination chains are the same, AnySpend doesn't have executeTransaction */}
          {order.srcChain === order.dstChain ? (
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
                        : "Processed Transaction"
              }
              chainId={order.srcChain}
              isProcessing={false}
              tx={relayTx}
              delay={0.5}
            />
          ) : (
            <>
              <TransactionDetails
                title="Processed Transaction"
                chainId={order.srcChain}
                isProcessing={false}
                tx={relayTx}
                delay={0.5}
              />
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
                          : "Processing Bridge"
                }
                chainId={order.dstChain}
                isProcessing={true}
                tx={executeTx}
                delay={1}
              />
            </>
          )}
        </div>

        <div className="flex w-full flex-col gap-8">
          <Button variant="link" asChild>
            <a
              href={getExplorerTxUrl(order.dstChain, relayTx.txHash)}
              target="_blank"
              className="text-as-primary/70 hover:text-as-primary"
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
            className="bg-as-on-surface-2 text-as-secondary flex w-full items-center justify-center gap-2 rounded-lg p-2"
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
        <div className="relative mt-4 flex w-full flex-col gap-6">
          <div className="bg-b3-react-background absolute bottom-2 left-4 top-2 z-[5] w-2">
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

        {/* <DelayedSupportMessage /> */}
      </>
    );
  }

  return (
    <>
      {statusDisplay === "processing" && (
        <>
          {order.onrampMetadata ? (
            <PaymentVendorUI isMainnet={isMainnet} order={order} dstTokenSymbol={dstToken.symbol} />
          ) : effectivePaymentMethod === PaymentMethod.CONNECT_WALLET ? (
            <ConnectWalletPayment
              order={order}
              onPayment={handlePayment}
              onCancel={handleBack}
              txLoading={txLoading}
              isSwitchingOrExecuting={isSwitchingOrExecuting}
              phantomWalletAddress={phantomWalletAddress}
            />
          ) : (
            <div className="relative flex w-full flex-1 flex-col">
              <div className={"flex flex-col gap-1"}>
                <span className={"text-as-primary/50"}>Please send</span>
                <div className="flex w-full flex-wrap items-center gap-6 sm:justify-between sm:gap-0">
                  <CopyToClipboard
                    text={roundedUpSrcAmount}
                    onCopy={() => {
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <strong className="border-as-brand text-as-primary border-b-2 pb-1 text-2xl font-semibold sm:text-xl">
                        {roundedUpSrcAmount} {srcToken.symbol}
                      </strong>
                      <Copy className="text-as-primary/50 hover:text-as-primary h-5 w-5 cursor-pointer transition-all duration-200" />
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
                <span className={"text-as-primary/50 mb-1 mt-2"}> to the address:</span>
              </div>
              <CopyToClipboard
                text={order.globalAddress}
                onCopy={() => {
                  toast.success("Copied to clipboard");
                }}
              >
                <div className="bg-b3-react-background border-b3-react-border hover:border-as-brand group flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 px-4 shadow-md transition-all duration-200">
                  <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                    {order.globalAddress}
                  </div>
                  <Copy className="group-hover:text-as-brand text-as-primary/50 h-5 w-5 cursor-pointer transition-all duration-200" />
                </div>
              </CopyToClipboard>

              {(account?.address || phantomWalletAddress) && !showQRCode ? (
                <div className="mb-4 mt-8 flex w-full flex-col items-center gap-4">
                  {/* Transfer Crypto Payment Method or default - Show both options */}
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
              ) : effectivePaymentMethod === PaymentMethod.TRANSFER_CRYPTO || !account?.address ? (
                // Transfer Crypto Payment Method or no wallet connected - Show QR code directly
                <motion.div
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex w-full items-center justify-evenly gap-4"
                >
                  <div className="mt-8 flex flex-col items-center rounded-lg bg-white p-6 pb-3">
                    <QRCodeSVG
                      value={getPaymentUrl(
                        order.globalAddress,
                        BigInt(order.srcAmount),
                        order.srcTokenAddress === RELAY_ETH_ADDRESS ? "ETH" : order.srcTokenAddress,
                      )}
                      className="max-w-[200px]"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm">
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
              ) : (
                // Default case - existing QR code flow
                <motion.div
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex w-full items-center justify-evenly gap-4"
                >
                  <div className="mt-8 flex flex-col items-center rounded-lg bg-white p-6 pb-3">
                    <QRCodeSVG
                      value={getPaymentUrl(
                        order.globalAddress,
                        BigInt(order.srcAmount),
                        order.srcTokenAddress === RELAY_ETH_ADDRESS ? "ETH" : order.srcTokenAddress,
                      )}
                      className="max-w-[200px]"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm">
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

          {effectivePaymentMethod !== PaymentMethod.CONNECT_WALLET && (
            <div className="bg-as-light-brand/30 w-full rounded-lg p-4 sm:p-2 sm:px-4">
              <p className="text-as-secondary mb-3 text-sm">Continue on another device?</p>
              <div className="flex items-center gap-4">
                <CopyToClipboard
                  text={permalink}
                  onCopy={() => {
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Button variant="outline" className="w-full">
                    Copy Link
                    <Copy className="ml-2 h-3 w-3" />
                  </Button>
                </CopyToClipboard>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: "Complete Deposit",
                          text: "Complete your deposit on BSMNT.fun",
                          url: permalink,
                        })
                        .catch(error => console.log("Error sharing:", error));
                    } else {
                      toast.error("Web Share API is not supported on this browser");
                    }
                  }}
                >
                  Send Link <SquareArrowOutUpRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex w-full items-center justify-center gap-1 text-sm">
        <div className="text-as-primary/30">Time remaining:</div>
        <div className="text-as-primary">
          {depositEnoughAmount ? (
            "Received"
          ) : order.status === "expired" ? (
            "Expired"
          ) : (
            <TimeAgo date={new Date(order.expiredAt)} live={true} />
          )}
        </div>
      </div>

      <div className="bg-as-surface-secondary border-as-border-secondary rounded-xl border px-4 py-2">
        {showOrderDetails ? (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
          >
            <div className="flex w-full flex-col items-center gap-3 whitespace-nowrap py-2 text-sm">
              <div className="flex w-full justify-between gap-4">
                <div className="text-as-tertiarry">Recipient</div>
                <div className="flex flex-col items-end gap-1">
                  {recipientName && <div className="text-as-primary font-semibold">{recipientName}</div>}
                  <CopyToClipboard
                    text={order.recipientAddress}
                    onCopy={() => {
                      toast.success("Copied recipient address to clipboard");
                    }}
                  >
                    <div className="text-as-primary flex items-center gap-2">
                      {centerTruncate(order.recipientAddress, 10)}
                      <Copy className="text-as-primary/50 hover:text-as-primary h-4 w-4 cursor-pointer transition-all duration-200" />
                    </div>
                  </CopyToClipboard>
                </div>
              </div>
              <div className="divider w-full" />

              <div className="flex w-full items-center justify-between gap-2">
                <div className="text-as-tertiarry">
                  {order.type === "swap" || order.type === "mint_nft"
                    ? "Expected to receive"
                    : order.type === "join_tournament"
                      ? "Join tournament"
                      : order.type === "fund_tournament"
                        ? "Fund tournament"
                        : order.type === "custom"
                          ? order.metadata.action
                            ? capitalizeFirstLetter(order.metadata.action)
                            : "Contract execution"
                          : ""}
                </div>

                <div className="flex items-end gap-2">
                  {order.type === "swap" ? (
                    `~${formattedExpectedDstAmount} ${dstToken.symbol}`
                  ) : order.type === "mint_nft" ? (
                    <div className="flex items-center gap-2">
                      <img src={nft?.imageUrl} alt={nft?.name || "NFT"} className="h-5 w-5" />
                      <div>{nft?.name || "NFT"}</div>
                    </div>
                  ) : order.type === "join_tournament" || order.type === "fund_tournament" ? (
                    <div className="flex items-center gap-2">
                      <img src={tournament?.imageUrl} alt={tournament?.name || "Tournament"} className="h-5 w-5" />
                      <div>{tournament?.name || "Tournament"}</div>
                    </div>
                  ) : null}

                  <div className="text-as-primary/50 flex items-center gap-2">
                    <span>on {order.dstChain !== b3.id && getChainName(order.dstChain)}</span>
                    <img
                      src={ALL_CHAINS[order.dstChain].logoUrl}
                      alt={getChainName(order.dstChain)}
                      className={cn(
                        "h-3",
                        order.dstChain !== b3.id && "w-3 rounded-full",
                        order.dstChain === b3.id && "h-4",
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="divider w-full" />

              <div className="flex w-full justify-between gap-4">
                <div className="text-as-tertiarry">Order ID</div>
                <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap">{order.id}</div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex w-full items-center">
            <div className="divider w-full" />
            <button className="whitespace-nowrap text-sm" onClick={() => setShowOrderDetails(true)}>
              Order Details
            </button>
            <ChevronDown className="text-as-primary mx-1 h-4 min-h-4 w-4 min-w-4" />
            <div className="divider w-full" />
          </div>
        )}
      </div>

      <button className="flex w-full items-center justify-center gap-2" onClick={handleBack}>
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
    <div className={"relative flex w-full flex-1 items-center justify-between gap-4"}>
      <div className="flex grow items-center gap-4">
        <motion.div className="bg-b3-react-background relative h-10 w-10 rounded-full">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut", delay }}
              className="absolute z-10 m-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 shadow-lg backdrop-blur-sm"
            >
              <Loader2 className="text-as-primary h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay }}
              className="bg-as-brand/70 absolute z-10 m-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 shadow-lg shadow-purple-500/30 backdrop-blur-sm"
              style={{
                boxShadow: "0 0 15px 5px rgba(138, 43, 226, 0.2)",
              }}
            >
              <CheckIcon className="text-as-primary h-3 w-3" />
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
