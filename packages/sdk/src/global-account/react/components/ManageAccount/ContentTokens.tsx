import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend";
import { ChainTokenIcon } from "@b3dotfun/sdk/anyspend/react/components/common/ChainTokenIcon";
import {
  Button,
  TransitionPanel,
  useSimBalance,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { ArrowLeft, CircleHelp, Copy, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";
import { SimBalanceItem } from "../../hooks/useSimBalance";

// Panel view enum for managing navigation between token list and send form
enum TokenPanelView {
  LIST = 0, // Show list of user's tokens
  SEND = 1, // Show send token form
}

interface ContentTokensProps {
  activeTab: string;
}

/**
 * ContentTokens Component
 *
 * Displays user's token balances with ability to send tokens. Features:
 * - Animated transitions between token list and send form
 * - Smart filtering (shows all tokens when ≤5 valuable tokens or no $1+ tokens)
 * - NumericFormat inputs for proper number handling
 * - Focus preservation during transitions (see render functions pattern below)
 */
export function ContentTokens({ activeTab }: ContentTokensProps) {
  // === TOKEN FILTERING STATE ===
  const [showAllTokens, setShowAllTokens] = useState(false);

  // === NAVIGATION STATE ===
  const [tokenPanelView, setTokenPanelView] = useState<TokenPanelView>(TokenPanelView.LIST);

  // === SEND FORM STATE ===
  const [selectedToken, setSelectedToken] = useState<SimBalanceItem | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState("");

  // === ANIMATION STATE ===
  // CRITICAL: useRef for animation direction prevents component remounting
  // This ensures input focus is preserved during panel transitions
  const animationDirection = useRef<"forward" | "back" | null>(null);

  // === DATA FETCHING ===
  const account = useActiveAccount();
  const { data: simBalance, refetch: refetchSimBalance, isLoading: isLoadingBalance } = useSimBalance(account?.address);

  // === BLOCKCHAIN INTERACTION ===
  const { switchChainAndExecute } = useUnifiedChainSwitchAndExecute();

  // === ADDRESS VALIDATION ===
  // Handle recipient address change with real-time validation using viem
  const handleRecipientAddressChange = (value: string) => {
    setRecipientAddress(value);
    // Only show error if user has typed something and it's invalid
    // Using viem's isAddress for robust EVM address validation
    if (value && !isAddress(value)) {
      setAddressError("Please enter a valid EVM address (0x...)");
    } else {
      setAddressError("");
    }
  };

  // === TAB RESET EFFECT ===
  // Reset all state when user switches away from tokens tab
  useEffect(() => {
    if (activeTab !== "tokens") {
      setTokenPanelView(TokenPanelView.LIST);
      setSelectedToken(null);
      setRecipientAddress("");
      setSendAmount("");
      setIsSending(false);
      setAddressError("");
      animationDirection.current = null;
    }
  }, [activeTab]);

  // === HELPER FUNCTION ===
  // Get current version of selected token from fresh balance data
  // 🔧 FIX: Prevents auto-navigation back to token list when balance refreshes
  // The useSimBalance hook refreshes data, creating new token object references
  // This helper ensures we always get the fresh token data instead of stale references
  const getCurrentSelectedToken = (): SimBalanceItem | null => {
    if (!selectedToken || !simBalance?.balances) {
      return null;
    }

    const found = simBalance.balances.find(
      token => token.chain_id === selectedToken.chain_id && token.address === selectedToken.address,
    );

    return found || null;
  };

  // ==================================================================================
  // === RENDER FUNCTIONS (NOT COMPONENTS!) ===
  // ==================================================================================
  //
  // 🚨 CRITICAL ARCHITECTURE DECISION:
  // These are render functions, NOT component functions with useCallback!
  //
  // WHY THIS WORKS:
  // ✅ Stable wrapper <div> elements with consistent keys
  // ✅ React never sees these as "new components"
  // ✅ Input focus is preserved during transitions
  // ✅ No component remounting issues
  //
  // WHY useCallback DIDN'T WORK:
  // ❌ useCallback(() => <JSX />, [deps]) still creates new component instances
  // ❌ React treats each render as a different component
  // ❌ Causes remounting and focus loss
  //
  // THE PATTERN:
  // Instead of: {[<ComponentA />, <ComponentB />]}
  // We use:    {[<div key="a">{renderA()}</div>, <div key="b">{renderB()}</div>]}
  // ==================================================================================

  /**
   * Renders the send token form panel
   * Includes recipient input, amount input with NumericFormat, and percentage buttons
   */
  const renderSendTokenPanel = () => {
    // Get fresh token data to prevent stale references
    const currentToken = getCurrentSelectedToken();

    // 🔧 SINGLE FALLBACK STRATEGY:
    // Use fresh token data when available, fall back to selectedToken if needed
    // This prevents duplication of "currentToken || selectedToken" throughout the component
    const displayToken = currentToken || selectedToken;

    // Handle percentage button clicks (25%, 50%, 75%, 100%)
    const handlePercentageClick = (percentage: number) => {
      if (displayToken) {
        const tokenBalance = (BigInt(displayToken.amount) * BigInt(percentage)) / BigInt(100);
        const amount = formatTokenAmount(tokenBalance, displayToken.decimals, 30, false);
        setSendAmount(amount);
      }
    };

    // Execute token transfer transaction
    const handleSend = async () => {
      if (!displayToken || !recipientAddress || !sendAmount || parseFloat(sendAmount) <= 0) {
        return;
      }

      setIsSending(true);

      const amountInWei = parseUnits(sendAmount, displayToken.decimals);

      try {
        const sendTokenData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipientAddress, amountInWei],
        });

        const tx = await switchChainAndExecute(displayToken.chain_id, {
          to: displayToken.address === "native" ? recipientAddress : displayToken.address,
          data: sendTokenData,
          value: displayToken.address === "native" ? amountInWei : 0n,
        });

        if (tx) {
          // Reset form
          setSendAmount("");
        }
      } catch (error: any) {
        // Error
        toast.error(`Failed to send ${displayToken.symbol}: ${error.message || "Unknown error"}`);
      } finally {
        // Wait 1 second to make sure the tx is indexed on sim api.
        setTimeout(async () => {
          // Force refetch to bypass cache and get fresh balance data
          await refetchSimBalance();
        }, 1000);
        setIsSending(false);
      }
    };

    // Show loading state only if no token data is available at all
    if (!displayToken) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-b3-line/50 mb-4 rounded-full p-4">
            <Loader2 className="text-b3-foreground-muted h-8 w-8 animate-spin" />
          </div>
          <h3 className="text-b3-grey font-neue-montreal-semibold mb-2">Loading token data...</h3>
          <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
            Please wait while we fetch the latest information
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              animationDirection.current = "back";
              setTokenPanelView(TokenPanelView.LIST);
            }}
            className="hover:bg-b3-line/60"
            disabled={isSending}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center">
              {ALL_CHAINS[displayToken.chain_id]?.logoUrl ? (
                <ChainTokenIcon
                  chainUrl={ALL_CHAINS[displayToken.chain_id].logoUrl}
                  tokenUrl={displayToken.token_metadata?.logo}
                  className="size-8"
                />
              ) : (
                <CircleHelp className="text-b3-react-foreground size-8" />
              )}
            </div>
            <h2 className="text-b3-grey font-neue-montreal-semibold text-lg">Send {displayToken.symbol}</h2>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="space-y-2">
          <label className="text-b3-grey font-neue-montreal-medium text-sm">Recipient Address</label>
          <div className="space-y-1">
            <div className="relative">
              <input
                type="text"
                value={recipientAddress}
                onChange={e => handleRecipientAddressChange(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className={`border-b3-line bg-b3-background text-b3-grey font-neue-montreal-medium placeholder:text-b3-foreground-muted w-full rounded-xl border px-4 py-3 pr-12 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  addressError ? "border-red-500 focus:border-red-500" : "focus:border-b3-primary-blue"
                }`}
                disabled={isSending}
              />
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-b3-line/60 absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                disabled={isSending}
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    handleRecipientAddressChange(text);
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {addressError && <p className="font-neue-montreal-medium text-xs text-red-500">{addressError}</p>}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-b3-grey font-neue-montreal-medium text-sm">Amount</label>
          <div className="space-y-3">
            <NumericFormat
              decimalSeparator="."
              allowedDecimalSeparators={[","]}
              thousandSeparator
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              placeholder="0.00"
              minLength={1}
              maxLength={30}
              spellCheck="false"
              className="border-b3-line bg-b3-background text-b3-grey font-neue-montreal-medium placeholder:text-b3-foreground-muted focus:border-b3-primary-blue w-full rounded-xl border px-4 py-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              pattern="^[0-9]*[.,]?[0-9]*$"
              disabled={isSending}
              value={sendAmount}
              allowNegative={false}
              onChange={e => setSendAmount(e.currentTarget.value)}
            />

            {/* Percentage buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map(percentage => (
                <Button
                  key={percentage}
                  variant="outline"
                  onClick={() => handlePercentageClick(percentage)}
                  className="hover:bg-b3-primary-wash border-b3-line text-b3-grey font-neue-montreal-medium text-sm"
                  disabled={isSending}
                >
                  {percentage}%
                </Button>
              ))}
            </div>

            {/* Available balance */}
            <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
              Available: {formatTokenAmount(BigInt(displayToken.amount), displayToken.decimals)} {displayToken.symbol}
            </div>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={
            !recipientAddress ||
            !sendAmount ||
            parseFloat(sendAmount) <= 0 ||
            isSending ||
            !!addressError ||
            !isAddress(recipientAddress)
          }
          className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold disabled:bg-b3-line disabled:text-b3-foreground-muted w-full rounded-xl py-3 text-white"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {displayToken.symbol}
            </>
          )}
        </Button>
      </div>
    );
  };

  // Skeleton loading component for token list
  const LoadingIndicator = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="bg-b3-line h-10 w-10 animate-pulse rounded-full"></div>
              <div>
                <div className="bg-b3-line mb-1 h-4 w-16 animate-pulse rounded"></div>
                <div className="bg-b3-line h-3 w-24 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-b3-line mb-1 h-4 w-20 animate-pulse rounded"></div>
              <div className="bg-b3-line h-3 w-16 animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Renders the token list panel with smart filtering
   * Features intelligent token display logic to reduce noise while ensuring visibility
   */
  const renderTokenListPanel = () => {
    // Show loading indicator when balance is loading
    if (isLoadingBalance) {
      return <LoadingIndicator />;
    }

    // Show empty state when no account or no balance data
    if (!account?.address || !simBalance) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-b3-line/50 mb-4 rounded-full p-4">
            <Loader2 className="text-b3-foreground-muted h-8 w-8" />
          </div>
          <h3 className="text-b3-grey font-neue-montreal-semibold mb-2">No wallet connected</h3>
          <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
            Connect your wallet to view token balances
          </p>
        </div>
      );
    }

    // === SMART FILTERING LOGIC ===
    // Filter tokens with value >= $1 to reduce noise from dust tokens
    const filteredTokens =
      simBalance?.balances.filter(token => token.value_usd !== undefined && token.value_usd >= 1) || [];

    // 🧠 INTELLIGENT DISPLAY LOGIC:
    // Show all tokens automatically when filtering would be unhelpful:
    // 1. User explicitly requested to show all, OR
    // 2. No tokens with value >= $1 (user has only dust), OR
    // 3. 5 or fewer tokens with value >= $1 (not enough to warrant filtering)
    const shouldShowAllTokens = showAllTokens || filteredTokens.length === 0 || filteredTokens.length <= 5;
    const tokensToShow = shouldShowAllTokens ? simBalance?.balances || [] : filteredTokens;
    const hasHiddenTokens = !shouldShowAllTokens && (simBalance?.balances.length || 0) > filteredTokens.length;

    // Handle token selection and navigate to send form
    const handleTokenClick = (token: SimBalanceItem) => {
      setSelectedToken(token);
      animationDirection.current = "forward"; // Set animation direction BEFORE state change
      setTokenPanelView(TokenPanelView.SEND);
      // Reset form when selecting a new token
      setRecipientAddress("");
      setSendAmount("");
      setIsSending(false);
      setAddressError("");
    };

    // Show empty state when no tokens are available
    if (tokensToShow.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-b3-line/50 mb-4 rounded-full p-4">
            <CircleHelp className="text-b3-foreground-muted h-8 w-8" />
          </div>
          <h3 className="text-b3-grey font-neue-montreal-semibold mb-2">No tokens found</h3>
          <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
            No token balances found in your wallet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          {tokensToShow.map(token => (
            <div
              key={token.chain_id + "_" + token.address}
              className="hover:bg-b3-line/60 dark:hover:bg-b3-primary-wash/40 group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-all duration-200"
              onClick={() => handleTokenClick(token)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full">
                  {ALL_CHAINS[token.chain_id]?.logoUrl ? (
                    <ChainTokenIcon
                      chainUrl={ALL_CHAINS[token.chain_id].logoUrl}
                      tokenUrl={token.token_metadata?.logo}
                      className="size-10"
                    />
                  ) : (
                    <CircleHelp className="text-b3-react-foreground size-10" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-b3-grey font-neue-montreal-semibold transition-colors duration-200 group-hover:font-bold group-hover:text-black">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm transition-colors duration-200 group-hover:text-gray-700">
                    {token.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-b3-grey font-neue-montreal-semibold transition-colors duration-200 group-hover:font-bold group-hover:text-black">
                  {formatTokenAmount(BigInt(token.amount), token.decimals)}
                </div>
                <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm transition-colors duration-200 group-hover:text-gray-700">
                  {formatDisplayNumber(token.value_usd, { style: "currency", fractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasHiddenTokens && !showAllTokens && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="text-b3-primary-blue hover:text-b3-primary-blue/80 font-neue-montreal-semibold text-sm"
              onClick={() => setShowAllTokens(true)}
            >
              Show more
            </Button>
          </div>
        )}
      </div>
    );
  };

  // === ANIMATION CONFIGURATION ===
  // Memoize variants to prevent re-creation and unwanted re-renders
  const variants = useMemo(
    () => ({
      enter: (direction: "forward" | "back" | null) => ({
        x: direction === "back" ? -300 : 300, // Back: slide from left, Forward: slide from right
        opacity: 0,
      }),
      center: { x: 0, opacity: 1 }, // Final position: centered and visible
      exit: (direction: "forward" | "back" | null) => ({
        x: direction === "back" ? 300 : -300, // Back: slide to right, Forward: slide to left
        opacity: 0,
      }),
    }),
    [],
  );

  // Memoize transition config for consistent spring animation
  const transition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 300, // Spring tension
      damping: 30, // Spring damping
    }),
    [],
  );

  return (
    <TransitionPanel
      activeIndex={tokenPanelView}
      className="min-h-[400px]"
      custom={animationDirection.current} // Pass direction to functional variants
      variants={variants}
      transition={transition}
    >
      {/*
        🎯 THE STABLE ELEMENT PATTERN:
        Using stable <div> wrappers with consistent keys ensures React never remounts
        the containers, preserving input focus during animations.
        The content inside can change freely via render functions.
      */}
      {[<div key="token-list">{renderTokenListPanel()}</div>, <div key="send-token">{renderSendTokenPanel()}</div>]}
    </TransitionPanel>
  );
}
