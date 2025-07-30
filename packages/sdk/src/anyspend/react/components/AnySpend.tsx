"use client";

import { getDefaultToken, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
} from "@b3dotfun/sdk/anyspend/react";
import {
  Button,
  ShinyButton,
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
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import invariant from "invariant";
import { ArrowDown, ChevronLeft, ChevronRightCircle, ChevronsUpDown, CircleAlert, HistoryIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { b3Sepolia, base, mainnet, sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { components } from "../../types/api";
import { CryptoPaymentMethod, PaymentMethod } from "./common/CryptoPaymentMethod";
import { OrderDetails, OrderDetailsLoadingView } from "./common/OrderDetails";
import { OrderHistory } from "./common/OrderHistory";
import { OrderStatus } from "./common/OrderStatus";
import { OrderTokenAmount } from "./common/OrderTokenAmount";
import { PanelOnramp } from "./common/PanelOnramp";
import { PanelOnrampPayment } from "./common/PanelOnrampPayment";
import { TokenBalance } from "./common/TokenBalance";

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
}

const ANYSPEND_RECIPIENTS_KEY = "anyspend_recipients";

export function AnySpend({
  destinationTokenAddress,
  destinationTokenChainId,
  isMainnet = true,
  mode = "modal",
  defaultActiveTab = "crypto",
  loadOrder,
  hideTransactionHistoryButton,
  recipientAddress: recipientAddressFromProps,
}: {
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  isMainnet?: boolean;
  mode?: "page" | "modal";
  defaultActiveTab?: "crypto" | "fiat";
  loadOrder?: string;
  hideTransactionHistoryButton?: boolean;
  recipientAddress?: string;
}) {
  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  // Get wagmi account state for wallet connection
  const wagmiAccount = useAccount();

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

  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">(defaultActiveTab);

  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);
  const { orderAndTransactions: oat, getOrderAndTransactionsError } = useAnyspendOrderAndTransactions(
    isMainnet,
    orderId,
  );
  !!getOrderAndTransactionsError && console.log("getOrderAndTransactionsError", getOrderAndTransactionsError);

  const [activePanel, setActivePanel] = useState<PanelView>(loadOrder ? PanelView.ORDER_DETAILS : PanelView.MAIN);
  const [customRecipients, setCustomRecipients] = useState<RecipientOption[]>([]);
  // Add state for selected payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.NONE);
  // const [newRecipientAddress, setNewRecipientAddress] = useState("");
  // const recipientInputRef = useRef<HTMLInputElement>(null);

  // Get initial chain IDs from URL or defaults
  const initialSrcChainId = parseInt(searchParams.get("fromChainId") || "0") || (isMainnet ? mainnet.id : sepolia.id);
  const initialDstChainId =
    parseInt(searchParams.get("toChainId") || "0") ||
    (isBuyMode ? destinationTokenChainId : isMainnet ? base.id : b3Sepolia.id);

  // State for source chain/token selection
  const [selectedSrcChainId, setSelectedSrcChainId] = useState<number>(initialSrcChainId);
  const defaultSrcToken = getDefaultToken(selectedSrcChainId);
  const srcTokenFromUrl = useTokenFromUrl({
    defaultToken: defaultSrcToken,
    prefix: "from",
  });
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(srcTokenFromUrl);
  const { data: srcTokenMetadata } = useTokenData(selectedSrcToken?.chainId, selectedSrcToken?.address);
  const [srcAmount, setSrcAmount] = useState<string>(searchParams.get("fromAmount") || "0.01");

  // State for onramp amount
  const [srcAmountOnRamp, setSrcAmountOnRamp] = useState<string>(searchParams.get("fromAmount") || "5");

  // State for destination chain/token selection
  const [selectedDstChainId, setSelectedDstChainId] = useState<number>(initialDstChainId);
  const defaultDstToken = isBuyMode
    ? {
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

  // State for recipient selection
  const [recipientAddress, setRecipientAddress] = useState<string | undefined>();

  const { address: globalAddress, wallet: globalWallet } = useAccountWallet();

  // Set default recipient address when wallet changes
  useEffect(() => {
    setRecipientAddress(recipientAddressFromProps || globalAddress);
  }, [recipientAddressFromProps, globalAddress]);

  // Get anyspend price
  const activeInputAmountInWei = isSrcInputDirty
    ? parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals).toString()
    : parseUnits(dstAmount.replace(/,/g, ""), selectedDstToken.decimals).toString();
  const srcAmountOnrampInWei = parseUnits(srcAmountOnRamp.replace(/,/g, ""), USDC_BASE.decimals).toString();
  const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } = useAnyspendQuote(
    isMainnet,
    activeTab === "crypto"
      ? {
          srcChain: selectedSrcChainId,
          dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
          srcTokenAddress: selectedSrcToken.address,
          dstTokenAddress: isBuyMode ? destinationTokenAddress : selectedDstToken.address,
          type: "swap",
          tradeType: isSrcInputDirty ? "EXACT_INPUT" : "EXPECTED_OUTPUT",
          amount: activeInputAmountInWei,
        }
      : {
          srcChain: base.id,
          dstChain: isBuyMode ? destinationTokenChainId : selectedDstChainId,
          srcTokenAddress: USDC_BASE.address,
          dstTokenAddress: isBuyMode ? destinationTokenAddress : selectedDstToken.address,
          type: "swap",
          tradeType: "EXACT_INPUT",
          amount: srcAmountOnrampInWei,
        },
  );

  const recipientProfile = useProfile({ address: recipientAddress });
  const recipientName = recipientProfile.data?.name?.replace(/\.b3\.fun/g, "");

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

  // Available recipient options
  // const recipientOptions = useMemo<RecipientOption[]>(() => {
  //   const options: RecipientOption[] = [];

  //   // Add current wallet if connected
  //   if (globalAddress) {
  //     options.push({
  //       address: globalAddress,
  //       icon: "https://gradvatar.com/" + globalAddress,
  //       label: "Current Wallet",
  //       ensName: walletName
  //     });
  //   }

  //   // Add custom recipients with their onchain names
  //   customRecipients.forEach((recipient, index) => {
  //     options.push({
  //       ...recipient,
  //       ensName: customRecipientNames[index] || undefined
  //     });
  //   });

  //   // Add current recipientAddress if it exists and isn't already in options
  //   if (
  //     recipientAddress &&
  //     !options.some(opt => normalizeAddress(opt.address) === normalizeAddress(recipientAddress))
  //   ) {
  //     options.push({
  //       address: recipientAddress,
  //       label: `Custom (${centerTruncate(recipientAddress, 6)})`,
  //       ensName: recipientName
  //     });
  //   }

  //   return options;
  // }, [globalAddress, customRecipients, recipientAddress, recipientName, walletName, customRecipientNames]);

  // const handleCreateOrder = async (recipientAddress: string) => {
  //   try {
  //     invariant(anyspendPrice, "Relay price is not found");
  //     const srcAmountBigInt = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);

  //     createOrder({
  //       isMainnet,
  //       recipientAddress,
  //       orderType: "swap",
  //       srcChain: selectedSrcChainId,
  //       dstChain: selectedDstChainId,
  //       srcToken: selectedSrcToken,
  //       dstToken: selectedDstToken,
  //       srcAmount: srcAmountBigInt.toString(),
  //       expectedDstAmount: anyspendPrice?.data?.currencyOut?.amount || "0"
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     toast.error((err as Error).message);
  //     throw err; // Re-throw to handle in the calling function
  //   }
  // };

  // const handleSaveRecipient = async () => {
  //   if (!newRecipientAddress) {
  //     toast.error("Please enter an address");
  //     recipientInputRef.current?.focus();
  //     return;
  //   }

  //   let normalizedAddress: string;

  //   try {
  //     // Handle ENS name
  //     if (
  //       newRecipientAddress.toLowerCase().endsWith(".eth") ||
  //       newRecipientAddress.startsWith("@") ||
  //       newRecipientAddress.includes(".b3")
  //     ) {
  //       if (!resolvedAddress) {
  //         toast.error("Could not resolve ENS name");
  //         return;
  //       }
  //       normalizedAddress = getAddress(resolvedAddress);
  //     }
  //     // Handle regular address
  //     else {
  //       if (!isEvmOrSolanaAddress(newRecipientAddress)) {
  //         toast.error("Please enter a valid address or ENS name");
  //         recipientInputRef.current?.focus();
  //         return;
  //       }
  //       normalizedAddress = normalizeAddress(newRecipientAddress);
  //     }

  //     // Check for duplicate address
  //     if (!customRecipients.some(r => normalizeAddress(r.address) === normalizedAddress)) {
  //       // Add to custom recipients
  //       const newRecipient = {
  //         address: normalizedAddress,
  //         label:
  //           newRecipientAddress.toLowerCase().endsWith(".eth") ||
  //           newRecipientAddress.startsWith("@") ||
  //           newRecipientAddress.includes(".b3")
  //             ? newRecipientAddress // Keep ENS name as label
  //             : `Custom (${centerTruncate(normalizedAddress, 6)})`
  //       };
  //       setCustomRecipients(prev => [...prev, newRecipient]);
  //     }
  //     setRecipientAddress(normalizedAddress);

  //     // Handle based on login state
  //     if (!globalAddress) {
  //       await handleCreateOrder(normalizedAddress);
  //     } else {
  //       setActivePanel(PanelView.MAIN);
  //     }
  //   } catch (err) {
  //     // Error handling is done in handleCreateOrder
  //     console.error("Error in handleSaveRecipient:", err);
  //   }
  // };

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

  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      setOrderId(orderId);
      // setNewRecipientAddress("");
      setActivePanel(PanelView.ORDER_DETAILS);

      // Debug: Check payment method before setting URL
      console.log("Creating order - selectedPaymentMethod:", selectedPaymentMethod);

      // Add orderId and payment method to URL for persistence
      const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
      params.set("orderId", orderId);
      if (selectedPaymentMethod !== PaymentMethod.NONE) {
        console.log("Setting paymentMethod in URL:", selectedPaymentMethod);
        params.set("paymentMethod", selectedPaymentMethod);
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

  // Determine button state and text
  const btnInfo: { text: string; disable: boolean; error: boolean } = useMemo(() => {
    if (activeInputAmountInWei === "0") return { text: "Enter an amount", disable: true, error: false };
    if (isLoadingAnyspendQuote) return { text: "Loading...", disable: true, error: false };
    if (!recipientAddress) return { text: "Select recipient", disable: false, error: false };
    if (isCreatingOrder) return { text: "Creating order...", disable: true, error: false };
    if (!anyspendQuote || !anyspendQuote.success) return { text: "Get rate error", disable: true, error: true };
    if (activeTab === "crypto") {
      // If no payment method selected, show "Choose payment method"
      if (selectedPaymentMethod === PaymentMethod.NONE) {
        return { text: "Choose payment method", disable: false, error: false };
      }
      // If payment method selected, show appropriate action
      if (selectedPaymentMethod === PaymentMethod.CONNECT_WALLET) {
        return { text: "Swap", disable: false, error: false };
      }
      if (selectedPaymentMethod === PaymentMethod.TRANSFER_CRYPTO) {
        return { text: "Continue to payment", disable: false, error: false };
      }
    }
    return { text: "Buy", disable: false, error: false };
  }, [
    activeInputAmountInWei,
    isLoadingAnyspendQuote,
    recipientAddress,
    isCreatingOrder,
    anyspendQuote,
    activeTab,
    selectedPaymentMethod,
  ]);

  // Handle main button click
  const onMainButtonClick = async () => {
    if (btnInfo.disable) return;

    if (!recipientAddress) {
      setActivePanel(PanelView.RECIPIENT_SELECTION);
      return;
    }

    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(recipientAddress, "Recipient address is not found");

      if (activeTab === "fiat") {
        setActivePanel(PanelView.FIAT_PAYMENT);
        return;
      }

      if (activeTab === "crypto") {
        // If no payment method selected, show payment method selection
        if (selectedPaymentMethod === PaymentMethod.NONE) {
          console.log("No payment method selected, showing selection panel");
          setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD);
          return;
        }

        // If payment method is selected, create order with payment method info
        if (
          selectedPaymentMethod === PaymentMethod.CONNECT_WALLET ||
          selectedPaymentMethod === PaymentMethod.TRANSFER_CRYPTO
        ) {
          console.log("Creating crypto order with payment method:", selectedPaymentMethod);
          await handleCryptoSwap(selectedPaymentMethod);
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
    setActivePanel(PanelView.HISTORY);
    // Remove orderId and paymentMethod from URL when going back to history
    const params = new URLSearchParams(searchParams.toString());
    params.delete("orderId");
    params.delete("paymentMethod");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Handle crypto swap creation
  const handleCryptoSwap = async (method: PaymentMethod) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(recipientAddress, "Recipient address is not found");

      // Debug: Check payment method values
      console.log("handleCryptoSwap - method parameter:", method);
      console.log("handleCryptoSwap - selectedPaymentMethod state:", selectedPaymentMethod);

      const srcAmountBigInt = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);

      createOrder({
        isMainnet,
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
    setActivePanel(PanelView.MAIN);
    setOrderId(selectedOrderId);
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

  const calculatePriceImpact = (inputUsd?: string | number, outputUsd?: string | number) => {
    if (!inputUsd || !outputUsd) {
      return { percentage: "0.00", isNegative: false };
    }

    const input = Number(inputUsd);
    const output = Number(outputUsd);

    // Handle edge cases
    if (input === 0 || isNaN(input) || isNaN(output) || input <= output) {
      return { percentage: "0.00", isNegative: false };
    }

    const percentageValue = ((output - input) / input) * 100;

    // Handle the -0.00% case
    if (percentageValue > -0.005 && percentageValue < 0) {
      return { percentage: "0.00", isNegative: false };
    }

    return {
      percentage: Math.abs(percentageValue).toFixed(2),
      isNegative: percentageValue < 0,
    };
  };

  // Add state for rate details toggle
  // const [showRateDetails, setShowRateDetails] = useState(false);

  const historyView = (
    <div className={"mx-auto flex w-[560px] max-w-full flex-col items-center"}>
      <OrderHistory mode={mode} onBack={() => setActivePanel(PanelView.MAIN)} onSelectOrder={onSelectOrder} />
    </div>
  );

  const orderDetailsView = (
    <div className={"mx-auto w-[460px] max-w-full"}>
      <div className="relative flex flex-col gap-4">
        {oat && (
          <>
            <OrderStatus order={oat.data.order} />
            <OrderDetails
              isMainnet={isMainnet}
              mode={mode}
              order={oat.data.order}
              depositTxs={oat.data.depositTxs}
              relayTx={oat.data.relayTx}
              executeTx={oat.data.executeTx}
              refundTxs={oat.data.refundTxs}
              onBack={() => {
                setOrderId(undefined);
                setActivePanel(PanelView.MAIN);
                setSelectedPaymentMethod(PaymentMethod.NONE); // Reset payment method when going back
              }}
            />
          </>
        )}
        {/* {mode === "page" && <div className="h-12" />} */}
      </div>
    </div>
  );

  const mainView = (
    <div className={"mx-auto flex w-[460px] max-w-full flex-col items-center gap-2"}>
      {/* Token Header - Show when in buy mode */}
      {isBuyMode && (
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          {selectedDstToken.metadata?.logoURI && (
            <div className="relative">
              <img
                src={selectedDstToken.metadata.logoURI}
                alt={selectedDstToken.symbol}
                className="border-as-stroke h-12 w-12 rounded-full border-2 shadow-md"
              />
            </div>
          )}
          <div>
            <h1 className="text-as-primary text-xl font-bold">Buy {selectedDstToken.symbol}</h1>
          </div>
        </div>
      )}

      {/* Tab section */}
      <div className="w-full">
        <div className="bg-as-on-surface-1 relative mb-4 inline-grid h-10 grid-cols-2 rounded-xl">
          <div
            className={cn(
              "bg-as-brand absolute bottom-0 left-0 top-0 z-0 rounded-xl transition-transform duration-100",
              "h-full w-1/2",
              activeTab === "fiat" ? "translate-x-full" : "translate-x-0",
            )}
            style={{ willChange: "transform" }}
          />
          <button
            className={cn(
              "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
              activeTab === "crypto" ? "text-white" : "text-as-primary/70 hover:bg-as-on-surface-2 bg-transparent",
            )}
            onClick={() => {
              setActiveTab("crypto");
              setSelectedPaymentMethod(PaymentMethod.NONE); // Reset payment method when switching to crypto
            }}
          >
            Swap
          </button>
          <button
            className={cn(
              "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
              activeTab === "fiat" ? "text-white" : "text-as-primary/70 hover:bg-as-on-surface-2 bg-transparent",
            )}
            onClick={() => {
              setActiveTab("fiat");
              setSelectedPaymentMethod(PaymentMethod.NONE); // Reset payment method when switching to fiat
            }}
          >
            Buy
          </button>
        </div>
      </div>

      {/* {selectedSrcChainId === base.id || selectedDstChainId === base.id || activeTab === "fiat" ? (
        <>
          <Warning text="Base is experiencing temporary issues. Please check back later." />

          <div className="h-1" />
        </>
      ) : null} */}

      <div className="relative flex max-w-[calc(100vw-32px)] flex-col gap-2">
        {/* Send section */}
        {activeTab === "crypto" ? (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
            className="bg-as-surface-secondary border-as-border-secondary relative flex w-full flex-col gap-2 rounded-2xl border p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-as-primary/50 flex h-7 items-center text-sm">Pay</div>
              <button
                className="text-as-primary/50 hover:text-as-primary/70 flex h-7 items-center gap-1 text-sm transition-colors"
                onClick={() => setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD)}
              >
                {selectedPaymentMethod === PaymentMethod.CONNECT_WALLET ? (
                  <>
                    {globalAddress || wagmiAccount.address ? (
                      <>
                        {globalWallet?.meta?.icon && (
                          <img src={globalWallet.meta.icon} alt="Connected Wallet" className="h-4 w-4 rounded-full" />
                        )}
                        <span>{shortenAddress(globalAddress || wagmiAccount.address || "")}</span>
                      </>
                    ) : (
                      "Connect wallet"
                    )}
                    <ChevronRightCircle className="h-4 w-4" />
                  </>
                ) : selectedPaymentMethod === PaymentMethod.TRANSFER_CRYPTO ? (
                  <>
                    Transfer crypto
                    <ChevronRightCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Select payment method
                    <ChevronRightCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            <OrderTokenAmount
              address={globalAddress}
              context="from"
              inputValue={srcAmount}
              onChangeInput={value => {
                setIsSrcInputDirty(true);
                setSrcAmount(value);
              }}
              chainId={selectedSrcChainId}
              setChainId={setSelectedSrcChainId}
              token={selectedSrcToken}
              setToken={setSelectedSrcToken}
            />
            <div className="flex items-center justify-between">
              <div className="text-as-primary/50 flex h-5 items-center text-sm">
                {formatDisplayNumber(anyspendQuote?.data?.currencyIn?.amountUsd, { style: "currency", fallback: "" })}
              </div>
              <TokenBalance
                token={selectedSrcToken}
                walletAddress={globalAddress}
                onChangeInput={value => {
                  setIsSrcInputDirty(true);
                  setSrcAmount(value);
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
          >
            <PanelOnramp srcAmountOnRamp={srcAmountOnRamp} setSrcAmountOnRamp={setSrcAmountOnRamp} />
          </motion.div>
        )}

        {/* Reverse swap direction section */}
        <Button
          variant="ghost"
          className={cn(
            "border-as-stroke bg-as-surface-primary absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 sm:h-8 sm:w-8 sm:rounded-xl",
            (activeTab === "fiat" || isBuyMode) && "top-[calc(50%+56px)] cursor-default",
          )}
          onClick={() => {
            if (activeTab === "fiat" || isBuyMode) {
              return;
            }

            // Swap chain selections
            const tempSrcChainId = selectedSrcChainId;
            const tempDstChainId = selectedDstChainId;
            setSelectedSrcChainId(tempDstChainId);
            setSelectedDstChainId(tempSrcChainId);

            // Swap token selections
            const tempSrcToken = selectedSrcToken;
            const tempDstToken = selectedDstToken;
            setSelectedSrcToken(tempDstToken);
            setSelectedDstToken(tempSrcToken);

            // Swap amounts
            const tempSrcAmount = srcAmount;
            const tempDstAmount = dstAmount;
            setSrcAmount(tempDstAmount);
            setDstAmount(tempSrcAmount);
          }}
        >
          <div className="relative flex items-center justify-center transition-opacity">
            <ArrowDown className="text-as-primary/50 h-5 w-5" />
          </div>
        </Button>

        {/* Receive section */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
          className="bg-as-surface-secondary border-as-border-secondary relative flex w-full flex-col gap-2 rounded-2xl border p-4 sm:p-6"
        >
          <div className="flex w-full items-center justify-between">
            <div className="text-as-primary/50 flex h-7 items-center text-sm">Receive</div>
            {recipientAddress ? (
              <button
                className={cn("text-as-primary/70 flex h-7 items-center gap-2 rounded-lg px-2")}
                onClick={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
              >
                {globalAddress && recipientAddress === globalAddress && globalWallet?.meta?.icon ? (
                  <img
                    src={globalWallet?.meta?.icon}
                    alt="Current wallet"
                    className="bg-as-primary h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                    🦊
                  </div>
                )}
                <div className="text-sm">{recipientName ? recipientName : shortenAddress(recipientAddress)}</div>
                <ChevronRightCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                className="text-as-primary/70 flex items-center gap-1 rounded-lg"
                onClick={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
              >
                <div className="text-sm font-medium">Select recipient</div>
                <ChevronsUpDown className="h-3 w-3" />
              </button>
            )}
          </div>
          {isBuyMode ? (
            // Fixed destination token display in buy mode
            <div className="flex items-center justify-between">
              <div className="text-as-primary text-2xl font-bold">{dstAmount || "0"}</div>
              <div className="bg-as-brand/10 border-as-brand/30 flex items-center gap-3 rounded-xl border px-4 py-3">
                {selectedDstToken.metadata?.logoURI && (
                  <img
                    src={selectedDstToken.metadata.logoURI}
                    alt={selectedDstToken.symbol}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-as-brand text-lg font-bold">{selectedDstToken.symbol}</span>
              </div>
            </div>
          ) : (
            <OrderTokenAmount
              address={recipientAddress}
              context="to"
              inputValue={dstAmount}
              onChangeInput={value => {
                setIsSrcInputDirty(false);
                setDstAmount(value);
              }}
              chainId={selectedDstChainId}
              setChainId={setSelectedDstChainId}
              token={selectedDstToken}
              setToken={setSelectedDstToken}
            />
          )}
          <div className="text-as-primary/50 flex h-5 items-center text-sm">
            {formatDisplayNumber(anyspendQuote?.data?.currencyOut?.amountUsd, { style: "currency", fallback: "" })}
            {anyspendQuote?.data?.currencyIn?.amountUsd &&
              anyspendQuote?.data?.currencyOut?.amountUsd &&
              (() => {
                const { percentage, isNegative } = calculatePriceImpact(
                  anyspendQuote.data.currencyIn.amountUsd,
                  anyspendQuote.data.currencyOut.amountUsd,
                );

                // Parse the percentage as a number for comparison
                const percentageNum = parseFloat(percentage);

                // Don't show if less than 1%
                if (percentageNum < 1) {
                  return null;
                }

                // Using inline style to ensure color displays
                return (
                  <span className="ml-2" style={{ color: percentageNum >= 10 ? "red" : "#FFD700" }}>
                    ({isNegative ? "-" : ""}
                    {percentage}%)
                  </span>
                );
              })()}
          </div>
        </motion.div>
      </div>

      {/* Order details section */}
      {/* <div className="bg-as-on-surface-1 flex w-full max-w-[460px] items-center justify-between rounded-2xl p-4">
        <div className="text-as-primary flex w-full items-center justify-between text-sm font-medium">
          <div>
            1 {selectedSrcToken.symbol} = {anyspendPrice?.data?.rate} {selectedDstToken.symbol}
          </div>
          <div
            className="ml-10 flex flex-1 cursor-pointer items-center justify-end"
            onClick={() => setShowRateDetails(!showRateDetails)}
          >
            <motion.div
              animate={{ rotate: showRateDetails ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="w-fit"
            >
              <ChevronDown className="text-as-primary/70 h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </div> */}

      {/* Error message section */}
      {getAnyspendQuoteError && (
        <div className="bg-as-on-surface-1 flex w-full max-w-[460px] items-center gap-2 rounded-2xl p-4">
          <CircleAlert className="bg-as-red h-4 min-h-4 w-4 min-w-4 rounded-full p-0 text-sm font-medium text-white" />
          <div className="text-as-red text-sm">{getAnyspendQuoteError.message}</div>
        </div>
      )}

      {/* Main button section */}
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
        className="mt-4 flex w-full max-w-[460px] flex-col gap-2 pb-2"
      >
        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          disabled={btnInfo.disable}
          onClick={onMainButtonClick}
          className={cn(
            "relative w-full",
            btnInfo.error ? "!bg-as-red" : btnInfo.disable ? "!bg-as-on-surface-2" : "!bg-as-brand",
          )}
          textClassName={cn(btnInfo.error ? "text-white" : btnInfo.disable ? "text-as-secondary" : "text-white")}
        >
          {btnInfo.text}
          {!btnInfo.disable && !btnInfo.error && (
            <ChevronRightCircle className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
          )}
        </ShinyButton>

        {!hideTransactionHistoryButton && (globalAddress || recipientAddress) ? (
          <Button
            variant="link"
            onClick={onClickHistory}
            className="text-as-primary/50 hover:text-as-primary flex items-center gap-1 transition-colors"
          >
            <HistoryIcon className="h-4 w-4" /> <span className="pr-4">Transaction History</span>
          </Button>
        ) : null}
      </motion.div>
    </div>
  );

  const onrampPaymentView = (
    <PanelOnrampPayment
      srcAmountOnRamp={srcAmountOnRamp}
      recipientName={recipientName}
      recipientAddress={recipientAddress}
      isMainnet={isMainnet}
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
        setActivePanel(PanelView.ORDER_DETAILS);
        // Add orderId and payment method to URL for persistence
        const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
        params.set("orderId", orderId);
        // For fiat payments, the payment method is always fiat (but we use the active tab context)
        if (activeTab === "fiat") {
          params.set("paymentMethod", "fiat");
        } else if (selectedPaymentMethod !== PaymentMethod.NONE) {
          params.set("paymentMethod", selectedPaymentMethod);
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
      }}
      onBack={() => setActivePanel(PanelView.MAIN)}
      recipientEnsName={globalWallet?.ensName}
      recipientImageUrl={globalWallet?.meta?.icon}
    />
  );

  const recipientSelectionView = (
    <div className="mx-auto w-[460px] max-w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-around">
          <button
            onClick={() => setActivePanel(PanelView.MAIN)}
            className="text-as-quaternary hover:text-as-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-as-primary text-lg font-semibold">Add recipient address or ENS</h2>
            <p className="text-as-primary/60 text-sm">Swap and send tokens to another address</p>
          </div>
        </div>

        {/* Address Input */}
        <div className="flex flex-col gap-4">
          <div className="bg-as-surface-secondary border-as-border-secondary flex h-12 w-full overflow-hidden rounded-xl border">
            <input
              type="text"
              placeholder="Enter recipient address"
              value={recipientAddress || ""}
              onChange={e => setRecipientAddress(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && recipientAddress) {
                  setActivePanel(PanelView.MAIN);
                }
              }}
              className="text-as-primary placeholder:text-as-primary/50 flex-1 bg-transparent px-4 text-base focus:outline-none"
              autoFocus
            />
            <div className="border-as-border-secondary border-l">
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setRecipientAddress(text);
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                  }
                }}
                className="text-as-primary/70 hover:text-as-primary hover:bg-as-surface-primary h-full px-4 font-semibold transition-colors"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={() => {
              if (recipientAddress) {
                setActivePanel(PanelView.MAIN);
              }
            }}
            disabled={!recipientAddress}
            className="bg-as-brand hover:bg-as-brand/90 disabled:bg-as-on-surface-2 disabled:text-as-secondary h-12 w-full rounded-xl font-medium text-white transition-colors disabled:cursor-not-allowed"
          >
            Confirm recipient address
          </button>
        </div>
      </div>
    </div>
  );

  const cryptoPaymentMethodView = (
    <CryptoPaymentMethod
      globalAddress={globalAddress}
      globalWallet={globalWallet}
      selectedPaymentMethod={selectedPaymentMethod}
      setSelectedPaymentMethod={setSelectedPaymentMethod}
      isCreatingOrder={isCreatingOrder}
      onBack={() => setActivePanel(PanelView.MAIN)}
      onSelectPaymentMethod={(method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
        setActivePanel(PanelView.MAIN);
      }}
    />
  );

  // Add tabs to the main component when no order is loaded
  return (
    <StyleRoot>
      <div
        className={cn(
          "mx-auto w-full max-w-[460px]",
          mode === "page" && "bg-as-surface-primary border-as-border-secondary rounded-2xl border p-6 shadow-xl",
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
          className={cn("overflow-hidden", {
            "mt-0": mode === "modal",
          })}
          variants={{
            enter: { x: 300, opacity: 0 },
            center: { x: 0, opacity: 1 },
            exit: { x: -300, opacity: 0 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {[
            <div key="main-view">{mainView}</div>,
            <div key="history-view">{historyView}</div>,
            <div key="order-details-view">{orderDetailsView}</div>,
            <div key="loading-view">{OrderDetailsLoadingView}</div>,
            <div key="fiat-payment-view">{onrampPaymentView}</div>,
            <div key="recipient-selection-view">{recipientSelectionView}</div>,
            <div key="crypto-payment-method-view">{cryptoPaymentMethodView}</div>,
          ]}
        </TransitionPanel>
      </div>
    </StyleRoot>
  );
}
