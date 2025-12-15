import { ALL_CHAINS, getAvailableChainIds, HYPERLIQUID_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Button, toast } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { TokenSelector } from "@relayprotocol/relay-kit-ui";
import { Check, ChevronsUpDown, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useAnyspendOrderAndTransactions } from "../hooks/useAnyspendOrderAndTransactions";
import { useCreateDepositFirstOrder } from "../hooks/useCreateDepositFirstOrder";
import { DepositContractConfig } from "./AnySpendDeposit";
import { ChainTokenIcon } from "./common/ChainTokenIcon";
import { OrderDetails } from "./common/OrderDetails";

export interface QRDepositProps {
  /** Display mode */
  mode?: "modal" | "page";
  /** The recipient address (user's wallet) */
  recipientAddress: string;
  /** The source token to deposit (defaults to ETH on Base) */
  sourceToken?: components["schemas"]["Token"];
  /** The source chain ID (defaults to Base) */
  sourceChainId?: number;
  /** The destination token to receive */
  destinationToken: components["schemas"]["Token"];
  /** The destination chain ID */
  destinationChainId: number;
  /** Creator address (optional) */
  creatorAddress?: string;
  /** Contract config for custom execution after deposit */
  depositContractConfig?: DepositContractConfig;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Callback when order is created successfully */
  onOrderCreated?: (orderId: string) => void;
  /** Callback when deposit is completed */
  onSuccess?: (txHash?: string) => void;
}

// Default source token: ETH on Base
const DEFAULT_ETH_ON_BASE: components["schemas"]["Token"] = {
  chainId: 8453,
  address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  metadata: {
    logoURI: "https://assets.relay.link/icons/1/light.png",
  },
};

/**
 * A component for displaying QR code deposit functionality.
 * Creates a deposit_first order on mount and shows a QR code that can be scanned to deposit tokens.
 * Users can change the source token/chain using the TokenSelector.
 *
 * @example
 * <QRDeposit
 *   recipientAddress={userAddress}
 *   destinationToken={usdcArbitrumToken}
 *   destinationChainId={42161}
 *   onBack={() => setStep("select-chain")}
 *   onSuccess={(txHash) => console.log("Deposit complete:", txHash)}
 * />
 */
export function QRDeposit({
  mode = "modal",
  recipientAddress,
  sourceToken: sourceTokenProp,
  sourceChainId: sourceChainIdProp,
  destinationToken,
  destinationChainId,
  creatorAddress,
  depositContractConfig,
  onBack,
  onClose,
  onOrderCreated,
  onSuccess,
}: QRDepositProps) {
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>();
  const [globalAddress, setGlobalAddress] = useState<string | undefined>();
  const orderCreatedRef = useRef(false);
  const onSuccessCalled = useRef(false);

  // Source token/chain as state (can be changed by user)
  const [sourceChainId, setSourceChainId] = useState(sourceChainIdProp ?? 8453);
  const [sourceToken, setSourceToken] = useState<components["schemas"]["Token"]>(
    sourceTokenProp ?? DEFAULT_ETH_ON_BASE,
  );

  // Handle token selection from TokenSelector
  const handleTokenSelect = (newToken: any) => {
    const token: components["schemas"]["Token"] = {
      address: newToken.address,
      chainId: newToken.chainId,
      decimals: newToken.decimals,
      metadata: { logoURI: newToken.logoURI },
      name: newToken.name,
      symbol: newToken.symbol,
    };

    // Reset order state when token changes
    setOrderId(undefined);
    setGlobalAddress(undefined);
    orderCreatedRef.current = false;

    // Update token and chain
    setSourceChainId(newToken.chainId);
    setSourceToken(token);
  };

  // Create order hook
  const { createOrder, isCreatingOrder } = useCreateDepositFirstOrder({
    onSuccess: data => {
      const newOrderId = data.data.id;
      const newGlobalAddress = data.data.globalAddress;
      setOrderId(newOrderId);
      setGlobalAddress(newGlobalAddress);
      onOrderCreated?.(newOrderId);
    },
    onError: error => {
      console.error("Failed to create deposit order:", error);
      toast.error("Failed to create deposit order: " + error.message);
    },
  });

  // Fetch order status
  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  // Create order on mount
  useEffect(() => {
    if (orderCreatedRef.current) return;
    orderCreatedRef.current = true;

    createOrder({
      recipientAddress,
      srcChain: sourceChainId,
      dstChain: destinationChainId,
      srcToken: sourceToken,
      dstToken: destinationToken,
      creatorAddress,
      contractConfig: depositContractConfig,
    });
  }, [
    recipientAddress,
    sourceChainId,
    destinationChainId,
    sourceToken,
    destinationToken,
    creatorAddress,
    depositContractConfig,
    createOrder,
  ]);

  // Call onSuccess when order is executed
  useEffect(() => {
    if (oat?.data?.order.status === "executed" && !onSuccessCalled.current) {
      const txHash = oat?.data?.executeTx?.txHash;
      onSuccess?.(txHash);
      onSuccessCalled.current = true;
    }
  }, [oat?.data?.order.status, oat?.data?.executeTx?.txHash, onSuccess]);

  // Reset onSuccess flag when orderId changes
  useEffect(() => {
    onSuccessCalled.current = false;
  }, [orderId]);

  const displayAddress = globalAddress || recipientAddress;

  const handleCopyAddress = async () => {
    if (displayAddress) {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    setCopied(false);
    onBack?.();
  };

  const handleClose = () => {
    setCopied(false);
    onClose?.();
  };

  // Show order details if order has deposits or is being processed
  if (oat?.data && oat.data.depositTxs && oat.data.depositTxs.length > 0) {
    return (
      <div
        className={cn(
          "anyspend-container anyspend-qr-order-details font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
          mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
        )}
      >
        <div className="anyspend-qr-order-details-content relative flex flex-col gap-4">
          <OrderDetails
            mode={mode}
            order={oat.data.order}
            depositTxs={oat.data.depositTxs}
            relayTxs={oat.data.relayTxs}
            executeTx={oat.data.executeTx}
            refundTxs={oat.data.refundTxs}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  // Show loading state while creating order (but not if we already have an orderId)
  if (isCreatingOrder && !orderId) {
    return (
      <div
        className={cn(
          "anyspend-container anyspend-qr-loading font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
          mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
        )}
      >
        <div className="anyspend-qr-loading-content flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 className="anyspend-qr-loading-spinner text-as-brand h-8 w-8 animate-spin" />
          <p className="anyspend-qr-loading-text text-as-secondary text-sm">Creating deposit order...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "anyspend-container anyspend-qr-deposit font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
        mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
      )}
    >
      <div className="anyspend-qr-deposit-content flex flex-col gap-4">
        {/* Header with back button and close button */}
        <div className="anyspend-qr-header flex items-center justify-between">
          <button onClick={handleBack} className="anyspend-qr-back-button text-as-secondary hover:text-as-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="anyspend-qr-title text-as-primary text-base font-semibold">Deposit</h2>
          {onClose ? (
            <button onClick={handleClose} className="anyspend-qr-close-button text-as-secondary hover:text-as-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Token selector */}
        <div className="anyspend-qr-token-selector flex flex-col gap-1.5">
          <label className="anyspend-qr-token-label text-as-secondary text-sm">Send</label>
          <TokenSelector
            chainIdsFilter={getAvailableChainIds("from")}
            context="from"
            fromChainWalletVMSupported={true}
            isValidAddress={true}
            lockedChainIds={getAvailableChainIds("from")}
            multiWalletSupportEnabled={true}
            onAnalyticEvent={undefined}
            setToken={handleTokenSelect}
            supportedWalletVMs={["evm"]}
            token={undefined}
            trigger={
              <Button
                variant="outline"
                role="combobox"
                className="anyspend-qr-token-trigger border-as-stroke bg-as-surface-secondary flex h-auto w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {sourceToken.metadata?.logoURI ? (
                    <ChainTokenIcon
                      chainUrl={ALL_CHAINS[sourceChainId]?.logoUrl}
                      tokenUrl={sourceToken.metadata.logoURI}
                      className="h-8 min-h-8 w-8 min-w-8"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-700" />
                  )}
                  <div className="flex flex-col items-start gap-0">
                    <div className="text-as-primary font-semibold">{sourceToken.symbol}</div>
                    <div className="text-as-primary/70 text-xs">{ALL_CHAINS[sourceChainId]?.name ?? "Unknown"}</div>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
              </Button>
            }
          />
        </div>

        {/* QR Code and Address - horizontal layout */}
        <div className="anyspend-qr-content border-as-stroke flex items-start gap-4 rounded-xl border p-4">
          {/* QR Code */}
          <div className="anyspend-qr-code-container flex flex-col items-center gap-2">
            <div className="anyspend-qr-code rounded-lg bg-white p-2">
              <QRCodeSVG value={displayAddress} size={120} level="M" marginSize={0} />
            </div>
            <span className="anyspend-qr-scan-hint text-as-secondary text-xs">
              SCAN WITH <span className="inline-block">🦊</span>
            </span>
          </div>

          {/* Address info */}
          <div className="anyspend-qr-address-container flex flex-1 flex-col gap-1">
            <span className="anyspend-qr-address-label text-as-secondary text-sm">Deposit address:</span>
            <div className="anyspend-qr-address-row flex items-start gap-1">
              <span className="anyspend-qr-address text-as-primary break-all font-mono text-sm leading-relaxed">{displayAddress}</span>
              <button onClick={handleCopyAddress} className="anyspend-qr-copy-icon text-as-secondary hover:text-as-primary mt-0.5 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <p className="anyspend-qr-warning text-center text-xs italic text-red-500">
          {destinationChainId === HYPERLIQUID_CHAIN_ID && (
            <>
              Minimum deposit amount: <b>1$</b> <br />
            </>
          )}
          Only send {sourceToken.symbol} on {ALL_CHAINS[sourceChainId]?.name ?? "the specified chain"}. Other tokens
          will not be converted.
        </p>

        {/* Copy button */}
        <button
          onClick={handleCopyAddress}
          className="anyspend-qr-copy-button flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600"
        >
          Copy deposit address
        </button>
      </div>
    </div>
  );
}
