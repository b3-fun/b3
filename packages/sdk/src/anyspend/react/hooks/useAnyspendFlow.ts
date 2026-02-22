import { B3_TOKEN, getDefaultToken, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import {
  toast,
  useAccountWallet,
  useProfile,
  useRouter,
  useSearchParamsSSR,
  useTokenBalance,
} from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount, formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { useEffect, useMemo, useState } from "react";

import { encodeFunctionData, parseUnits } from "viem";
import { base, mainnet } from "viem/chains";
import { components } from "../../types/api";
import { GetQuoteRequest } from "../../types/api_req_res";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { FiatPaymentMethod } from "../components/common/FiatPaymentMethod";
import { useAutoSelectCryptoPaymentMethod } from "./useAutoSelectCryptoPaymentMethod";
import { useConnectedWalletDisplay } from "./useConnectedWalletDisplay";
import { useCryptoPaymentMethodState } from "./useCryptoPaymentMethodState";
import { useRecipientAddressState } from "./useRecipientAddressState";

export enum PanelView {
  MAIN,
  CRYPTO_PAYMENT_METHOD,
  FIAT_PAYMENT_METHOD,
  RECIPIENT_SELECTION,
  ORDER_DETAILS,
  LOADING,
  POINTS_DETAIL,
  FEE_DETAIL,
  DIRECT_TRANSFER_SUCCESS,
}

export type CustomExactInConfig = {
  functionAbi: string;
  functionName: string;
  functionArgs: string[];
  to: string;
  spenderAddress?: string;
  action?: string;
};

/**
 * Generates encoded function data for custom contract calls.
 * Handles amount placeholder replacement and BigInt conversion.
 */
export function generateEncodedData(config: CustomExactInConfig | undefined, amountInWei: string): string | undefined {
  if (!config || !config.functionAbi || !config.functionName || !config.functionArgs) {
    console.warn("customExactInConfig missing required fields for encoding:", {
      hasConfig: !!config,
      hasFunctionAbi: !!config?.functionAbi,
      hasFunctionName: !!config?.functionName,
      hasFunctionArgs: !!config?.functionArgs,
    });
    return undefined;
  }

  try {
    const abi = JSON.parse(config.functionAbi);
    const processedArgs = config.functionArgs.map(arg => {
      // Replace amount placeholders ({{dstAmount}}, {{amount_out}}, etc.)
      if (arg === "{{dstAmount}}" || arg === "{{amount_out}}") {
        return BigInt(amountInWei);
      }
      // Convert numeric strings to BigInt for uint256 args
      if (/^\d+$/.test(arg)) {
        return BigInt(arg);
      }
      return arg;
    });

    return encodeFunctionData({
      abi,
      functionName: config.functionName,
      args: processedArgs,
    });
  } catch (e) {
    console.error("Failed to encode function data:", e, {
      functionAbi: config.functionAbi,
      functionName: config.functionName,
      functionArgs: config.functionArgs,
    });
    return undefined;
  }
}

interface UseAnyspendFlowProps {
  paymentType?: "crypto" | "fiat";
  recipientAddress?: string;
  loadOrder?: string;
  isDepositMode?: boolean;
  onOrderSuccess?: (orderId: string) => void;
  onTransactionSuccess?: (amount: string) => void;
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  slippage?: number;
  disableUrlParamManagement?: boolean;
  orderType?: "hype_duel" | "custom_exact_in" | "swap";
  customExactInConfig?: CustomExactInConfig;
  /** Optional sender (payer) address — pre-fills token balances when the user address is known ahead of time */
  senderAddress?: string;
}

// This hook serves for order hype_duel and custom_exact_in
export function useAnyspendFlow({
  paymentType = "crypto",
  recipientAddress,
  loadOrder,
  onOrderSuccess,
  onTransactionSuccess,
  sourceTokenAddress,
  sourceTokenChainId,
  destinationTokenAddress,
  destinationTokenChainId,
  slippage = 0,
  disableUrlParamManagement = false,
  orderType = "hype_duel",
  customExactInConfig,
  senderAddress,
}: UseAnyspendFlowProps) {
  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  // Panel and order state
  const [activePanel, setActivePanel] = useState<PanelView>(loadOrder ? PanelView.ORDER_DETAILS : PanelView.MAIN);
  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);
  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  // Token selection state - use provided sourceTokenChainId and destinationTokenChainId if available
  const [selectedSrcChainId, setSelectedSrcChainId] = useState<number>(
    sourceTokenChainId || (paymentType === "fiat" ? base.id : mainnet.id),
  );
  const defaultSrcToken = paymentType === "fiat" ? USDC_BASE : getDefaultToken(selectedSrcChainId);
  const defaultDstToken = B3_TOKEN; // Default destination token
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(defaultSrcToken);
  const [selectedDstToken, setSelectedDstToken] = useState<components["schemas"]["Token"]>(defaultDstToken);
  const [srcAmount, setSrcAmount] = useState<string>(paymentType === "fiat" ? "5" : "0");
  const [dstAmount, setDstAmount] = useState<string>("");
  const [dstAmountInput, setDstAmountInput] = useState<string>(""); // User input for destination amount (EXACT_OUTPUT mode)
  const [debouncedDstAmountInput, setDebouncedDstAmountInput] = useState<string>(""); // Debounced version for quote requests
  const [isSrcInputDirty, setIsSrcInputDirty] = useState(true);

  // Derive destination chain ID from token or prop (cannot change)
  const selectedDstChainId = destinationTokenChainId || selectedDstToken.chainId;

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

  // Recipient state with dual-state system (auto + explicit user selection)
  const { address: globalAddress } = useAccountWallet();
  const { walletAddress } = useConnectedWalletDisplay(effectiveCryptoPaymentMethod);

  // Recipient address state - hook automatically manages priority: props > user selection > wallet/global
  const { setSelectedRecipientAddress, effectiveRecipientAddress } = useRecipientAddressState({
    recipientAddressFromProps: recipientAddress,
    walletAddress,
    globalAddress,
  });

  const recipientProfile = useProfile({ address: effectiveRecipientAddress, fresh: true });
  const recipientName = recipientProfile.data?.name;

  // Check token balance for crypto payments
  const effectiveBalanceAddress = senderAddress || walletAddress;
  const { rawBalance, isLoading: isBalanceLoading } = useTokenBalance({
    token: selectedSrcToken,
    address: effectiveBalanceAddress,
  });

  // Check if user has enough balance
  const hasEnoughBalance = useMemo(() => {
    if (!rawBalance || isBalanceLoading || paymentType !== "crypto") return false;
    try {
      const requiredAmount = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals);
      return rawBalance >= requiredAmount;
    } catch {
      return false;
    }
  }, [rawBalance, srcAmount, selectedSrcToken.decimals, isBalanceLoading, paymentType]);

  // Auto-select crypto payment method based on available wallets and balance
  useAutoSelectCryptoPaymentMethod({
    paymentType,
    cryptoPaymentMethod,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    hasEnoughBalance,
    isBalanceLoading,
  });

  // Fetch specific token when sourceTokenAddress and sourceTokenChainId are provided
  useEffect(() => {
    const fetchSourceToken = async () => {
      if (sourceTokenAddress && sourceTokenChainId) {
        try {
          const token = await anyspendService.getToken(sourceTokenChainId, sourceTokenAddress);
          setSelectedSrcToken(token);
        } catch (error) {
          console.error("Failed to fetch source token:", error);
          toast.error(`Failed to load token ${sourceTokenAddress} on chain ${sourceTokenChainId}`);
          // Keep the default token on error
        }
      }
    };

    fetchSourceToken();
  }, [sourceTokenAddress, sourceTokenChainId]);

  // Fetch specific token when destinationTokenAddress and destinationTokenChainId are provided
  useEffect(() => {
    const fetchDestinationToken = async () => {
      if (destinationTokenAddress && destinationTokenChainId) {
        try {
          const token = await anyspendService.getToken(destinationTokenChainId, destinationTokenAddress);
          setSelectedDstToken(token);
        } catch (error) {
          console.error("Failed to fetch destination token:", error);
          toast.error(`Failed to load token ${destinationTokenAddress} on chain ${destinationTokenChainId}`);
          // Keep the default token on error
        }
      }
    };

    fetchDestinationToken();
  }, [destinationTokenAddress, destinationTokenChainId]);

  // Check if destination token is ready (matches the expected address from props)
  // This is important for EXACT_OUTPUT mode where we need correct decimals
  const isDestinationTokenReady =
    !destinationTokenAddress || selectedDstToken.address.toLowerCase() === destinationTokenAddress.toLowerCase();

  // Debounce destination amount input for quote requests (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDstAmountInput(dstAmountInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [dstAmountInput]);

  // Helper function for onramp vendor mapping
  const getOnrampVendor = (paymentMethod: FiatPaymentMethod): "coinbase" | "stripe" | "stripe-web2" | undefined => {
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        return "coinbase";
      case FiatPaymentMethod.STRIPE:
        return "stripe-web2";
      default:
        return undefined;
    }
  };

  // Get quote
  // For fiat payments, always use USDC decimals (6) regardless of selectedSrcToken
  const effectiveSrcDecimals = paymentType === "fiat" ? USDC_BASE.decimals : selectedSrcToken.decimals;
  const activeInputAmountInWei = parseUnits(srcAmount.replace(/,/g, ""), effectiveSrcDecimals).toString();

  // Calculate output amount in wei for EXACT_OUTPUT mode
  // Only calculate when destination token is ready (has correct decimals)
  // Use debounced value to reduce quote API calls
  const activeOutputAmountInWei = isDestinationTokenReady
    ? parseUnits(debouncedDstAmountInput.replace(/,/g, "") || "0", selectedDstToken.decimals).toString()
    : "0";

  // Determine trade type based on which input was last edited
  const tradeType = isSrcInputDirty ? "EXACT_INPUT" : "EXACT_OUTPUT";

  // Build quote request based on order type
  const quoteRequest: GetQuoteRequest = (() => {
    const baseParams = {
      srcChain: paymentType === "fiat" ? base.id : selectedSrcChainId,
      dstChain: selectedDstChainId ?? base.id,
      srcTokenAddress: paymentType === "fiat" ? USDC_BASE.address : selectedSrcToken.address,
      dstTokenAddress: selectedDstToken.address,
      recipientAddress: effectiveRecipientAddress,
      onrampVendor: paymentType === "fiat" ? getOnrampVendor(selectedFiatPaymentMethod) : undefined,
    };

    if (orderType === "swap") {
      return {
        ...baseParams,
        type: "swap" as const,
        tradeType: tradeType as "EXACT_INPUT" | "EXACT_OUTPUT",
        amount: tradeType === "EXACT_INPUT" ? activeInputAmountInWei : activeOutputAmountInWei,
      };
    } else if (orderType === "hype_duel") {
      return {
        ...baseParams,
        type: "hype_duel" as const,
        amount: activeInputAmountInWei,
      };
    } else {
      // custom_exact_in - for EXACT_OUTPUT, use custom type to get the quote
      if (tradeType === "EXACT_OUTPUT") {
        const encodedData = generateEncodedData(customExactInConfig, activeOutputAmountInWei);

        return {
          ...baseParams,
          type: "custom" as const,
          payload: {
            amount: activeOutputAmountInWei,
            data: encodedData || "",
            to: customExactInConfig ? normalizeAddress(customExactInConfig.to) : "",
            spenderAddress: customExactInConfig?.spenderAddress
              ? normalizeAddress(customExactInConfig.spenderAddress)
              : undefined,
          },
        };
      }
      return {
        ...baseParams,
        type: "custom_exact_in" as const,
        amount: activeInputAmountInWei,
      };
    }
  })();

  const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } = useAnyspendQuote(quoteRequest);

  // Combined loading state: includes debounce waiting period and actual quote fetching
  // For EXACT_OUTPUT mode, also check if we're waiting for debounce
  const isDebouncingDstAmount = tradeType === "EXACT_OUTPUT" && dstAmountInput !== debouncedDstAmountInput;
  const isQuoteLoading = isLoadingAnyspendQuote || isDebouncingDstAmount;

  // Get geo options for fiat
  const { geoData, coinbaseAvailablePaymentMethods, stripeWeb2Support } = useGeoOnrampOptions(
    paymentType === "fiat" ? formatUnits(activeInputAmountInWei, USDC_BASE.decimals) : "0",
  );

  // Update amounts when quote changes based on trade type
  useEffect(() => {
    if (isSrcInputDirty) {
      // EXACT_INPUT mode: update destination amount from quote
      if (anyspendQuote?.data?.currencyOut?.amount && anyspendQuote.data.currencyOut.currency?.decimals) {
        const amount = anyspendQuote.data.currencyOut.amount;
        const decimals = anyspendQuote.data.currencyOut.currency.decimals;

        // Apply slippage (0-100) - reduce amount by slippage percentage
        const amountWithSlippage = (BigInt(amount) * BigInt(100 - slippage)) / BigInt(100);

        const formattedAmount = formatTokenAmount(amountWithSlippage, decimals, 6, false);
        setDstAmount(formattedAmount);
      } else {
        setDstAmount("");
      }
    } else {
      // EXACT_OUTPUT mode: update source amount from quote
      if (anyspendQuote?.data?.currencyIn?.amount && anyspendQuote.data.currencyIn.currency?.decimals) {
        const amount = anyspendQuote.data.currencyIn.amount;
        const decimals = anyspendQuote.data.currencyIn.currency.decimals;

        const formattedAmount = formatTokenAmount(BigInt(amount), decimals, 6, false);
        setSrcAmount(formattedAmount);
      }
      // Also set the display destination amount from the user input
      setDstAmount(dstAmountInput);
    }
  }, [anyspendQuote, slippage, isSrcInputDirty, dstAmountInput]);

  // Update useEffect for URL parameter to not override loadOrder
  useEffect(() => {
    if (loadOrder || disableUrlParamManagement) return; // Skip if we have a loadOrder or URL param management is disabled

    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setOrderId(orderIdParam);
      setActivePanel(PanelView.ORDER_DETAILS);
    }
  }, [searchParams, loadOrder, disableUrlParamManagement]);

  // Order creation hooks
  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      const newOrderId = data.data.id;
      setOrderId(newOrderId);
      setActivePanel(PanelView.ORDER_DETAILS);
      onOrderSuccess?.(newOrderId);

      // Add orderId and payment method to URL for persistence
      if (!disableUrlParamManagement) {
        const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
        params.set("orderId", newOrderId);
        if (effectiveCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
          console.log("Setting cryptoPaymentMethod in URL:", effectiveCryptoPaymentMethod);
          params.set("cryptoPaymentMethod", effectiveCryptoPaymentMethod);
        } else {
          console.log("Payment method is NONE, not setting in URL");
        }
        console.log("Final URL params:", params.toString());
        router.push(`${window.location.pathname}?${params.toString()}`);
      }
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  const { createOrder: createOnrampOrder, isCreatingOrder: isCreatingOnrampOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      const newOrderId = data.data.id;
      setOrderId(newOrderId);
      setActivePanel(PanelView.ORDER_DETAILS);
      onOrderSuccess?.(newOrderId);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  // Handle order completion
  useEffect(() => {
    if (oat?.data?.order.status === "executed") {
      // get the actualDstAmount if available from settlement
      const amount = oat.data.order.settlement?.actualDstAmount;
      const formattedActualDstAmount = amount
        ? formatTokenAmount(BigInt(amount), oat.data.order.metadata.dstToken.decimals)
        : undefined;
      onTransactionSuccess?.(formattedActualDstAmount ?? "");
    }
  }, [
    oat?.data?.order.status,
    oat?.data?.order.settlement?.actualDstAmount,
    onTransactionSuccess,
    oat?.data?.order.metadata.dstToken.decimals,
  ]);

  return {
    // State
    activePanel,
    setActivePanel,
    orderId,
    setOrderId,
    oat,
    // Token state
    selectedSrcChainId,
    setSelectedSrcChainId,
    selectedDstChainId, // Derived, not stateful
    selectedSrcToken,
    setSelectedSrcToken,
    selectedDstToken,
    setSelectedDstToken,
    srcAmount,
    setSrcAmount,
    dstAmount,
    setDstAmount,
    dstAmountInput,
    setDstAmountInput,
    isSrcInputDirty,
    setIsSrcInputDirty,
    tradeType,
    // Payment methods
    cryptoPaymentMethod,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    effectiveCryptoPaymentMethod,
    resetPaymentMethods,
    selectedFiatPaymentMethod,
    setSelectedFiatPaymentMethod,
    // Recipient
    selectedRecipientAddress: effectiveRecipientAddress,
    setSelectedRecipientAddress,
    recipientName,
    globalAddress,
    // Balance check
    hasEnoughBalance,
    isBalanceLoading,
    // Quote data
    anyspendQuote,
    isLoadingAnyspendQuote,
    isQuoteLoading, // Combined loading state (includes debounce + quote fetching)
    getAnyspendQuoteError,
    activeInputAmountInWei,
    activeOutputAmountInWei, // User's destination amount input in wei (for EXACT_OUTPUT mode)
    // Geo/onramp data
    geoData,
    coinbaseAvailablePaymentMethods,
    stripeWeb2Support,
    getOnrampVendor,
    // Order creation
    createOrder,
    isCreatingOrder,
    createOnrampOrder,
    isCreatingOnrampOrder,
  };
}
