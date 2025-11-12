"use client";

import { getDefaultToken, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import {
  StyleRoot,
  TransitionPanel,
  useAccountWallet,
  useProfile,
  useRouter,
  useSearchParamsSSR,
  useTokenData,
  useTokenFromUrl,
} from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { base, mainnet } from "viem/chains";
import { components } from "../../types/api";
import { useAnyspendOrderStore } from "../stores/useAnyspendOrderStore";
import { useAnyspendPaymentStore } from "../stores/useAnyspendPaymentStore";
import { useAnyspendRecipientStore } from "../stores/useAnyspendRecipientStore";
import { useAnyspendSwapStore } from "../stores/useAnyspendSwapStore";
import { PanelView, useAnyspendUIStore } from "../stores/useAnyspendUIStore";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "./AnySpendFingerprintWrapper";
import { AnyspendMainView } from "./AnyspendMainView";
import { CryptoPaymentMethod, CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { FeeDetailPanel } from "./common/FeeDetailPanel";
import { FiatPaymentMethod, FiatPaymentMethodComponent } from "./common/FiatPaymentMethod";
import { OrderDetails, OrderDetailsLoadingView } from "./common/OrderDetails";
import { OrderHistory } from "./common/OrderHistory";
import { PanelOnrampPayment } from "./common/PanelOnrampPayment";
import { PointsDetailPanel } from "./common/PointsDetailPanel";
import { RecipientSelection } from "./common/RecipientSelection";

// Re-export from stores for backward compatibility
export type { RecipientOption } from "../stores/useAnyspendRecipientStore";
export { PanelView } from "../stores/useAnyspendUIStore";

const ANYSPEND_RECIPIENTS_KEY = "anyspend_recipients";

export function AnySpend(props: {
  mode?: "page" | "modal";
  defaultActiveTab?: "crypto" | "fiat";
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
}) {
  const fingerprintConfig = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <AnySpendInner {...props} />
    </AnySpendFingerprintWrapper>
  );
}

function AnySpendInner({
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
}: {
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
}) {
  const searchParams = useSearchParamsSSR();
  const router = useRouter();

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

  // Track if onSuccess has been called for the current order
  const onSuccessCalled = useRef(false);

  // Use Zustand stores - single selectors per repo rules
  const activeTab = useAnyspendUIStore(state => state.activeTab);
  const setActiveTab = useAnyspendUIStore(state => state.setActiveTab);
  const activePanel = useAnyspendUIStore(state => state.activePanel);
  const setActivePanel = useAnyspendUIStore(state => state.setActivePanel);
  const animationDirection = useAnyspendUIStore(state => state.animationDirection);
  const navigateToPanel = useAnyspendUIStore(state => state.navigateToPanel);
  const navigateBack = useAnyspendUIStore(state => state.navigateBack);

  const orderId = useAnyspendOrderStore(state => state.orderId);
  const setOrderId = useAnyspendOrderStore(state => state.setOrderId);

  const selectedCryptoPaymentMethod = useAnyspendPaymentStore(state => state.selectedCryptoPaymentMethod);
  const setSelectedCryptoPaymentMethod = useAnyspendPaymentStore(state => state.setSelectedCryptoPaymentMethod);
  const selectedFiatPaymentMethod = useAnyspendPaymentStore(state => state.selectedFiatPaymentMethod);
  const setSelectedFiatPaymentMethod = useAnyspendPaymentStore(state => state.setSelectedFiatPaymentMethod);

  const customRecipients = useAnyspendRecipientStore(state => state.customRecipients);
  const setCustomRecipients = useAnyspendRecipientStore(state => state.setCustomRecipients);

  const { orderAndTransactions: oat, getOrderAndTransactionsError } = useAnyspendOrderAndTransactions(orderId);
  !!getOrderAndTransactionsError && console.log("getOrderAndTransactionsError", getOrderAndTransactionsError);
  // const [newRecipientAddress, setNewRecipientAddress] = useState("");
  // const recipientInputRef = useRef<HTMLInputElement>(null);

  // Get initial chain IDs from URL or defaults
  const initialSrcChainId = parseInt(searchParams.get("fromChainId") || "0") || mainnet.id;
  const initialDstChainId =
    parseInt(searchParams.get("toChainId") || "0") || (isBuyMode ? destinationTokenChainId : base.id);

  // Use swap store - single selectors per repo rules
  const selectedSrcChainId = useAnyspendSwapStore(state => state.selectedSrcChainId);
  const setSelectedSrcChainId = useAnyspendSwapStore(state => state.setSelectedSrcChainId);
  const selectedSrcToken = useAnyspendSwapStore(state => state.selectedSrcToken);
  const setSelectedSrcToken = useAnyspendSwapStore(state => state.setSelectedSrcToken);
  const srcAmount = useAnyspendSwapStore(state => state.srcAmount);
  const setSrcAmount = useAnyspendSwapStore(state => state.setSrcAmount);
  const srcAmountOnRamp = useAnyspendSwapStore(state => state.srcAmountOnRamp);
  const setSrcAmountOnRamp = useAnyspendSwapStore(state => state.setSrcAmountOnRamp);

  const selectedDstChainId = useAnyspendSwapStore(state => state.selectedDstChainId);
  const setSelectedDstChainId = useAnyspendSwapStore(state => state.setSelectedDstChainId);
  const selectedDstToken = useAnyspendSwapStore(state => state.selectedDstToken);
  const setSelectedDstToken = useAnyspendSwapStore(state => state.setSelectedDstToken);
  const dstAmount = useAnyspendSwapStore(state => state.dstAmount);
  const setDstAmount = useAnyspendSwapStore(state => state.setDstAmount);
  const isSrcInputDirty = useAnyspendSwapStore(state => state.isSrcInputDirty);
  const setIsSrcInputDirty = useAnyspendSwapStore(state => state.setIsSrcInputDirty);

  // Memoize tokens to match original behavior - these update when chain selection changes
  const defaultSrcToken = useMemo(() => getDefaultToken(selectedSrcChainId), [selectedSrcChainId]);
  const srcTokenFromUrl = useTokenFromUrl({
    defaultToken: defaultSrcToken,
    prefix: "from",
  });
  const defaultDstToken = useMemo(
    () =>
      isBuyMode
        ? {
            symbol: "",
            chainId: destinationTokenChainId,
            address: destinationTokenAddress,
            name: "",
            decimals: 18,
            metadata: {},
          }
        : getDefaultToken(selectedDstChainId),
    [isBuyMode, destinationTokenChainId, destinationTokenAddress, selectedDstChainId],
  );
  const dstTokenFromUrl = useTokenFromUrl({
    defaultToken: defaultDstToken,
    prefix: "to",
  });

  const { data: srcTokenMetadata } = useTokenData(selectedSrcToken?.chainId, selectedSrcToken?.address);
  const { data: dstTokenMetadata } = useTokenData(selectedDstToken?.chainId, selectedDstToken?.address);
  // Add refs to track if we've applied metadata
  const appliedSrcMetadataRef = useRef(false);
  const appliedDstMetadataRef = useRef(false);

  // Initialize stores from URL/props on mount
  useEffect(() => {
    // Initialize UI store
    setActiveTab(defaultActiveTab);
    if (loadOrder) {
      setActivePanel(PanelView.ORDER_DETAILS);
      setOrderId(loadOrder);
    }

    // Initialize swap store from URL/props
    setSelectedSrcChainId(initialSrcChainId);
    setSelectedSrcToken(srcTokenFromUrl);
    setSrcAmount(searchParams.get("fromAmount") || "0.01");
    setSrcAmountOnRamp(searchParams.get("fromAmount") || "5");

    setSelectedDstChainId(initialDstChainId);
    setSelectedDstToken(isBuyMode ? defaultDstToken : dstTokenFromUrl);
    setDstAmount(searchParams.get("toAmount") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  // Load swap configuration from URL on initial render
  useEffect(() => {
    // Skip if we've already processed the URL or if we have an order to load
    if (initialUrlProcessed.current || loadOrder) return;

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
  }, [searchParams, loadOrder]);

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
      mode === "modal"
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

  // Use recipient store - single selectors per repo rules
  const recipientAddress = useAnyspendRecipientStore(state => state.recipientAddress);
  const setRecipientAddress = useAnyspendRecipientStore(state => state.setRecipientAddress);

  const { address: globalAddress, wallet: globalWallet } = useAccountWallet();
  const recipientProfile = useProfile({ address: recipientAddress, fresh: true });
  const recipientName = recipientProfile.data?.name;

  // Set default recipient address when wallet changes
  useEffect(() => {
    setRecipientAddress(recipientAddressFromProps || globalAddress);
  }, [recipientAddressFromProps, globalAddress, setRecipientAddress]);

  // Get geo-based onramp options for fiat payments
  const { geoData, coinbaseAvailablePaymentMethods, stripeWeb2Support } = useGeoOnrampOptions(srcAmountOnRamp);

  // Helper function to map payment method to onramp vendor
  const getOnrampVendor = (paymentMethod: FiatPaymentMethod): "coinbase" | "stripe" | "stripe-web2" | undefined => {
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        return "coinbase";
      case FiatPaymentMethod.STRIPE:
        // Determine if it's stripe onramp or stripe-web2 based on support
        if (stripeWeb2Support?.isSupport) {
          return "stripe-web2";
        }
        return undefined;
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
          recipientAddress,
        }
      : {
          srcChain: base.id,
          dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
          srcTokenAddress: USDC_BASE.address,
          dstTokenAddress: isBuyMode ? destinationTokenAddress : selectedDstToken.address,
          type: "swap",
          tradeType: "EXACT_INPUT",
          amount: srcAmountOnrampInWei,
          recipientAddress,
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
        if (!globalAddress && !recipientAddress && parsedRecipients.length > 0) {
          setRecipientAddress(parsedRecipients[0].address);
        }
      }
    } catch (err) {
      console.error("Error loading recipients from local storage:", err);
    }
    // Only run this effect once on mount
  }, [globalAddress, recipientAddress, customRecipients.length]);

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
        const amount = anyspendQuote.data.currencyOut.amount;
        const decimals = anyspendQuote.data.currencyOut.currency.decimals;
        setDstAmount(formatTokenAmount(BigInt(amount), decimals, 6, false));
      } else {
        const amount = anyspendQuote.data.currencyIn.amount;
        const decimals = anyspendQuote.data.currencyIn.currency.decimals;
        setSrcAmount(formatTokenAmount(BigInt(amount), decimals, 6, false));
      }
    } else {
      if (isSrcInputDirty) {
        setDstAmount("");
      } else {
        setSrcAmount("");
      }
    }
  }, [anyspendQuote, isSrcInputDirty]);

  useEffect(() => {
    if (oat?.data?.order.status === "executed" && !onSuccessCalled.current) {
      console.log("Calling onSuccess");
      const txHash = oat?.data?.executeTx?.txHash;
      onSuccess?.(txHash);
      onSuccessCalled.current = true;
    }
  }, [oat?.data?.order.status, oat?.data?.executeTx?.txHash, onSuccess]);

  // Reset flag when orderId changes
  useEffect(() => {
    onSuccessCalled.current = false;
  }, [orderId]);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      setOrderId(orderId);
      // setNewRecipientAddress("");
      navigateToPanel(PanelView.ORDER_DETAILS, "forward");

      // Debug: Check payment method before setting URL
      console.log("Creating order - selectedCryptoPaymentMethod:", selectedCryptoPaymentMethod);

      // Add orderId and payment method to URL for persistence
      const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
      params.set("orderId", orderId);
      if (selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
        console.log("Setting cryptoPaymentMethod in URL:", selectedCryptoPaymentMethod);
        params.set("cryptoPaymentMethod", selectedCryptoPaymentMethod);
      } else {
        console.log("Payment method is NONE, not setting in URL");
      }
      console.log("Final URL params:", params.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
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

      // Add orderId and payment method to URL for persistence
      const params = new URLSearchParams(searchParams.toString());
      params.set("orderId", orderId);
      params.set("paymentMethod", "fiat");
      router.push(`${window.location.pathname}?${params.toString()}`);
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

  // Determine button state and text
  const btnInfo: { text: string; disable: boolean; error: boolean; loading: boolean } = useMemo(() => {
    if (activeInputAmountInWei === "0") return { text: "Enter an amount", disable: true, error: false, loading: false };
    if (isSameChainSameToken)
      return { text: "Select a different token or chain", disable: true, error: false, loading: false };
    if (isLoadingAnyspendQuote) return { text: "Loading quote...", disable: true, error: false, loading: true };
    if (!recipientAddress) return { text: "Select recipient", disable: false, error: false, loading: false };
    if (isCreatingOrder || isCreatingOnrampOrder)
      return { text: "Creating order...", disable: true, error: false, loading: true };
    if (!anyspendQuote || !anyspendQuote.success)
      return { text: "No quote found", disable: true, error: false, loading: false };

    if (activeTab === "crypto") {
      // If no payment method selected, show "Choose payment method"
      if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
        return { text: "Choose payment method", disable: false, error: false, loading: false };
      }
      // If payment method selected, show appropriate action
      if (
        selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
        selectedCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET
      ) {
        return { text: "Swap", disable: false, error: false, loading: false };
      }
      if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO) {
        return { text: "Continue to payment", disable: false, error: false, loading: false };
      }
    }

    if (activeTab === "fiat") {
      // If no fiat payment method selected, show "Select payment method"
      if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
        return { text: "Select payment method", disable: false, error: false, loading: false };
      }
      // If payment method is selected, show "Buy"
      return { text: "Buy", disable: false, error: false, loading: false };
    }

    return { text: "Buy", disable: false, error: false, loading: false };
  }, [
    activeInputAmountInWei,
    isSameChainSameToken,
    isLoadingAnyspendQuote,
    recipientAddress,
    isCreatingOrder,
    isCreatingOnrampOrder,
    anyspendQuote,
    activeTab,
    selectedCryptoPaymentMethod,
    selectedFiatPaymentMethod,
  ]);

  // Handle main button click
  const onMainButtonClick = async () => {
    if (btnInfo.disable) return;

    if (!recipientAddress) {
      navigateToPanel(PanelView.RECIPIENT_SELECTION, "forward");
      return;
    }

    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(recipientAddress, "Recipient address is not found");

      if (activeTab === "fiat") {
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
        // If no payment method selected, show payment method selection
        if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
          console.log("No payment method selected, showing selection panel");
          navigateToPanel(PanelView.CRYPTO_PAYMENT_METHOD, "forward");
          return;
        }

        // If payment method is selected, create order with payment method info
        if (
          selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ||
          selectedCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET ||
          selectedCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO
        ) {
          console.log("Creating crypto order with payment method:", selectedCryptoPaymentMethod);
          await handleCryptoSwap(selectedCryptoPaymentMethod);
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
    // Remove orderId and paymentMethod from URL when going back to history
    const params = new URLSearchParams(searchParams.toString());
    params.delete("orderId");
    params.delete("paymentMethod");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Handle crypto swap creation
  const handleCryptoSwap = async (method: CryptoPaymentMethodType) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(recipientAddress, "Recipient address is not found");

      // Debug: Check payment method values
      console.log("handleCryptoSwap - method parameter:", method);
      console.log("handleCryptoSwap - selectedCryptoPaymentMethod state:", selectedCryptoPaymentMethod);

      const srcAmountBigInt = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);

      createOrder({
        recipientAddress,
        orderType: "swap",
        srcChain: selectedSrcChainId,
        dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
        srcToken: selectedSrcToken,
        dstToken: isBuyMode
          ? { ...selectedDstToken, chainId: destinationTokenChainId, address: destinationTokenAddress }
          : selectedDstToken,
        srcAmount: srcAmountBigInt.toString(),
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount || "0",
        creatorAddress: globalAddress,
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
      invariant(recipientAddress, "Recipient address is not found");

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
        if (!stripeWeb2Support || !stripeWeb2Support.isSupport) {
          toast.error("Stripe not available");
          return;
        }
        vendor = stripeWeb2Support && stripeWeb2Support.isSupport ? "stripe-web2" : "stripe";
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
        recipientAddress,
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
        creatorAddress: globalAddress,
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
    if (loadOrder) return; // Skip if we have a loadOrder

    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setOrderId(orderIdParam);
      setActivePanel(PanelView.ORDER_DETAILS);
    }
  }, [searchParams, loadOrder]);

  const onSelectOrder = (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    navigateToPanel(PanelView.ORDER_DETAILS, "forward");
    // Update URL with the new orderId and preserve existing parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderId", selectedOrderId);
    // Keep existing paymentMethod if present
    router.push(`${window.location.pathname}?${params.toString()}`);
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

  const historyView = (
    <div className={"mx-auto flex w-[560px] max-w-full flex-col items-center"}>
      <OrderHistory mode={mode} onBack={navigateBack} onSelectOrder={onSelectOrder} />
    </div>
  );

  const orderDetailsView = (
    <div className={"mx-auto w-[460px] max-w-full"}>
      <div className="relative flex flex-col gap-4">
        {oat && (
          <OrderDetails
            mode={mode}
            order={oat.data.order}
            depositTxs={oat.data.depositTxs}
            relayTxs={oat.data.relayTxs}
            executeTx={oat.data.executeTx}
            refundTxs={oat.data.refundTxs}
            selectedCryptoPaymentMethod={selectedCryptoPaymentMethod}
            onPaymentMethodChange={setSelectedCryptoPaymentMethod}
            points={oat.data.points || undefined}
            onBack={() => {
              setOrderId(undefined);
              navigateBack();
              setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE); // Reset payment method when going back
            }}
          />
        )}
        {/* {mode === "page" && <div className="h-12" />} */}
      </div>
    </div>
  );

  const onrampPaymentView = (
    <PanelOnrampPayment
      srcAmountOnRamp={srcAmountOnRamp}
      recipientName={recipientName || undefined}
      recipientAddress={recipientAddress}
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
      }}
      onBack={navigateBack}
      recipientEnsName={globalWallet?.ensName}
      recipientImageUrl={globalWallet?.meta?.icon}
    />
  );

  const recipientSelectionView = (
    <RecipientSelection
      initialValue={recipientAddress || ""}
      onBack={navigateBack}
      onConfirm={address => {
        setRecipientAddress(address);
        navigateBack();
      }}
    />
  );

  const cryptoPaymentMethodView = (
    <CryptoPaymentMethod
      globalAddress={globalAddress}
      globalWallet={globalWallet}
      selectedPaymentMethod={selectedCryptoPaymentMethod}
      setSelectedPaymentMethod={setSelectedCryptoPaymentMethod}
      isCreatingOrder={isCreatingOrder}
      onBack={navigateBack}
      onSelectPaymentMethod={(method: CryptoPaymentMethodType) => {
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

  // Add tabs to the main component when no order is loaded
  return (
    <StyleRoot>
      <div
        className={cn(
          "anyspend-container font-inter mx-auto w-full max-w-[460px]",
          mode === "page" &&
            "bg-as-surface-primary border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
        )}
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
          custom={animationDirection}
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
              <AnyspendMainView
                mode={mode}
                isBuyMode={isBuyMode}
                destinationTokenAddress={destinationTokenAddress}
                destinationTokenChainId={destinationTokenChainId}
                hideTransactionHistoryButton={hideTransactionHistoryButton}
                onTokenSelect={onTokenSelect}
                customUsdInputValues={customUsdInputValues}
                btnInfo={btnInfo}
                onMainButtonClick={onMainButtonClick}
                onClickHistory={onClickHistory}
                anyspendQuote={anyspendQuote}
                isLoadingAnyspendQuote={isLoadingAnyspendQuote}
              />
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
          ]}
        </TransitionPanel>
      </div>
    </StyleRoot>
  );
}
