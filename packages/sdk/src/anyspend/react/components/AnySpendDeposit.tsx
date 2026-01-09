import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { Skeleton, useAccountWallet, useSimBalance, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import {
  NetworkArbitrumOne,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygonPos,
} from "@web3icons/react";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { AnySpend } from "./AnySpend";
import { AnySpendCustomExactIn } from "./AnySpendCustomExactIn";
import { ChainWarningText } from "./common/WarningText";
import { CreditCardIcon } from "./icons/CreditCardIcon";
import { QrCodeIcon } from "./icons/QrCodeIcon";
import { QRDeposit } from "./QRDeposit";
import type { AnySpendAllClasses } from "./types/classes";

export interface DepositContractConfig {
  /** Custom function ABI JSON string */
  functionAbi: string;
  /** The function name to call */
  functionName: string;
  /** Custom function arguments. Use "{{amount_out}}" for the deposit amount placeholder */
  functionArgs: string[];
  /** The contract address to deposit to */
  to: string;
  /** Optional spender address if different from contract address */
  spenderAddress?: string;
  /** Custom action label */
  action?: string;
  /** Native token value to send with the transaction (in wei as string) */
  value?: string;
}

export interface ChainConfig {
  /** Chain ID */
  id: number;
  /** Display name */
  name: string;
  /** Optional icon URL */
  iconUrl?: string;
}

export interface AnySpendDepositProps {
  /** Order ID to load an existing order */
  loadOrder?: string;
  /** Display mode */
  mode?: "modal" | "page";
  /** The recipient address for the deposit */
  recipientAddress: string;
  /** Payment type - crypto or fiat. If not set, shows chain selection first */
  paymentType?: "crypto" | "fiat";
  /** Source token address to pre-select */
  sourceTokenAddress?: string;
  /** Source chain ID to pre-select. If not provided, shows chain selection */
  sourceTokenChainId?: number;
  /** The destination token address */
  destinationTokenAddress: string;
  /** The destination chain ID */
  destinationTokenChainId: number;
  /** Callback when deposit succeeds */
  onSuccess?: (amount: string) => void;
  /** Callback for opening a custom modal (e.g., for special token handling) */
  onOpenCustomModal?: () => void;
  /** Custom footer content */
  mainFooter?: React.ReactNode;
  /** Called when a token is selected. Call event.preventDefault() to prevent default behavior */
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  /** Custom USD input value presets for fiat payment */
  customUsdInputValues?: string[];
  /** Whether to prefer using connected EOA wallet */
  preferEoa?: boolean;
  /** Minimum destination amount required */
  minDestinationAmount?: number;
  /** Custom header component */
  header?: ({
    anyspendPrice,
    isLoadingAnyspendPrice,
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  /** Order type for the deposit */
  orderType?: "hype_duel" | "custom_exact_in" | "swap";
  /** Custom action label displayed on buttons */
  actionLabel?: string;
  /** Configuration for depositing to a custom contract.
   * If provided, creates a custom_exact_in order that calls the contract.
   * If not provided, creates a simple hype_duel order for direct deposits.
   */
  depositContractConfig?: DepositContractConfig;
  /** Whether to show chain selection step. Defaults to true if sourceTokenChainId is not provided */
  showChainSelection?: boolean;
  /** Custom list of supported chains. If not provided, uses default chains */
  supportedChains?: ChainConfig[];
  /** Minimum pool size for filtering tokens (default: 1,000,000) */
  minPoolSize?: number;
  /** Custom title for chain selection step */
  chainSelectionTitle?: string;
  /** Custom description for chain selection step */
  chainSelectionDescription?: string;
  /** Number of top chains to show (default: 3) */
  topChainsCount?: number;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Custom URL to redirect to when clicking "Return to Home" on complete order screen */
  returnToHomeUrl?: string;
  /** Custom label for recipient display (e.g., "OBSN Telegram Bot") */
  customRecipientLabel?: string;
  /** Custom label for the return home button (overrides "Return to Home" / "Close") */
  returnHomeLabel?: string;
  /** Whether the deposit requires a custom function (uses AnySpendCustomExactIn).
   * When false, uses simple swap flow (AnySpend).
   * Defaults to false.
   */
  isCustomDeposit?: boolean;
  /** Custom class names for styling specific elements */
  classes?: AnySpendAllClasses;
}

// Default supported chains
const DEFAULT_SUPPORTED_CHAINS: ChainConfig[] = [
  { id: 8453, name: "Base" },
  { id: 1, name: "Ethereum" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 137, name: "Polygon" },
  { id: 56, name: "BNB Chain" },
];

// Minimum pool size to filter out low liquidity tokens
const DEFAULT_MIN_POOL_SIZE = 1_000_000;

type DepositStep = "select-chain" | "deposit" | "qr-deposit";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

// Chain icon component
function ChainIcon({ chainId, className }: { chainId: number; className?: string }) {
  const iconProps = {
    variant: "branded" as const,
    className: cn("anyspend-deposit-chain-icon", className),
  };

  switch (chainId) {
    case 1:
      return <NetworkEthereum {...iconProps} />;
    case 8453:
      return <NetworkBase {...iconProps} />;
    case 137:
      return <NetworkPolygonPos {...iconProps} />;
    case 42161:
      return <NetworkArbitrumOne {...iconProps} />;
    case 10:
      return <NetworkOptimism {...iconProps} />;
    case 56:
      return <NetworkBinanceSmartChain {...iconProps} />;
    default:
      return null;
  }
}

/**
 * A flexible deposit component that wraps AnySpendCustomExactIn with optional chain selection.
 *
 * @example
 * // Simple deposit with chain selection
 * <AnySpendDeposit
 *   recipientAddress={userAddress}
 *   destinationTokenAddress="0x..."
 *   destinationTokenChainId={base.id}
 *   onSuccess={(amount) => console.log(`Deposited ${amount}`)}
 * />
 *
 * @example
 * // Skip chain selection by providing sourceTokenChainId
 * <AnySpendDeposit
 *   recipientAddress={userAddress}
 *   destinationTokenAddress="0x..."
 *   destinationTokenChainId={base.id}
 *   sourceTokenChainId={base.id}
 *   onSuccess={(amount) => console.log(`Deposited ${amount}`)}
 * />
 *
 * @example
 * // Deposit with custom contract
 * <AnySpendDeposit
 *   recipientAddress={userAddress}
 *   destinationTokenAddress="0x..."
 *   destinationTokenChainId={base.id}
 *   depositContractConfig={{
 *     contractAddress: "0x...",
 *     functionName: "depositFor",
 *   }}
 *   onSuccess={(amount) => console.log(`Deposited ${amount}`)}
 * />
 */
export function AnySpendDeposit({
  loadOrder,
  mode = "modal",
  recipientAddress,
  paymentType: initialPaymentType,
  sourceTokenAddress,
  sourceTokenChainId: initialSourceChainId,
  destinationTokenAddress,
  destinationTokenChainId,
  onSuccess,
  onOpenCustomModal,
  mainFooter,
  onTokenSelect,
  customUsdInputValues,
  preferEoa,
  minDestinationAmount,
  header,
  orderType,
  depositContractConfig,
  showChainSelection,
  supportedChains = DEFAULT_SUPPORTED_CHAINS,
  minPoolSize = DEFAULT_MIN_POOL_SIZE,
  topChainsCount = 3,
  onClose,
  returnToHomeUrl,
  customRecipientLabel,
  returnHomeLabel,
  isCustomDeposit = false,
  classes,
}: AnySpendDepositProps) {
  // Extract deposit-specific classes for convenience
  const depositClasses = classes?.deposit;
  const { connectedEOAWallet } = useAccountWallet();
  const eoaAddress = connectedEOAWallet?.getAccount()?.address;

  // Determine if we should show chain selection
  const shouldShowChainSelection = showChainSelection ?? (!initialSourceChainId && !initialPaymentType);

  const [step, setStep] = useState<DepositStep>(shouldShowChainSelection ? "select-chain" : "deposit");
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>(initialSourceChainId);
  const [paymentType, setPaymentType] = useState<"crypto" | "fiat">(initialPaymentType ?? "crypto");

  // Fetch destination token data
  const { data: destinationTokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  // Construct full destination token object
  const destinationToken: components["schemas"]["Token"] = useMemo(
    () => ({
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      symbol: destinationTokenData?.symbol ?? "",
      name: destinationTokenData?.name ?? "",
      decimals: destinationTokenData?.decimals ?? 18,
      metadata: { logoURI: destinationTokenData?.logoURI },
    }),
    [destinationTokenAddress, destinationTokenChainId, destinationTokenData],
  );

  // Fetch balances for EOA wallet
  const { data: balanceData, isLoading: isBalanceLoading } = useSimBalance(
    shouldShowChainSelection ? eoaAddress : undefined,
    supportedChains.map(c => c.id),
  );

  // Group balances by chain and calculate total USD value per chain
  const chainBalances = useMemo(() => {
    if (!balanceData?.balances) return {};

    const filteredBalances = balanceData.balances.filter(
      token => token.address === "native" || (token.pool_size && token.pool_size > minPoolSize),
    );

    return filteredBalances.reduce(
      (acc, token) => {
        const chainId = token.chain_id;
        if (!acc[chainId]) {
          acc[chainId] = {
            chainId,
            chainName: token.chain,
            totalUsdValue: 0,
            tokenCount: 0,
          };
        }
        acc[chainId].totalUsdValue += token.value_usd || 0;
        acc[chainId].tokenCount += 1;
        return acc;
      },
      {} as Record<number, { chainId: number; chainName: string; totalUsdValue: number; tokenCount: number }>,
    );
  }, [balanceData, minPoolSize]);

  // Sort chains by USD value (highest first)
  const sortedChains = useMemo(() => {
    return supportedChains
      .map(chain => ({
        ...chain,
        balance: chainBalances[chain.id]?.totalUsdValue || 0,
        tokenCount: chainBalances[chain.id]?.tokenCount || 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [supportedChains, chainBalances]);

  // Get top chains with balance
  const topChainsWithBalance = useMemo(() => {
    return sortedChains.filter(chain => chain.balance > 0).slice(0, topChainsCount);
  }, [sortedChains, topChainsCount]);

  // Calculate total balance across all chains
  const totalBalance = useMemo(() => {
    return Object.values(chainBalances).reduce((sum, chain) => sum + chain.totalUsdValue, 0);
  }, [chainBalances]);

  if (!recipientAddress) return null;

  const tokenSymbol = destinationToken.symbol || "TOKEN";

  // Determine order type based on config
  const effectiveOrderType = orderType ?? (depositContractConfig ? "custom_exact_in" : "swap");

  // Default header if not provided
  const defaultHeader = () => (
    <div className="anyspend-deposit-header mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="anyspend-deposit-title text-as-primary text-xl font-bold">
          {paymentType === "crypto" ? `Deposit ${tokenSymbol}` : "Fund with Fiat"}
        </h1>
      </div>
    </div>
  );

  const handleSelectChain = (chainId: number) => {
    setSelectedChainId(chainId);
    setPaymentType("crypto");
    setStep("deposit");
  };

  const handleSelectCrypto = () => {
    setPaymentType("crypto");
    setSelectedChainId(undefined);
    setStep("deposit");
  };

  const handleSelectFiat = () => {
    setPaymentType("fiat");
    setSelectedChainId(undefined);
    setStep("deposit");
  };

  const handleBack = () => {
    setStep("select-chain");
    setSelectedChainId(undefined);
  };

  const handleSelectQrDeposit = () => {
    setStep("qr-deposit");
  };

  // Chain selection view
  if (step === "select-chain") {
    return (
      <div
        className={
          depositClasses?.chainSelection ||
          cn(
            "anyspend-deposit anyspend-deposit-chain-selection font-inter bg-as-surface-primary relative mx-auto w-full max-w-[460px]",
            mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
          )
        }
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={
              depositClasses?.closeButton ||
              "anyspend-deposit-close-button text-as-secondary hover:text-as-primary absolute right-4 top-4 z-10"
            }
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Balance header */}
        {!isBalanceLoading && totalBalance > 0 && (
          <div
            className={
              depositClasses?.balanceContainer || "anyspend-deposit-balance border-theme-border-secondary border-b p-5"
            }
          >
            <p className={depositClasses?.balanceLabel || "anyspend-deposit-balance-label text-as-secondary text-sm"}>
              Your Balance
            </p>
            <p
              className={
                depositClasses?.balanceValue || "anyspend-deposit-balance-value text-as-primary text-3xl font-semibold"
              }
            >
              {formatDecimal(totalBalance)} <span className="text-sm">USD</span>
            </p>
          </div>
        )}
        <div className={depositClasses?.optionsContainer || "anyspend-deposit-options flex flex-col gap-2 p-6"}>
          {/* Loading state */}
          {isBalanceLoading && (
            <div className={depositClasses?.chainsSkeleton || "anyspend-deposit-chains-skeleton flex flex-col gap-2"}>
              {[1, 2].map((_, i) => (
                <div
                  key={i}
                  className={
                    depositClasses?.skeletonItem ||
                    "border-border-primary flex items-center justify-between rounded-xl border p-4"
                  }
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              ))}
            </div>
          )}

          {/* Top chains with balance */}
          {topChainsWithBalance.length > 0 && (
            <div className={depositClasses?.chainsContainer || "anyspend-deposit-chains flex flex-col gap-2"}>
              {topChainsWithBalance.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => handleSelectChain(chain.id)}
                  className={
                    depositClasses?.chainButton ||
                    "anyspend-deposit-chain-button border-border-primary hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
                  }
                >
                  <div className={depositClasses?.chainContent || "anyspend-deposit-chain-content"}>
                    <div className={depositClasses?.chainInfo || "anyspend-deposit-chain-info"}>
                      <span
                        className={
                          depositClasses?.chainName ||
                          "anyspend-deposit-chain-name text-as-primary flex items-center gap-1.5 font-medium"
                        }
                      >
                        Deposit from {chain.name}
                        <ChainIcon chainId={chain.id} className={depositClasses?.chainIcon || "h-5 w-5"} />
                      </span>
                      <p
                        className={
                          depositClasses?.chainBalance || "anyspend-deposit-chain-balance text-as-secondary text-xs"
                        }
                      >
                        {formatUsd(chain.balance)} available
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={
                      depositClasses?.chainChevron || "anyspend-deposit-chain-chevron text-as-secondary h-5 w-5"
                    }
                  />
                </button>
              ))}
            </div>
          )}

          {/* General deposit options */}
          <div className={depositClasses?.generalOptions || "anyspend-deposit-general-options flex flex-col gap-2"}>
            {/* Deposit Crypto - any chain */}
            <button
              onClick={handleSelectCrypto}
              className={
                depositClasses?.cryptoButton ||
                "anyspend-deposit-option-button anyspend-deposit-crypto-button border-border-primary hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
              }
            >
              <div className={depositClasses?.optionContent || "anyspend-deposit-option-content"}>
                <div className={depositClasses?.optionInfo || "anyspend-deposit-option-info"}>
                  <span
                    className={
                      depositClasses?.optionTitle || "anyspend-deposit-option-title text-as-primary font-medium"
                    }
                  >
                    Deposit Crypto
                  </span>
                  <p
                    className={
                      depositClasses?.optionDescription ||
                      "anyspend-deposit-option-description text-as-secondary text-xs"
                    }
                  >
                    Swap from any token on any chain
                  </p>
                </div>
              </div>
              <ChevronRight
                className={depositClasses?.optionChevron || "anyspend-deposit-option-chevron text-as-secondary h-5 w-5"}
              />
            </button>

            <div className={depositClasses?.divider || "anyspend-deposit-divider flex items-center gap-3"}>
              <div className={depositClasses?.dividerLine || "bg-as-stroke h-px flex-1"} />
              <span
                className={depositClasses?.dividerText || "anyspend-deposit-divider-text text-as-secondary text-sm"}
              >
                More options
              </span>
              <div className={depositClasses?.dividerLine || "bg-as-stroke h-px flex-1"} />
            </div>

            {/* Deposit with QR Code */}
            <button
              onClick={handleSelectQrDeposit}
              className={
                depositClasses?.qrButton ||
                "anyspend-deposit-option-button anyspend-deposit-qr-button border-border-primary hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
              }
            >
              <div
                className={depositClasses?.optionContent || "anyspend-deposit-option-content flex items-center gap-3"}
              >
                <QrCodeIcon className={depositClasses?.optionIcon || "anyspend-deposit-option-icon h-10 w-10"} />
                <div className={depositClasses?.optionInfo || "anyspend-deposit-option-info"}>
                  <span
                    className={
                      depositClasses?.optionTitle || "anyspend-deposit-option-title text-as-primary font-medium"
                    }
                  >
                    Deposit with QR Code
                  </span>
                  <p
                    className={
                      depositClasses?.optionDescription ||
                      "anyspend-deposit-option-description text-as-secondary text-xs"
                    }
                  >
                    Send tokens directly to deposit address
                  </p>
                </div>
              </div>
              <ChevronRight
                className={depositClasses?.optionChevron || "anyspend-deposit-option-chevron text-as-secondary h-5 w-5"}
              />
            </button>

            {/* Fund with Fiat */}
            <button
              onClick={handleSelectFiat}
              className={
                depositClasses?.fiatButton ||
                "anyspend-deposit-option-button anyspend-deposit-fiat-button border-border-primary hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all"
              }
            >
              <div
                className={depositClasses?.optionContent || "anyspend-deposit-option-content flex items-center gap-3"}
              >
                <CreditCardIcon className={depositClasses?.optionIcon || "anyspend-deposit-option-icon h-10 w-10"} />
                <div className={depositClasses?.optionInfo || "anyspend-deposit-option-info"}>
                  <span
                    className={
                      depositClasses?.optionTitle || "anyspend-deposit-option-title text-as-primary font-medium"
                    }
                  >
                    Fund with Fiat
                  </span>
                  <p
                    className={
                      depositClasses?.optionDescription ||
                      "anyspend-deposit-option-description text-as-secondary text-xs"
                    }
                  >
                    Pay with card or bank transfer
                  </p>
                </div>
              </div>
              <ChevronRight
                className={depositClasses?.optionChevron || "anyspend-deposit-option-chevron text-as-secondary h-5 w-5"}
              />
            </button>
          </div>

          {/* Chain-specific warning */}
          <ChainWarningText chainId={destinationTokenChainId} classes={classes?.chainWarningText || { root: "mt-2" }} />
        </div>
      </div>
    );
  }

  // QR Deposit view
  if (step === "qr-deposit") {
    return (
      <QRDeposit
        mode={mode}
        recipientAddress={recipientAddress}
        destinationToken={destinationToken}
        destinationChainId={destinationTokenChainId}
        depositContractConfig={depositContractConfig}
        onBack={handleBack}
        onClose={onClose ?? handleBack}
        classes={classes?.qrDeposit}
      />
    );
  }

  // Deposit view
  return (
    <div className={depositClasses?.form || "anyspend-deposit anyspend-deposit-form relative"}>
      {/* Back button - only show if we came from chain selection */}
      {shouldShowChainSelection && (
        <button
          onClick={handleBack}
          className={
            depositClasses?.backButton ||
            "anyspend-deposit-back-button text-as-secondary hover:text-as-primary absolute left-4 top-4 z-10 flex items-center gap-1"
          }
        >
          <svg
            className={depositClasses?.backIcon || "anyspend-deposit-back-icon h-5 w-5"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className={depositClasses?.backText || "anyspend-deposit-back-text text-sm"}>Back</span>
        </button>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className={
            depositClasses?.closeButton ||
            "anyspend-deposit-close-button text-as-secondary hover:text-as-primary absolute right-4 top-4 z-10"
          }
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div
        className={
          depositClasses?.formContent || cn("anyspend-deposit-form-content", shouldShowChainSelection && "pt-8")
        }
      >
        {isCustomDeposit ? (
          <AnySpendCustomExactIn
            key={selectedChainId}
            loadOrder={loadOrder}
            mode={mode}
            recipientAddress={recipientAddress}
            paymentType={paymentType}
            sourceTokenAddress={sourceTokenAddress}
            sourceTokenChainId={selectedChainId}
            destinationToken={destinationToken}
            destinationChainId={destinationTokenChainId}
            orderType={effectiveOrderType}
            minDestinationAmount={minDestinationAmount}
            header={header ?? defaultHeader}
            onSuccess={onSuccess}
            onOpenCustomModal={onOpenCustomModal}
            mainFooter={mainFooter}
            onTokenSelect={onTokenSelect}
            customUsdInputValues={customUsdInputValues}
            preferEoa={preferEoa}
            customExactInConfig={depositContractConfig}
            returnToHomeUrl={returnToHomeUrl}
            customRecipientLabel={customRecipientLabel}
            returnHomeLabel={returnHomeLabel}
            classes={classes?.customExactIn}
          />
        ) : (
          <AnySpend
            key={selectedChainId}
            loadOrder={loadOrder}
            mode={mode}
            defaultActiveTab={paymentType}
            recipientAddress={recipientAddress}
            sourceChainId={selectedChainId}
            destinationTokenAddress={destinationTokenAddress}
            destinationTokenChainId={destinationTokenChainId}
            onSuccess={txHash => onSuccess?.(txHash ?? "")}
            onTokenSelect={onTokenSelect}
            customUsdInputValues={customUsdInputValues}
            hideHeader
            hideBottomNavigation
            disableUrlParamManagement
            returnToHomeUrl={returnToHomeUrl}
            customRecipientLabel={customRecipientLabel}
            returnHomeLabel={returnHomeLabel}
            classes={classes?.anySpend}
          />
        )}
      </div>

      {/* Chain-specific warning */}
      <ChainWarningText
        chainId={destinationTokenChainId}
        classes={classes?.chainWarningText || { root: "px-4 pb-4" }}
      />
    </div>
  );
}
