"use client";

import {
  eqci,
  getChainName,
  getDefaultToken,
  getExplorerTxUrl,
  getHyperliquidUSDCToken,
  HYPERLIQUID_CHAIN_ID,
  HYPERLIQUID_USDC_ADDRESS,
  USDC_BASE,
  ZERO_ADDRESS,
} from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useGasPrice,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import {
  Button,
  ShinyButton,
  StyleRoot,
  TabsPrimitive,
  toast,
  TransitionPanel,
  useAccountWallet,
  useAuth,
  useAuthStore,
  useB3Config,
  useModalStore,
  useProfile,
  useRouter,
  useSearchParamsSSR,
  useTokenBalanceDirect,
  useTokenData,
  useTokenFromUrl,
} from "@b3dotfun/sdk/global-account/react";
import BottomNavigation from "@b3dotfun/sdk/global-account/react/components/ManageAccount/BottomNavigation";
import { useAccountWalletImage } from "@b3dotfun/sdk/global-account/react/hooks/useAccountWallet";
import { getThirdwebChain } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { ArrowDown, HistoryIcon, Loader2 } from "lucide-react";
import { AnimatedCheckmark } from "./icons/AnimatedCheckmark";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { base, mainnet } from "viem/chains";
import { components } from "../../types/api";
import { useAutoSelectCryptoPaymentMethod } from "../hooks/useAutoSelectCryptoPaymentMethod";
import { useConnectedWalletDisplay } from "../hooks/useConnectedWalletDisplay";
import { useCryptoPaymentMethodState } from "../hooks/useCryptoPaymentMethodState";
import { useDirectTransfer } from "../hooks/useDirectTransfer";
import { useOnOrderSuccess } from "../hooks/useOnOrderSuccess";
import { useRecipientAddressState } from "../hooks/useRecipientAddressState";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "./AnySpendFingerprintWrapper";
import { CryptoPaymentMethod, CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { CryptoPaySection } from "./common/CryptoPaySection";
import { CryptoReceiveSection } from "./common/CryptoReceiveSection";
import { FeeDetailPanel } from "./common/FeeDetailPanel";
import { FiatPaymentMethod, FiatPaymentMethodComponent } from "./common/FiatPaymentMethod";
import { GasIndicator } from "./common/GasIndicator";
import { OrderDetails, OrderDetailsLoadingView } from "./common/OrderDetails";
import { OrderHistory } from "./common/OrderHistory";
import { KycGate } from "./checkout/KycGate";
import { LoginStep } from "@b3dotfun/sdk/global-account/react/components/SignInWithB3/steps/LoginStep";
import { PanelOnramp } from "./common/PanelOnramp";
import { PanelOnrampPayment } from "./common/PanelOnrampPayment";
import { PointsDetailPanel } from "./common/PointsDetailPanel";
import { RecipientSelection } from "./common/RecipientSelection";
import { TabSection } from "./common/TabSection";
import { AnySpendCustomizationProvider, useAnySpendCustomization } from "./context/AnySpendCustomizationContext";
import type { AnySpendClasses } from "./types/classes";
import type { AnySpendContent, AnySpendSlots, AnySpendTheme } from "./types/customization";

const baseChain = getThirdwebChain(8453);

export interface RecipientOption {
  address: string;
  icon?: string;
  label: string;
  ensName?: string;
}

export enum PanelView {
  MAIN,
  HISTORY,
  ORDER_DETAILS,
  LOADING,
  FIAT_PAYMENT,
  RECIPIENT_SELECTION,
  CRYPTO_PAYMENT_METHOD,
  FIAT_PAYMENT_METHOD,
  POINTS_DETAIL,
  FEE_DETAIL,
  DIRECT_TRANSFER_SUCCESS,
  FIAT_KYC,
  FIAT_AUTH,
}

const ANYSPEND_RECIPIENTS_KEY = "anyspend_recipients";

export function AnySpend(props: {
  mode?: "page" | "modal";
  defaultActiveTab?: "crypto" | "fiat";
  sourceChainId?: number;
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  recipientAddress?: string;
  loadOrder?: string;
  hideTransactionHistoryButton?: boolean;
  /**
   * Called when a token is selected. Call event.preventDefault() to prevent default token selection behavior.
   * Useful for handling special cases like B3 token selection.
   */
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  onSuccess?: (txHash?: string) => void;
  customUsdInputValues?: string[];
  hideHeader?: boolean;
  hideBottomNavigation?: boolean;
  /** When true, disables URL parameter management for swap configuration */
  disableUrlParamManagement?: boolean;
  /** Custom URL to redirect to when clicking "Return to Home" on complete order screen */
  returnToHomeUrl?: string;
  /** Custom label for recipient display (e.g., "OBSN Telegram Bot") */
  customRecipientLabel?: string;
  /** Custom label for the return home button (overrides "Return to Home" / "Close") */
  returnHomeLabel?: string;
  /** Custom class names for styling specific elements */
  classes?: AnySpendClasses;
  /** When true, allows direct transfer without swap if source and destination token/chain are the same */
  allowDirectTransfer?: boolean;
  /** Fixed destination token amount (in wei/smallest unit). When provided, user cannot change the amount. */
  destinationTokenAmount?: string;
  /** Opaque metadata passed to the order for callbacks (e.g., workflow form data) */
  callbackMetadata?: Record<string, unknown>;
  /** Optional sender (payer) address — pre-fills token balances when the user address is known ahead of time */
  senderAddress?: string;
  /** Render function overrides for replaceable UI elements */
  slots?: AnySpendSlots;
  /** String or ReactNode overrides for text/messages */
  content?: AnySpendContent;
  /** Structured color/theme configuration */
  theme?: AnySpendTheme;
}) {
  const fingerprintConfig = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <AnySpendCustomizationProvider slots={props.slots} content={props.content} theme={props.theme}>
        <AnySpendInner {...props} />
      </AnySpendCustomizationProvider>
    </AnySpendFingerprintWrapper>
  );
}

function AnySpendInner({
  sourceChainId,
  destinationTokenAddress,
  destinationTokenChainId,
  mode = "modal",
  defaultActiveTab = "crypto",
  loadOrder,
  hideTransactionHistoryButton,
  recipientAddress: recipientAddressFromProps,
  onTokenSelect,
  onSuccess,
  customUsdInputValues,
  hideHeader,
  hideBottomNavigation = false,
  disableUrlParamManagement = false,
  returnToHomeUrl,
  customRecipientLabel,
  returnHomeLabel,
  classes,
  allowDirectTransfer = false,
  destinationTokenAmount,
  callbackMetadata,
  senderAddress,
}: {
  sourceChainId?: number;
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  mode?: "page" | "modal";
  defaultActiveTab?: "crypto" | "fiat";
  loadOrder?: string;
  hideTransactionHistoryButton?: boolean;
  recipientAddress?: string;
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  onSuccess?: (txHash?: string) => void;
  customUsdInputValues?: string[];
  hideHeader?: boolean;
  hideBottomNavigation?: boolean;
  disableUrlParamManagement?: boolean;
  returnToHomeUrl?: string;
  customRecipientLabel?: string;
  returnHomeLabel?: string;
  classes?: AnySpendClasses;
  allowDirectTransfer?: boolean;
  destinationTokenAmount?: string;
  callbackMetadata?: Record<string, unknown>;
  senderAddress?: string;
  slots?: AnySpendSlots;
  content?: AnySpendContent;
  theme?: AnySpendTheme;
}) {
  const { slots, content } = useAnySpendCustomization();
  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  const { partnerId } = useB3Config();
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const { isAuthenticated } = useAuth();
  // KYC approval is tracked per-session so we only prompt the wallet
  // signature when the user actually clicks Buy, not on panel mount.
  // useRef so handleFiatOrder can read the updated value synchronously
  // in the same frame that onStatusResolved sets it (setState is async).
  const kycApprovedRef = useRef(false);

  // Determine if we're in "buy mode" based on whether destination token props are provided
  const isBuyMode = !!(destinationTokenAddress && destinationTokenChainId);

  // Add refs to track URL state
  const initialUrlProcessed = useRef(false);
  const lastUrlUpdate = useRef<{
    tab: string;
    fromChainId?: string;
    fromCurrency?: string;
    fromName?: string;
    fromSymbol?: string;
    fromLogo?: string;
    fromAmount?: string;
    toChainId: string;
    toCurrency: string;
    toName?: string;
    toSymbol?: string;
    toLogo?: string;
    toAmount?: string;
  } | null>(null);

  // Track animation direction for TransitionPanel
  const animationDirection = useRef<"forward" | "back" | null>(null);
  // Track previous panel for proper back navigation
  const previousPanel = useRef<PanelView>(PanelView.MAIN);

  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">(defaultActiveTab);

  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);
  const [directTransferTxHash, setDirectTransferTxHash] = useState<string | undefined>();
  const { orderAndTransactions: oat, getOrderAndTransactionsError } = useAnyspendOrderAndTransactions(orderId);
  !!getOrderAndTransactionsError && console.log("getOrderAndTransactionsError", getOrderAndTransactionsError);

  const [activePanel, setActivePanel] = useState<PanelView>(loadOrder ? PanelView.ORDER_DETAILS : PanelView.MAIN);

  // Helper functions to navigate with animation direction
  const navigateToPanel = useCallback(
    (panel: PanelView, direction: "forward" | "back" = "forward") => {
      previousPanel.current = activePanel;
      animationDirection.current = direction;
      setActivePanel(panel);
    },
    [activePanel],
  );

  const navigateBack = useCallback(() => {
    animationDirection.current = "back";
    // Navigate back to previous panel or default to MAIN
    const targetPanel = previousPanel.current !== activePanel ? previousPanel.current : PanelView.MAIN;
    setActivePanel(targetPanel);
  }, [activePanel]);
  const [customRecipients, setCustomRecipients] = useState<RecipientOption[]>([]);

  // Payment method state with dual-state system (auto + explicit user selection)
  const {
    cryptoPaymentMethod,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    effectiveCryptoPaymentMethod,
    resetPaymentMethods,
  } = useCryptoPaymentMethodState();

  const [selectedFiatPaymentMethod, setSelectedFiatPaymentMethod] = useState<FiatPaymentMethod>(FiatPaymentMethod.NONE);
  // const [newRecipientAddress, setNewRecipientAddress] = useState("");
  // const recipientInputRef = useRef<HTMLInputElement>(null);

  // Get initial chain IDs from URL or defaults
  const initialSrcChainId = sourceChainId || parseInt(searchParams.get("fromChainId") || "0") || mainnet.id;
  const initialDstChainId =
    parseInt(searchParams.get("toChainId") || "0") || (isBuyMode ? destinationTokenChainId : base.id);

  // State for source chain/token selection
  const [selectedSrcChainId, setSelectedSrcChainId] = useState<number>(initialSrcChainId);
  const defaultSrcToken = getDefaultToken(selectedSrcChainId);
  const srcTokenFromUrl = useTokenFromUrl({
    defaultToken: defaultSrcToken,
    prefix: "from",
  });
  // When sourceChainId prop is explicitly provided and differs from URL token's chain,
  // use the default token for the new chain (handles chain selection in AnySpendDeposit)
  const effectiveSrcToken =
    sourceChainId && srcTokenFromUrl.chainId !== sourceChainId ? defaultSrcToken : srcTokenFromUrl;
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(effectiveSrcToken);
  const { data: srcTokenMetadata } = useTokenData(selectedSrcToken?.chainId, selectedSrcToken?.address);
  const [srcAmount, setSrcAmount] = useState<string>(searchParams.get("fromAmount") || "0");

  // State for onramp amount
  const [srcAmountOnRamp, setSrcAmountOnRamp] = useState<string>(searchParams.get("fromAmount") || "5");

  // State for destination chain/token selection
  const [selectedDstChainId, setSelectedDstChainId] = useState<number>(initialDstChainId);
  // Helper to check if address is Hyperliquid USDC (supports both 34-char and 42-char formats)
  const isHyperliquidUSDCAddress = (address?: string) =>
    eqci(address, HYPERLIQUID_USDC_ADDRESS) || eqci(address, ZERO_ADDRESS);

  const defaultDstToken = isBuyMode
    ? // Special case: Hyperliquid uses zero address for USDC
      destinationTokenChainId === HYPERLIQUID_CHAIN_ID && isHyperliquidUSDCAddress(destinationTokenAddress)
      ? getHyperliquidUSDCToken()
      : {
          symbol: "",
          chainId: destinationTokenChainId,
          address: destinationTokenAddress,
          name: "",
          decimals: 18,
          metadata: {},
        }
    : getDefaultToken(selectedDstChainId);
  const dstTokenFromUrl = useTokenFromUrl({
    defaultToken: defaultDstToken,
    prefix: "to",
  });
  const [selectedDstToken, setSelectedDstToken] = useState<components["schemas"]["Token"]>(
    isBuyMode ? defaultDstToken : dstTokenFromUrl,
  );
  const { data: dstTokenMetadata } = useTokenData(selectedDstToken?.chainId, selectedDstToken?.address);
  const [dstAmount, setDstAmount] = useState<string>(searchParams.get("toAmount") || "");

  const [isSrcInputDirty, setIsSrcInputDirty] = useState(true);
  // Add refs to track if we've applied metadata
  const appliedSrcMetadataRef = useRef(false);
  const appliedDstMetadataRef = useRef(false);

  // Update source token with metadata
  useEffect(() => {
    if (selectedSrcToken && srcTokenMetadata && !appliedSrcMetadataRef.current) {
      // Mark as applied
      appliedSrcMetadataRef.current = true;

      const enhancedToken = {
        ...selectedSrcToken,
        decimals: srcTokenMetadata.decimals || selectedSrcToken.decimals,
        symbol: srcTokenMetadata.symbol || selectedSrcToken.symbol,
        name: srcTokenMetadata.name || selectedSrcToken.name,
        metadata: {
          ...selectedSrcToken.metadata,
          logoURI: srcTokenMetadata?.logoURI || selectedSrcToken.metadata.logoURI,
        },
      };

      setSelectedSrcToken(enhancedToken);
    }
  }, [srcTokenMetadata, selectedSrcToken]);

  // Reset source token ref when address/chain changes
  useEffect(() => {
    appliedSrcMetadataRef.current = false;
  }, [selectedSrcToken.address, selectedSrcToken.chainId]);

  // Update destination token with metadata
  useEffect(() => {
    if (selectedDstToken && dstTokenMetadata && !appliedDstMetadataRef.current) {
      // Skip metadata enhancement for Hyperliquid USDC - we already have correct metadata from getHyperliquidUSDCToken()
      if (selectedDstToken.chainId === HYPERLIQUID_CHAIN_ID && isHyperliquidUSDCAddress(selectedDstToken.address)) {
        appliedDstMetadataRef.current = true;
        return;
      }

      // Mark as applied
      appliedDstMetadataRef.current = true;

      const enhancedToken = {
        ...selectedDstToken,
        decimals: dstTokenMetadata.decimals || selectedDstToken.decimals,
        symbol: dstTokenMetadata.symbol || selectedDstToken.symbol,
        name: dstTokenMetadata.name || selectedDstToken.name,
        metadata: {
          ...selectedDstToken.metadata,
          logoURI: dstTokenMetadata?.logoURI || selectedDstToken.metadata.logoURI,
        },
      };

      setSelectedDstToken(enhancedToken);
    }
  }, [dstTokenMetadata, selectedDstToken]);

  // Reset destination token ref when address/chain changes
  useEffect(() => {
    appliedDstMetadataRef.current = false;
  }, [selectedDstToken.address, selectedDstToken.chainId]);

  // Prefill destination amount if provided (for fixed amount mode)
  const appliedDestinationAmount = useRef(false);
  useEffect(() => {
    // Only apply when we have real metadata (not default decimals)
    if (destinationTokenAmount && dstTokenMetadata?.decimals && !appliedDestinationAmount.current) {
      appliedDestinationAmount.current = true;
      const formattedAmount = formatUnits(BigInt(destinationTokenAmount), dstTokenMetadata.decimals);
      setDstAmount(formattedAmount);
      setIsSrcInputDirty(false); // Switch to EXACT_OUTPUT mode
    }
  }, [destinationTokenAmount, dstTokenMetadata]);

  // Load swap configuration from URL on initial render
  useEffect(() => {
    // Skip if we've already processed the URL, if we have an order to load, or if URL param management is disabled
    if (initialUrlProcessed.current || loadOrder || disableUrlParamManagement) return;

    try {
      const tabParam = searchParams.get("tab");

      // Set active tab if provided
      if (tabParam === "fiat" || tabParam === "crypto") {
        setActiveTab(tabParam);
      }

      // Set source amount if provided and valid
      const fromAmountParam = searchParams.get("fromAmount");
      if (fromAmountParam) {
        try {
          const amount = parseFloat(fromAmountParam);
          if (!isNaN(amount)) {
            if (tabParam === "fiat") {
              setSrcAmountOnRamp(fromAmountParam);
            } else {
              setSrcAmount(fromAmountParam);
              setIsSrcInputDirty(true);
            }
          }
        } catch (error) {
          console.error("Invalid fromAmount in URL", error);
        }
      }
    } catch (error) {
      console.error("Error processing URL parameters", error);
    }

    // Mark that we've processed the initial URL
    initialUrlProcessed.current = true;
  }, [searchParams, loadOrder, disableUrlParamManagement]);

  // Update URL when swap configuration changes - but not on initial load
  const updateSwapParamsInURL = useCallback(() => {
    // Skip if:
    // 1. There's an active order or orderId in the URL
    // 2. We're not on the main panel
    // 3. We haven't processed the initial URL yet
    if (
      orderId ||
      activePanel !== PanelView.MAIN ||
      !initialUrlProcessed.current ||
      searchParams.has("orderId") ||
      mode === "modal" ||
      disableUrlParamManagement
    )
      return;

    // Create a representation of the current state
    const currentState = {
      tab: activeTab,
      fromChainId: activeTab === "crypto" ? selectedSrcChainId.toString() : undefined,
      fromCurrency: activeTab === "crypto" ? selectedSrcToken.address : undefined,
      fromAmount: activeTab === "crypto" ? srcAmount : undefined,
      toChainId: selectedDstChainId.toString(),
      toCurrency: selectedDstToken.address,
      toAmount: dstAmount,
    };

    // Compare with last update to prevent unnecessary URL changes
    const lastState = lastUrlUpdate.current;
    if (
      lastState &&
      lastState.tab === currentState.tab &&
      lastState.fromChainId === currentState.fromChainId &&
      lastState.fromCurrency === currentState.fromCurrency &&
      lastState.fromAmount === currentState.fromAmount &&
      lastState.toChainId === currentState.toChainId &&
      lastState.toCurrency === currentState.toCurrency &&
      lastState.toAmount === currentState.toAmount
    ) {
      return; // Skip if no changes
    }

    // Update our ref with the current state
    lastUrlUpdate.current = currentState;

    // Build the URL parameters
    const params = new URLSearchParams(searchParams.toString());

    // Always update the tab parameter
    params.set("tab", activeTab);

    // Handle from-related parameters based on active tab
    if (activeTab === "crypto") {
      params.set("fromChainId", selectedSrcChainId.toString());
      params.set("fromCurrency", selectedSrcToken.address);

      params.set("fromAmount", srcAmount);
    } else {
      // In fiat mode, remove token-related parameters but keep the amount
      params.delete("fromChainId");
      params.delete("fromCurrency");

      params.set("fromAmount", srcAmountOnRamp);
    }

    params.set("toChainId", selectedDstChainId.toString());
    params.set("toCurrency", selectedDstToken.address);
    // Update URL without a full page reload
    router.push(`${window.location.pathname}?${params.toString()}`);
  }, [
    orderId,
    activePanel,
    searchParams,
    mode,
    activeTab,
    selectedSrcChainId,
    selectedSrcToken.address,
    srcAmount,
    selectedDstChainId,
    selectedDstToken.address,
    dstAmount,
    router,
    srcAmountOnRamp,
    disableUrlParamManagement,
  ]);

  // Update URL when relevant state changes - but only after initial render
  useEffect(() => {
    // Skip the URL update on first render
    if (initialUrlProcessed.current) {
      updateSwapParamsInURL();
    }
  }, [
    activeTab,
    selectedSrcChainId,
    selectedSrcToken.address,
    selectedDstChainId,
    selectedDstToken.address,
    updateSwapParamsInURL,
  ]);

  // Use our hook for ENS resolution
  // const { address: resolvedAddress } = useResolveOnchainName(
  //   (newRecipientAddress.toLowerCase().endsWith(".eth") ||
  //     newRecipientAddress.startsWith("@") ||
  //     newRecipientAddress.includes(".b3")) &&
  //     newRecipientAddress.length > 2
  //     ? newRecipientAddress
  //     : undefined
  // );

  // Update the validAddressOrEns check to use resolvedAddress
  // const validAddressOrEns = useMemo(
  //   () =>
  //     selectedDstChainId === RELAY_SOLANA_MAINNET_CHAIN_ID
  //       ? isSolanaAddress(newRecipientAddress)
  //       : isAddress(newRecipientAddress) || (resolvedAddress && isAddress(resolvedAddress)),
  //   [selectedDstChainId, newRecipientAddress, resolvedAddress]
  // );

  const { address: globalAddress, wallet: globalWallet, connectedEOAWallet } = useAccountWallet();
  const { executeDirectTransfer, isTransferring: isSwitchingOrExecuting } = useDirectTransfer();

  const globalWalletImage = useAccountWalletImage();

  // Get wallet address based on selected payment method
  const { walletAddress } = useConnectedWalletDisplay(effectiveCryptoPaymentMethod);

  // Recipient address state with dual-state system (auto + explicit user selection)
  // The hook automatically manages priority: props > user selection > wallet/global
  const {
    setSelectedRecipientAddress,
    effectiveRecipientAddress,
    // resetRecipientAddress, // Not used yet, but available for future use
  } = useRecipientAddressState({
    recipientAddressFromProps,
    walletAddress,
    globalAddress,
  });

  const recipientProfile = useProfile({ address: effectiveRecipientAddress, fresh: true });
  const recipientName = recipientProfile.data?.name;

  // Check token balance for crypto payments
  const effectiveBalanceAddress = senderAddress || connectedEOAWallet?.getAccount()?.address;
  const { rawBalance, isLoading: isBalanceLoading } = useTokenBalanceDirect({
    token: selectedSrcToken,
    address: effectiveBalanceAddress,
  });

  // Check if user has enough balanceuseAutoSetActiveWalletFromWagmi
  const hasEnoughBalance = useMemo(() => {
    if (!rawBalance || isBalanceLoading || activeTab !== "crypto") return false;
    try {
      const requiredAmount = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);
      return rawBalance >= requiredAmount;
    } catch {
      return false;
    }
  }, [rawBalance, srcAmount, selectedSrcToken.decimals, isBalanceLoading, activeTab]);

  // Auto-select crypto payment method based on available wallets and balance
  useAutoSelectCryptoPaymentMethod({
    paymentType: activeTab,
    cryptoPaymentMethod,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    hasEnoughBalance,
    isBalanceLoading,
  });

  // Get geo-based onramp options for fiat payments
  const { geoData, coinbaseAvailablePaymentMethods, stripeOnrampSupport, stripeWeb2Support } =
    useGeoOnrampOptions(srcAmountOnRamp);

  // Get gas price for source chain (where the user pays from)
  const { gasPrice: gasPriceData, isLoading: isLoadingGas } = useGasPrice(selectedSrcChainId);

  // Helper function to map payment method to onramp vendor
  const getOnrampVendor = (paymentMethod: FiatPaymentMethod): "coinbase" | "stripe" | "stripe-web2" | undefined => {
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        return "coinbase";
      case FiatPaymentMethod.STRIPE:
        // Stripe redirect flow (one-click URL)
        return stripeOnrampSupport ? "stripe" : undefined;
      case FiatPaymentMethod.STRIPE_WEB2:
        // Stripe embedded payment form
        return stripeWeb2Support?.isSupport ? "stripe-web2" : undefined;
      default:
        return undefined;
    }
  };

  // Get anyspend price
  const activeInputAmountInWei = isSrcInputDirty
    ? parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals).toString()
    : parseUnits(dstAmount.replace(/,/g, ""), selectedDstToken.decimals).toString();
  const srcAmountOnrampInWei = parseUnits(srcAmountOnRamp.replace(/,/g, ""), USDC_BASE.decimals).toString();
  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote(
    activeTab === "crypto"
      ? {
          srcChain: selectedSrcChainId,
          dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
          srcTokenAddress: selectedSrcToken.address,
          dstTokenAddress: isBuyMode ? destinationTokenAddress : selectedDstToken.address,
          type: "swap",
          tradeType: isSrcInputDirty ? "EXACT_INPUT" : "EXACT_OUTPUT",
          amount: activeInputAmountInWei,
          recipientAddress: effectiveRecipientAddress,
        }
      : {
          srcChain: base.id,
          dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
          srcTokenAddress: USDC_BASE.address,
          dstTokenAddress: isBuyMode ? destinationTokenAddress : selectedDstToken.address,
          type: "swap",
          tradeType: "EXACT_INPUT",
          amount: srcAmountOnrampInWei,
          recipientAddress: effectiveRecipientAddress,
          onrampVendor: getOnrampVendor(selectedFiatPaymentMethod),
        },
  );

  // Load custom recipients from local storage on mount
  useEffect(() => {
    try {
      const savedRecipients = localStorage.getItem(ANYSPEND_RECIPIENTS_KEY);
      if (savedRecipients) {
        const parsedRecipients = JSON.parse(savedRecipients);

        // Only do this once, if custom recipients is empty
        if (customRecipients.length > 0) {
          return;
        }

        // Add custom recipients based on local storage
        setCustomRecipients(parsedRecipients);

        // If no wallet is connected and no recipient is selected, select the first recipient
        if (!globalAddress && !effectiveRecipientAddress && parsedRecipients.length > 0) {
          setSelectedRecipientAddress(parsedRecipients[0].address);
        }
      }
    } catch (err) {
      console.error("Error loading recipients from local storage:", err);
    }
    // Only run this effect once on mount
  }, [globalAddress, effectiveRecipientAddress, customRecipients.length, setSelectedRecipientAddress]);

  // Update dependent amount when relay price changes
  useEffect(() => {
    if (
      anyspendQuote?.data &&
      anyspendQuote.data.currencyIn?.amount &&
      anyspendQuote.data.currencyIn?.currency?.decimals &&
      anyspendQuote.data.currencyOut?.amount &&
      anyspendQuote.data.currencyOut?.currency?.decimals
    ) {
      if (isSrcInputDirty) {
        // Don't override dstAmount if we have a fixed destinationTokenAmount
        if (!destinationTokenAmount) {
          const amount = anyspendQuote.data.currencyOut.amount;
          const decimals = anyspendQuote.data.currencyOut.currency.decimals;
          setDstAmount(formatTokenAmount(BigInt(amount), decimals, 6, false));
        }
      } else {
        const amount = anyspendQuote.data.currencyIn.amount;
        const decimals = anyspendQuote.data.currencyIn.currency.decimals;
        setSrcAmount(formatTokenAmount(BigInt(amount), decimals, 6, false));
      }
    } else {
      if (isSrcInputDirty) {
        // Don't reset dstAmount if we have a fixed destinationTokenAmount
        if (!destinationTokenAmount) {
          setDstAmount("");
        }
      } else {
        setSrcAmount("");
      }
    }
  }, [anyspendQuote, isSrcInputDirty, destinationTokenAmount]);

  // Call onSuccess when order is executed
  useOnOrderSuccess({ orderData: oat, orderId, onSuccess });

  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      setOrderId(orderId);
      // setNewRecipientAddress("");
      navigateToPanel(PanelView.ORDER_DETAILS, "forward");

      if (!disableUrlParamManagement) {
        // Debug: Check payment method before setting URL
        console.log("Creating order - selectedCryptoPaymentMethod:", selectedCryptoPaymentMethod);

        // Add orderId and payment method to URL for persistence
        const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
        params.set("orderId", orderId);
        if (effectiveCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
          params.set("cryptoPaymentMethod", effectiveCryptoPaymentMethod);
        } else {
          console.log("Payment method is NONE, not setting in URL");
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
      }
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  // Add onramp order creation hook
  const { createOrder: createOnrampOrder, isCreatingOrder: isCreatingOnrampOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      setOrderId(orderId);
      navigateToPanel(PanelView.ORDER_DETAILS, "forward");

      if (!disableUrlParamManagement) {
        // Add orderId and payment method to URL for persistence
        const params = new URLSearchParams(searchParams.toString());
        params.set("orderId", orderId);
        params.set("paymentMethod", "fiat");
        router.push(`${window.location.pathname}?${params.toString()}`);
      }
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  // Check if it's a same-chain same-token swap
  const isSameChainSameToken = useMemo(() => {
    return (
      activeTab === "crypto" &&
      selectedSrcChainId === selectedDstChainId &&
      selectedSrcToken.address.toLowerCase() === selectedDstToken.address.toLowerCase()
    );
  }, [activeTab, selectedSrcChainId, selectedDstChainId, selectedSrcToken.address, selectedDstToken.address]);

  // Check if this is a direct transfer (same chain/token with allowDirectTransfer enabled)
  const isDirectTransfer = isSameChainSameToken && allowDirectTransfer;

  // Determine button state and text
  const btnInfo: { text: string; disable: boolean; error: boolean; loading: boolean } = useMemo(() => {
    // For fiat tab, check srcAmountOnRamp; for crypto tab, check activeInputAmountInWei
    const hasAmount =
      activeTab === "fiat" ? srcAmountOnRamp && parseFloat(srcAmountOnRamp) > 0 : activeInputAmountInWei !== "0";
    if (!hasAmount) return { text: "Enter an amount", disable: true, error: false, loading: false };
    if (isSameChainSameToken && !allowDirectTransfer)
      return { text: "Select a different token or chain", disable: true, error: false, loading: false };
    if (isLoadingAnyspendQuote && !isSameChainSameToken)
      return { text: "Loading quote...", disable: true, error: false, loading: true };
    if (isCreatingOrder || isCreatingOnrampOrder || isSwitchingOrExecuting)
      return {
        text: isSwitchingOrExecuting ? "Transferring..." : "Creating order...",
        disable: true,
        error: false,
        loading: true,
      };
    if ((!anyspendQuote || !anyspendQuote.success) && !(isSameChainSameToken && allowDirectTransfer))
      return { text: "No quote found", disable: true, error: false, loading: false };

    if (activeTab === "fiat") {
      // For fiat: check recipient first, then payment method
      if (!effectiveRecipientAddress) return { text: "Select recipient", disable: false, error: false, loading: false };

      // If no fiat payment method selected, show "Select payment method"
      if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
        return { text: "Select payment method", disable: false, error: false, loading: false };
      }
      // If payment method is selected, show "Buy"
      return { text: "Buy", disable: false, error: false, loading: false };
    }

    if (activeTab === "crypto") {
      // For crypto: check payment method first, then recipient

      // If no payment method selected, show "Choose payment method"
      if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
        return { text: "Choose payment method", disable: false, error: false, loading: false };
      }

      // Check recipient after payment method
      if (!effectiveRecipientAddress) return { text: "Select recipient", disable: false, error: false, loading: false };

      // If payment method selected, show appropriate action
      if (
        effectiveCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
        effectiveCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET
      ) {
        const buttonText = isSameChainSameToken && allowDirectTransfer ? "Transfer" : "Swap";
        return { text: buttonText, disable: false, error: false, loading: false };
      }
      if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO) {
        return { text: "Continue to payment", disable: false, error: false, loading: false };
      }
    }

    return { text: "Buy", disable: false, error: false, loading: false };
  }, [
    activeInputAmountInWei,
    isSameChainSameToken,
    isLoadingAnyspendQuote,
    effectiveRecipientAddress,
    isCreatingOrder,
    isCreatingOnrampOrder,
    isSwitchingOrExecuting,
    anyspendQuote,
    activeTab,
    effectiveCryptoPaymentMethod,
    selectedFiatPaymentMethod,
    srcAmountOnRamp,
    allowDirectTransfer,
  ]);

  // Handle main button click
  const onMainButtonClick = async () => {
    if (btnInfo.disable) return;

    const isDirectTransfer = isSameChainSameToken && allowDirectTransfer;

    try {
      // Only require quote for non-direct transfers
      if (!isDirectTransfer) {
        invariant(anyspendQuote, "Relay price is not found");
      }

      if (activeTab === "fiat") {
        // For fiat: check recipient first
        if (!effectiveRecipientAddress) {
          navigateToPanel(PanelView.RECIPIENT_SELECTION, "forward");
          return;
        }

        invariant(effectiveRecipientAddress, "Recipient address is not found");

        // If no fiat payment method selected, show payment method selection
        if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
          navigateToPanel(PanelView.FIAT_PAYMENT_METHOD, "forward");
          return;
        }
        // If payment method is selected, create order directly
        await handleFiatOrder(selectedFiatPaymentMethod);
        return;
      }

      if (activeTab === "crypto") {
        // For crypto: check payment method first, then recipient

        // If no payment method selected, show payment method selection
        if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
          console.log("No payment method selected, showing selection panel");
          navigateToPanel(PanelView.CRYPTO_PAYMENT_METHOD, "forward");
          return;
        }

        // Check recipient after payment method
        if (!effectiveRecipientAddress) {
          navigateToPanel(PanelView.RECIPIENT_SELECTION, "forward");
          return;
        }

        invariant(effectiveRecipientAddress, "Recipient address is not found");

        // If payment method is selected, create order with payment method info
        if (
          effectiveCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
          effectiveCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET ||
          effectiveCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO
        ) {
          console.log("Creating crypto order with payment method:", effectiveCryptoPaymentMethod);
          await handleCryptoSwap(effectiveCryptoPaymentMethod);
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  const onClickHistory = () => {
    setOrderId(undefined);
    navigateToPanel(PanelView.HISTORY, "forward");
    setB3ModalContentType({
      type: "anySpendOrderHistory",
      showBackButton: false,
    });
    if (!disableUrlParamManagement) {
      // Remove orderId and paymentMethod from URL when going back to history
      const params = new URLSearchParams(searchParams.toString());
      params.delete("orderId");
      params.delete("paymentMethod");
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  // Handle crypto swap creation
  const handleCryptoSwap = async (method: CryptoPaymentMethodType) => {
    try {
      const isDirectTransfer = isSameChainSameToken && allowDirectTransfer;

      invariant(effectiveRecipientAddress, "Recipient address is not found");

      const srcAmountBigInt = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);

      // Handle direct transfer (same chain/token) - bypass backend, transfer directly
      if (isDirectTransfer) {
        const txHash = await executeDirectTransfer({
          chainId: selectedSrcChainId,
          tokenAddress: selectedSrcToken.address,
          recipientAddress: effectiveRecipientAddress,
          amount: srcAmountBigInt,
          method,
        });

        if (txHash) {
          setDirectTransferTxHash(txHash);
          navigateToPanel(PanelView.DIRECT_TRANSFER_SUCCESS, "forward");
        }
        return;
      }

      // Regular swap flow - use backend
      invariant(anyspendQuote, "Relay price is not found");

      // Debug: Check payment method values
      console.log("handleCryptoSwap - method parameter:", method);
      console.log("handleCryptoSwap - selectedCryptoPaymentMethod state:", selectedCryptoPaymentMethod);

      createOrder({
        recipientAddress: effectiveRecipientAddress,
        orderType: "swap",
        srcChain: selectedSrcChainId,
        dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
        srcToken: selectedSrcToken,
        dstToken: isBuyMode
          ? { ...selectedDstToken, chainId: destinationTokenChainId, address: destinationTokenAddress }
          : selectedDstToken,
        srcAmount: srcAmountBigInt.toString(),
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount || "0",
        creatorAddress: senderAddress || globalAddress,
        callbackMetadata,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  // Handle fiat onramp order creation
  const handleFiatOrder = async (paymentMethod: FiatPaymentMethod) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(effectiveRecipientAddress, "Recipient address is not found");

      if (!srcAmountOnRamp || parseFloat(srcAmountOnRamp) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Determine vendor and payment method string based on selected payment method
      let vendor: components["schemas"]["OnrampMetadata"]["vendor"];
      let paymentMethodString = "";

      if (paymentMethod === FiatPaymentMethod.COINBASE_PAY) {
        if (coinbaseAvailablePaymentMethods.length === 0) {
          toast.error("Coinbase Pay not available");
          return;
        }
        vendor = "coinbase";
        paymentMethodString = coinbaseAvailablePaymentMethods[0]?.id || ""; // Use first available payment method ID
      } else if (paymentMethod === FiatPaymentMethod.STRIPE) {
        // Stripe redirect flow (one-click URL)
        if (!stripeOnrampSupport) {
          toast.error("Credit/Debit Card not available");
          return;
        }
        vendor = "stripe";
        paymentMethodString = "";
      } else if (paymentMethod === FiatPaymentMethod.STRIPE_WEB2) {
        // Stripe embedded payment form requires authentication + KYC
        // Read from store directly to avoid stale closure when called from onLoginSuccess callback
        const currentlyAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!currentlyAuthenticated) {
          navigateToPanel(PanelView.FIAT_AUTH, "forward");
          return;
        }
        if (!kycApprovedRef.current) {
          navigateToPanel(PanelView.FIAT_KYC, "forward");
          return;
        }
        if (!stripeWeb2Support.isSupport) {
          toast.error("Pay with Card not available");
          return;
        }
        vendor = "stripe-web2";
        paymentMethodString = "";
      } else {
        toast.error("Please select a payment method");
        return;
      }

      const getDstToken = (): components["schemas"]["Token"] => {
        if (isBuyMode) {
          invariant(destinationTokenAddress, "destinationTokenAddress is required");
          return {
            ...selectedDstToken,
            chainId: destinationTokenChainId || selectedDstChainId,
            address: destinationTokenAddress,
          };
        }
        return selectedDstToken;
      };

      createOnrampOrder({
        recipientAddress: effectiveRecipientAddress,
        orderType: "swap",
        dstChain: getDstToken().chainId,
        dstToken: getDstToken(),
        srcFiatAmount: srcAmountOnRamp,
        onramp: {
          vendor: vendor,
          paymentMethod: paymentMethodString,
          country: geoData?.country || "US",
          redirectUrl:
            window.location.origin === "https://basement.fun" ? "https://basement.fun/deposit" : window.location.origin,
        },
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0",
        creatorAddress: senderAddress || globalAddress,
        callbackMetadata,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  // Open a dynamic modal
  // const setIsDynamicModalOpen = useModalStore(state => state.setB3ModalOpen);
  // const setDynamicModalContentType = useModalStore(state => state.setB3ModalContentType);

  // Update useEffect for URL parameter to not override loadOrder
  useEffect(() => {
    if (loadOrder || disableUrlParamManagement) return; // Skip if we have a loadOrder or URL param management is disabled

    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setOrderId(orderIdParam);
      setActivePanel(PanelView.ORDER_DETAILS);
    }
  }, [searchParams, loadOrder, disableUrlParamManagement]);

  const onSelectOrder = (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    navigateToPanel(PanelView.ORDER_DETAILS, "forward");
    if (!disableUrlParamManagement) {
      // Update URL with the new orderId and preserve existing parameters
      const params = new URLSearchParams(searchParams.toString());
      params.set("orderId", selectedOrderId);
      // Keep existing paymentMethod if present
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  // Save custom recipients to local storage when they change
  useEffect(() => {
    try {
      localStorage.setItem(ANYSPEND_RECIPIENTS_KEY, JSON.stringify(customRecipients));
    } catch (err) {
      console.error("Error saving recipients to local storage:", err);
    }
  }, [customRecipients]);

  // Scroll to top when panel changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePanel]);

  // Handle browser back button for recipient selection and payment method views
  useEffect(() => {
    // Push a new history state when navigating to specific panels
    if (activePanel === PanelView.RECIPIENT_SELECTION) {
      window.history.pushState({ panel: "recipient-selection" }, "");
    } else if (activePanel === PanelView.CRYPTO_PAYMENT_METHOD) {
      window.history.pushState({ panel: "crypto-payment-method" }, "");
    } else if (activePanel === PanelView.FIAT_PAYMENT_METHOD) {
      window.history.pushState({ panel: "fiat-payment-method" }, "");
    }

    // Listen for popstate event (browser back button)
    const handlePopState = (event: PopStateEvent) => {
      if (
        activePanel === PanelView.RECIPIENT_SELECTION ||
        activePanel === PanelView.CRYPTO_PAYMENT_METHOD ||
        activePanel === PanelView.FIAT_PAYMENT_METHOD
      ) {
        // User pressed back while on these panels
        event.preventDefault();
        navigateBack();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activePanel, navigateBack]);

  // When auth completes while on the FIAT_AUTH panel, navigate back and retry the order
  useEffect(() => {
    if (isAuthenticated && activePanel === PanelView.FIAT_AUTH) {
      navigateBack();
      handleFiatOrder(selectedFiatPaymentMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const historyView = (
    <div className={"mx-auto flex w-[560px] max-w-full flex-col items-center"}>
      <OrderHistory mode={mode} onBack={navigateBack} onSelectOrder={onSelectOrder} />
    </div>
  );

  const orderDetailsView = (
    <div className={"mx-auto w-[460px] max-w-full p-5"}>
      <div className="relative flex flex-col gap-4">
        {oat && (
          <OrderDetails
            mode={mode}
            order={oat.data.order}
            depositTxs={oat.data.depositTxs}
            relayTxs={oat.data.relayTxs}
            executeTx={oat.data.executeTx}
            refundTxs={oat.data.refundTxs}
            selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod}
            onPaymentMethodChange={method => {
              // When user explicitly changes payment method, set it as selected
              setSelectedCryptoPaymentMethod(method);
            }}
            points={oat.data.points || undefined}
            onBack={() => {
              setOrderId(undefined);
              navigateBack();
              // Reset payment methods when going back
              resetPaymentMethods();
            }}
            returnToHomeUrl={returnToHomeUrl}
            returnHomeLabel={returnHomeLabel}
            disableUrlParamManagement={disableUrlParamManagement}
          />
        )}
        {/* {mode === "page" && <div className="h-12" />} */}
      </div>
    </div>
  );

  const mainView = (
    <div className={classes?.mainContent || "mx-auto flex w-[460px] max-w-full flex-col items-center gap-2 pt-5"}>
      <div className={"flex w-full max-w-full flex-col items-center gap-2 px-5"}>
        {/* Token Header - Show when in buy mode */}
        {isBuyMode && !hideHeader && (
          <div className={classes?.header || "mb-4 flex flex-col items-center gap-3 text-center"}>
            {selectedDstToken.metadata?.logoURI && (
              <div className="relative">
                <img
                  src={selectedDstToken.metadata.logoURI}
                  alt={selectedDstToken.symbol}
                  className={classes?.headerLogo || "border-as-stroke h-12 w-12 rounded-full border-2 shadow-md"}
                />
              </div>
            )}
            <div>
              <h1 className={classes?.headerTitle || "text-as-primary text-xl font-bold"}>
                Buy {selectedDstToken.symbol}
              </h1>
            </div>
          </div>
        )}

        {/* Tab section */}
        <TabSection
          activeTab={activeTab}
          setActiveTab={tab => {
            setActiveTab(tab);
            // Reset payment methods when switching tabs
            resetPaymentMethods();
            setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE);
          }}
          setSelectedCryptoPaymentMethod={setSelectedCryptoPaymentMethod}
          setSelectedFiatPaymentMethod={setSelectedFiatPaymentMethod}
        />

        <div className="relative flex w-full max-w-[calc(100vw-32px)] flex-col gap-2">
          {/* Send section */}
          {activeTab === "crypto" ? (
            <CryptoPaySection
              selectedSrcChainId={selectedSrcChainId}
              setSelectedSrcChainId={setSelectedSrcChainId}
              selectedSrcToken={selectedSrcToken}
              setSelectedSrcToken={setSelectedSrcToken}
              srcAmount={srcAmount}
              setSrcAmount={setSrcAmount}
              isSrcInputDirty={isSrcInputDirty}
              setIsSrcInputDirty={setIsSrcInputDirty}
              selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod}
              onSelectCryptoPaymentMethod={() => navigateToPanel(PanelView.CRYPTO_PAYMENT_METHOD, "forward")}
              anyspendQuote={anyspendQuote}
              onTokenSelect={onTokenSelect}
              onShowFeeDetail={() => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
            >
              <PanelOnramp
                srcAmountOnRamp={srcAmountOnRamp}
                setSrcAmountOnRamp={setSrcAmountOnRamp}
                selectedPaymentMethod={selectedFiatPaymentMethod}
                setActivePanel={(panelIndex: number) => {
                  // Map panel index to navigation with direction
                  const panelsWithForwardNav = [PanelView.FIAT_PAYMENT_METHOD, PanelView.RECIPIENT_SELECTION];
                  if (panelsWithForwardNav.includes(panelIndex)) {
                    navigateToPanel(panelIndex, "forward");
                  } else {
                    setActivePanel(panelIndex);
                  }
                }}
                _recipientAddress={effectiveRecipientAddress}
                destinationToken={selectedDstToken}
                destinationChainId={selectedDstChainId}
                destinationAmount={dstAmount}
                onDestinationTokenChange={setSelectedDstToken}
                onDestinationChainChange={setSelectedDstChainId}
                fiatPaymentMethodIndex={PanelView.FIAT_PAYMENT_METHOD}
                recipientSelectionPanelIndex={PanelView.RECIPIENT_SELECTION}
                hideDstToken={isBuyMode}
                anyspendQuote={anyspendQuote}
                onShowPointsDetail={() => navigateToPanel(PanelView.POINTS_DETAIL, "forward")}
                onShowFeeDetail={() => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
                customUsdInputValues={customUsdInputValues}
                customRecipientLabel={customRecipientLabel}
              />
            </motion.div>
          )}

          {/* Reverse swap direction section */}
          {activeTab === "crypto" && (
            <div className="z-10 -my-6 flex justify-center">
              <Button
                variant="ghost"
                className={
                  classes?.swapDirectionButton ||
                  cn(
                    "border-as-stroke bg-as-surface-primary h-10 w-10 rounded-xl border-2 sm:h-8 sm:w-8 sm:rounded-xl",
                    isBuyMode && "cursor-default",
                    selectedDstChainId === HYPERLIQUID_CHAIN_ID && "cursor-not-allowed opacity-50",
                  )
                }
                onClick={() => {
                  if (isBuyMode) {
                    return;
                  }

                  // Prevent swapping if destination is Hyperliquid (only supported as destination, not source)
                  if (selectedDstChainId === HYPERLIQUID_CHAIN_ID) {
                    return;
                  }

                  // Swap chain selections
                  setSelectedSrcChainId(selectedDstChainId);
                  setSelectedDstChainId(selectedSrcChainId);

                  // Swap token selections
                  setSelectedSrcToken(selectedDstToken);
                  setSelectedDstToken(selectedSrcToken);

                  // Swap amounts
                  setSrcAmount(dstAmount);
                  setDstAmount(srcAmount);
                }}
              >
                <div className="relative flex items-center justify-center transition-opacity">
                  <ArrowDown className="text-as-primary/50 h-5 w-5" />
                </div>
              </Button>
            </div>
          )}

          {/* Receive section - Hidden when fiat tab is active */}
          {/* Receive section - Hidden when fiat tab is active */}
          {activeTab === "crypto" && (
            <CryptoReceiveSection
              isDepositMode={false}
              isBuyMode={isBuyMode}
              effectiveRecipientAddress={effectiveRecipientAddress}
              recipientName={recipientName || undefined}
              customRecipientLabel={customRecipientLabel}
              onSelectRecipient={() => navigateToPanel(PanelView.RECIPIENT_SELECTION, "forward")}
              dstAmount={dstAmount}
              dstToken={selectedDstToken}
              selectedDstChainId={selectedDstChainId}
              setSelectedDstChainId={setSelectedDstChainId}
              setSelectedDstToken={setSelectedDstToken}
              isSrcInputDirty={isSrcInputDirty}
              onChangeDstAmount={value => {
                setIsSrcInputDirty(false);
                setDstAmount(value);
              }}
              disableAmountInput={!!destinationTokenAmount}
              anyspendQuote={isDirectTransfer ? undefined : anyspendQuote}
              onShowPointsDetail={
                isDirectTransfer ? undefined : () => navigateToPanel(PanelView.POINTS_DETAIL, "forward")
              }
              onShowFeeDetail={isDirectTransfer ? undefined : () => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
            />
          )}
        </div>

        {/* Gas indicator - show when source chain has gas data, hide for direct transfers */}
        {gasPriceData && !isLoadingGas && activeTab === "crypto" && !isDirectTransfer && (
          <GasIndicator gasPrice={gasPriceData} className={classes?.gasIndicator || "mt-2 w-full"} />
        )}

        {/* Main button section */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={cn("mt-4 flex w-full max-w-[460px] flex-col gap-2")}
        >
          {slots.actionButton ? (
            slots.actionButton({
              onClick: onMainButtonClick,
              disabled: btnInfo.disable,
              loading: btnInfo.loading,
              text: btnInfo.text,
            })
          ) : (
            <ShinyButton
              accentColor={"hsl(var(--as-brand))"}
              disabled={btnInfo.disable}
              onClick={onMainButtonClick}
              className={
                (btnInfo.error && classes?.mainButtonError) ||
                (btnInfo.disable && classes?.mainButtonDisabled) ||
                classes?.mainButton ||
                cn(
                  "as-main-button relative w-full",
                  btnInfo.error ? "!bg-as-red" : btnInfo.disable ? "!bg-as-on-surface-2" : "!bg-as-brand",
                )
              }
              textClassName={cn(btnInfo.error ? "text-white" : btnInfo.disable ? "text-as-secondary" : "text-white")}
            >
              <div className="flex items-center justify-center gap-2">
                {btnInfo.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {btnInfo.text}
              </div>
            </ShinyButton>
          )}

          {!hideTransactionHistoryButton && (globalAddress || effectiveRecipientAddress) ? (
            <Button
              variant="link"
              onClick={onClickHistory}
              className={
                classes?.historyButton ||
                "text-as-primary/50 hover:text-as-primary flex items-center gap-1 transition-colors"
              }
            >
              <HistoryIcon className="h-4 w-4" /> <span className="pr-4">Transaction History</span>
            </Button>
          ) : null}
        </motion.div>
      </div>
      <div className="w-full">
        <TabsPrimitive
          defaultValue="swap"
          onValueChange={value => {
            if (value === "settings" || value === "home") {
              setB3ModalContentType({
                type: "manageAccount",
                activeTab: value,
                setActiveTab: () => {},
                chain: baseChain,
                partnerId,
              });
            } else if (value === "swap") {
              setB3ModalContentType({
                type: "anySpend",
              });
            }
          }}
        >
          {mode !== "page" && !hideBottomNavigation && <BottomNavigation />}
        </TabsPrimitive>
      </div>
    </div>
  );

  const onrampPaymentView = (
    <PanelOnrampPayment
      srcAmountOnRamp={srcAmountOnRamp}
      recipientName={recipientName || undefined}
      recipientAddress={effectiveRecipientAddress}
      isBuyMode={isBuyMode}
      destinationTokenChainId={destinationTokenChainId}
      destinationTokenAddress={destinationTokenAddress}
      selectedDstChainId={selectedDstChainId}
      selectedDstToken={selectedDstToken}
      orderType={"swap"}
      anyspendQuote={anyspendQuote}
      globalAddress={globalAddress}
      onOrderCreated={orderId => {
        setOrderId(orderId);
        navigateToPanel(PanelView.ORDER_DETAILS, "forward");
        if (!disableUrlParamManagement) {
          // Add orderId and payment method to URL for persistence
          const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
          params.set("orderId", orderId);
          // For fiat payments, the payment method is always fiat (but we use the active tab context)
          if (activeTab === "fiat") {
            params.set("paymentMethod", "fiat");
          } else if (selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
            params.set("paymentMethod", selectedCryptoPaymentMethod);
          }
          router.push(`${window.location.pathname}?${params.toString()}`);
        }
      }}
      onBack={navigateBack}
      recipientEnsName={globalWallet?.ensName}
      recipientImageUrl={globalWalletImage}
    />
  );

  const recipientSelectionView = (
    <RecipientSelection
      initialValue={effectiveRecipientAddress || ""}
      onBack={navigateBack}
      onConfirm={address => {
        // User manually selected a recipient
        setSelectedRecipientAddress(address);
        navigateBack();
      }}
    />
  );

  const cryptoPaymentMethodView = (
    <CryptoPaymentMethod
      selectedPaymentMethod={effectiveCryptoPaymentMethod}
      setSelectedPaymentMethod={method => {
        // When user explicitly selects a payment method, save it
        setSelectedCryptoPaymentMethod(method);
      }}
      isCreatingOrder={isCreatingOrder}
      onBack={navigateBack}
      onSelectPaymentMethod={(method: CryptoPaymentMethodType) => {
        // When user explicitly selects a payment method, save it and go back
        setSelectedCryptoPaymentMethod(method);
        navigateBack();
      }}
    />
  );

  const fiatPaymentMethodView = (
    <FiatPaymentMethodComponent
      selectedPaymentMethod={selectedFiatPaymentMethod}
      setSelectedPaymentMethod={setSelectedFiatPaymentMethod}
      onBack={navigateBack}
      onSelectPaymentMethod={(method: FiatPaymentMethod) => {
        setSelectedFiatPaymentMethod(method);
        navigateBack(); // Go back to main panel to show updated pricing
      }}
      srcAmountOnRamp={srcAmountOnRamp}
    />
  );

  const pointsDetailView = (
    <PointsDetailPanel pointsAmount={anyspendQuote?.data?.pointsAmount || 0} onBack={navigateBack} />
  );

  const feeDetailView = anyspendQuote?.data?.fee ? (
    <FeeDetailPanel
      fee={anyspendQuote.data.fee}
      transactionAmountUsd={
        activeTab === "crypto" ? Number(anyspendQuote.data.currencyIn?.amountUsd) : parseFloat(srcAmountOnRamp)
      }
      onBack={navigateBack}
    />
  ) : null;

  const defaultSuccessTitle = content.successTitle || "Transfer Complete";
  const defaultSuccessDesc =
    content.successDescription ||
    `Your ${selectedSrcToken.symbol} has been sent to ${effectiveRecipientAddress?.slice(0, 6)}...${effectiveRecipientAddress?.slice(-4)} on ${getChainName(selectedSrcChainId)}`;
  const resolvedReturnLabel = content.returnButtonLabel || returnHomeLabel;

  const directTransferSuccessView = slots.successScreen ? (
    slots.successScreen({
      title: typeof defaultSuccessTitle === "string" ? defaultSuccessTitle : "Transfer Complete",
      description: typeof defaultSuccessDesc === "string" ? defaultSuccessDesc : "",
      txHash: directTransferTxHash,
      explorerUrl: directTransferTxHash ? getExplorerTxUrl(selectedSrcChainId, directTransferTxHash) : undefined,
      onDone: () => {
        if (returnToHomeUrl) {
          window.location.href = returnToHomeUrl;
        } else {
          onSuccess?.(directTransferTxHash);
          setDirectTransferTxHash(undefined);
          setB3ModalOpen(false);
        }
      },
      returnUrl: returnToHomeUrl,
      returnLabel: resolvedReturnLabel || undefined,
    })
  ) : (
    <div className="mx-auto flex w-[460px] max-w-full flex-col items-center gap-6 p-5">
      <div className="flex flex-col items-center gap-4">
        <AnimatedCheckmark className="h-16 w-16" />
        <div className="text-center">
          <h2 className="text-as-primary text-xl font-bold">{defaultSuccessTitle}</h2>
          <p className="text-as-secondary mt-1 text-sm">{defaultSuccessDesc}</p>
        </div>
      </div>

      {directTransferTxHash && (
        <a
          href={getExplorerTxUrl(selectedSrcChainId, directTransferTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-as-brand hover:text-as-brand/80 text-sm underline"
        >
          View transaction
        </a>
      )}

      <div className="flex w-full flex-col gap-2">
        {returnToHomeUrl ? (
          <Button
            onClick={() => {
              window.location.href = returnToHomeUrl;
            }}
            className="bg-as-brand hover:bg-as-brand/90 w-full text-white"
          >
            {resolvedReturnLabel || "Return to Home"}
          </Button>
        ) : (
          <Button
            onClick={() => {
              onSuccess?.(directTransferTxHash);
              setDirectTransferTxHash(undefined);
              setB3ModalOpen(false);
            }}
            className="bg-as-brand hover:bg-as-brand/90 w-full text-white"
          >
            {resolvedReturnLabel || "Done"}
          </Button>
        )}
      </div>
    </div>
  );

  const kycView = (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 px-5 pt-5">
      <KycGate
        enabled={activePanel === PanelView.FIAT_KYC}
        onStatusResolved={approved => {
          if (approved) {
            kycApprovedRef.current = true;
            navigateBack();
            handleFiatOrder(selectedFiatPaymentMethod);
          }
        }}
      />
    </div>
  );

  const authView = (
    <div className="mx-auto w-full max-w-[460px]">
      <LoginStep
        chain={baseChain}
        onSuccess={async () => {
          // isAuthenticated will be true at this point — the useEffect below handles navigation
        }}
      />
    </div>
  );

  // Add tabs to the main component when no order is loaded
  return (
    <StyleRoot>
      <div
        className={
          classes?.container ||
          cn(
            "anyspend-container font-inter mx-auto w-full max-w-[460px]",
            mode === "page" &&
              "bg-as-surface-primary border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
          )
        }
      >
        <TransitionPanel
          activeIndex={
            orderId
              ? oat
                ? PanelView.ORDER_DETAILS
                : PanelView.LOADING
              : activePanel === PanelView.ORDER_DETAILS
                ? PanelView.MAIN
                : activePanel
          }
          className={cn("rounded-2xl", {
            "mt-0": mode === "modal",
          })}
          custom={animationDirection.current}
          variants={{
            enter: direction => ({
              x: direction === "back" ? -300 : 300,
              opacity: 0,
            }),
            center: { x: 0, opacity: 1 },
            exit: direction => ({
              x: direction === "back" ? 300 : -300,
              opacity: 0,
            }),
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {[
            <div key="main-view" className={cn(mode === "page" && "p-6")}>
              {mainView}
            </div>,
            <div key="history-view" className={cn(mode === "page" && "p-6")}>
              {historyView}
            </div>,
            <div key="order-details-view" className={cn(mode === "page" && "p-6")}>
              {orderDetailsView}
            </div>,
            <div key="loading-view" className={cn(mode === "page" && "p-6")}>
              {OrderDetailsLoadingView}
            </div>,
            <div key="fiat-payment-view" className={cn(mode === "page" && "p-6")}>
              {onrampPaymentView}
            </div>,
            <div key="recipient-selection-view" className={cn(mode === "page" && "p-6")}>
              {recipientSelectionView}
            </div>,
            <div key="crypto-payment-method-view" className={cn(mode === "page" && "p-6")}>
              {cryptoPaymentMethodView}
            </div>,
            <div key="fiat-payment-method-view" className={cn(mode === "page" && "p-6")}>
              {fiatPaymentMethodView}
            </div>,
            <div key="points-detail-view" className={cn(mode === "page" && "p-6")}>
              {pointsDetailView}
            </div>,
            <div key="fee-detail-view" className={cn(mode === "page" && "p-6")}>
              {feeDetailView}
            </div>,
            <div key="direct-transfer-success-view" className={cn(mode === "page" && "p-6")}>
              {directTransferSuccessView}
            </div>,
            <div key="fiat-kyc-view" className={cn(mode === "page" && "p-6")}>
              {kycView}
            </div>,
            <div key="fiat-auth-view" className={cn(mode === "page" && "p-6")}>
              {authView}
            </div>,
          ]}
        </TransitionPanel>
      </div>
    </StyleRoot>
  );
}
