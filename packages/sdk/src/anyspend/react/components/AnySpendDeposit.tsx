import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { Skeleton, useAccountWallet, useSimBalance } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import {
  NetworkArbitrumOne,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygonPos,
} from "@web3icons/react";
import { ChevronRight, CreditCard, QrCode, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { AnySpendCustomExactIn } from "./AnySpendCustomExactIn";
import { QRDeposit } from "./QRDeposit";

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
  /** The destination token to receive */
  destinationToken: components["schemas"]["Token"];
  /** The destination chain ID */
  destinationChainId: number;
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
  orderType?: "hype_duel" | "custom_exact_in";
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
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

// Chain icon component
function ChainIcon({ chainId, className }: { chainId: number; className?: string }) {
  const iconProps = { className: cn("h-5 w-5", className) };

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
 *   destinationToken={myToken}
 *   destinationChainId={base.id}
 *   onSuccess={(amount) => console.log(`Deposited ${amount}`)}
 * />
 *
 * @example
 * // Skip chain selection by providing sourceTokenChainId
 * <AnySpendDeposit
 *   recipientAddress={userAddress}
 *   destinationToken={myToken}
 *   destinationChainId={base.id}
 *   sourceTokenChainId={base.id}
 *   onSuccess={(amount) => console.log(`Deposited ${amount}`)}
 * />
 *
 * @example
 * // Deposit with custom contract
 * <AnySpendDeposit
 *   recipientAddress={userAddress}
 *   destinationToken={myToken}
 *   destinationChainId={base.id}
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
  destinationToken,
  destinationChainId,
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
}: AnySpendDepositProps) {
  const { connectedEOAWallet } = useAccountWallet();
  const eoaAddress = connectedEOAWallet?.getAccount()?.address;

  // Determine if we should show chain selection
  const shouldShowChainSelection = showChainSelection ?? (!initialSourceChainId && !initialPaymentType);

  const [step, setStep] = useState<DepositStep>(shouldShowChainSelection ? "select-chain" : "deposit");
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>(initialSourceChainId);
  const [paymentType, setPaymentType] = useState<"crypto" | "fiat">(initialPaymentType ?? "crypto");

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

  const tokenSymbol = destinationToken.symbol ?? "TOKEN";

  // Determine order type based on config
  const effectiveOrderType = orderType ?? "custom_exact_in";

  // Default header if not provided
  const defaultHeader = () => (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">
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
        className={cn(
          "anyspend-container font-inter bg-as-surface-primary mx-auto w-full max-w-[460px]",
          mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
        )}
      >
        <div className="border-secondary border-b p-5">
          {/* Balance header */}
          {!isBalanceLoading && totalBalance > 0 && (
            <div className="">
              <p className="text-as-secondary text-sm">Your Balance</p>
              <p className="text-as-primary text-2xl font-semibold">
                {formatUsd(totalBalance)} <span className="text-as-secondary text-sm">USD</span>
              </p>
            </div>
          )}
          {isBalanceLoading && (
            <div className="">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 p-6">
          {/* Loading state */}
          {isBalanceLoading && (
            <div className="flex flex-col gap-2">
              {[...Array(topChainsCount)].map((_, i) => (
                <div key={i} className="border-as-stroke flex items-center justify-between rounded-xl border p-4">
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
            <div className="flex flex-col gap-2">
              {topChainsWithBalance.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => handleSelectChain(chain.id)}
                  className="border-as-stroke hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ChainIcon chainId={chain.id} className="h-6 w-6" />
                    <div>
                      <span className="text-as-primary font-medium">Deposit from {chain.name}</span>
                      <p className="text-as-secondary text-xs">{formatUsd(chain.balance)} available</p>
                    </div>
                  </div>
                  <ChevronRight className="text-as-secondary h-5 w-5" />
                </button>
              ))}
            </div>
          )}

          {/* General deposit options */}
          <div className="flex flex-col gap-2">
            {/* Deposit Crypto - any chain */}
            <button
              onClick={handleSelectCrypto}
              className="border-as-stroke hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-as-surface-secondary flex h-6 w-6 items-center justify-center rounded-full">
                  <Wallet className="text-as-primary h-4 w-4" />
                </div>
                <div>
                  <span className="text-as-primary font-medium">Deposit Crypto</span>
                  <p className="text-as-secondary text-xs">Swap from any token on any chain</p>
                </div>
              </div>
              <ChevronRight className="text-as-secondary h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-as-stroke h-px flex-1" />
              <span className="text-as-secondary text-sm">More options</span>
              <div className="bg-as-stroke h-px flex-1" />
            </div>

            {/* Deposit with QR Code */}
            <button
              onClick={handleSelectQrDeposit}
              className="border-as-stroke hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-as-surface-secondary flex h-6 w-6 items-center justify-center rounded-full">
                  <QrCode className="text-as-primary h-4 w-4" />
                </div>
                <div>
                  <span className="text-as-primary font-medium">Deposit with QR Code</span>
                  <p className="text-as-secondary text-xs">Send tokens directly to deposit address</p>
                </div>
              </div>
              <ChevronRight className="text-as-secondary h-5 w-5" />
            </button>

            {/* Fund with Fiat */}
            <button
              onClick={handleSelectFiat}
              className="border-as-stroke hover:border-as-brand hover:bg-as-surface-secondary flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-as-surface-secondary flex h-6 w-6 items-center justify-center rounded-full">
                  <CreditCard className="text-as-primary h-4 w-4" />
                </div>
                <div>
                  <span className="text-as-primary font-medium">Fund with Fiat</span>
                  <p className="text-as-secondary text-xs">Pay with card or bank transfer</p>
                </div>
              </div>
              <ChevronRight className="text-as-secondary h-5 w-5" />
            </button>
          </div>
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
        destinationChainId={destinationChainId}
        depositContractConfig={depositContractConfig}
        onBack={handleBack}
        onClose={handleBack}
      />
    );
  }

  // Deposit view
  return (
    <div className="relative">
      {/* Back button - only show if we came from chain selection */}
      {shouldShowChainSelection && (
        <button
          onClick={handleBack}
          className="text-as-secondary hover:text-as-primary absolute left-4 top-4 z-10 flex items-center gap-1"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
      )}

      <div className={cn(shouldShowChainSelection && "pt-8")}>
        <AnySpendCustomExactIn
          loadOrder={loadOrder}
          mode={mode}
          recipientAddress={recipientAddress}
          paymentType={paymentType}
          sourceTokenAddress={sourceTokenAddress}
          sourceTokenChainId={selectedChainId}
          destinationToken={destinationToken}
          destinationChainId={destinationChainId}
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
        />
      </div>
    </div>
  );
}
