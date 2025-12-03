import { B3_TOKEN, getDefaultToken, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
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

import { parseUnits } from "viem";
import { base, mainnet } from "viem/chains";
import { components } from "../../types/api";
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
  orderType?: "hype_duel" | "custom_exact_in";
}

// This hook serves for order hype_duel and custom_exact_in
export function useAnyspendFlow({
  paymentType = "crypto",
  recipientAddress,
  loadOrder,
  isDepositMode = false,
  onOrderSuccess,
  onTransactionSuccess,
  sourceTokenAddress,
  sourceTokenChainId,
  destinationTokenAddress,
  destinationTokenChainId,
  slippage = 0,
  disableUrlParamManagement = false,
  orderType = "hype_duel",
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
  const { rawBalance, isLoading: isBalanceLoading } = useTokenBalance({
    token: selectedSrcToken,
    address: walletAddress,
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
  const effectiveDecimals = paymentType === "fiat" ? USDC_BASE.decimals : selectedSrcToken.decimals;
  const activeInputAmountInWei = parseUnits(srcAmount.replace(/,/g, ""), effectiveDecimals).toString();
  const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } = useAnyspendQuote({
    srcChain: paymentType === "fiat" ? base.id : selectedSrcChainId,
    dstChain: isDepositMode ? base.id : selectedDstChainId, // For deposits, always Base; for swaps, use selected destination
    srcTokenAddress: paymentType === "fiat" ? USDC_BASE.address : selectedSrcToken.address,
    dstTokenAddress: selectedDstToken.address,
    type: orderType,
    amount: activeInputAmountInWei,
    recipientAddress: effectiveRecipientAddress,
    onrampVendor: paymentType === "fiat" ? getOnrampVendor(selectedFiatPaymentMethod) : undefined,
  });

  // Get geo options for fiat
  const { geoData, coinbaseAvailablePaymentMethods, stripeWeb2Support } = useGeoOnrampOptions(
    paymentType === "fiat" ? formatUnits(activeInputAmountInWei, USDC_BASE.decimals) : "0",
  );

  // Update destination amount when quote changes
  useEffect(() => {
    if (anyspendQuote?.data?.currencyOut?.amount && anyspendQuote.data.currencyOut.currency?.decimals) {
      const amount = anyspendQuote.data.currencyOut.amount;
      const decimals = anyspendQuote.data.currencyOut.currency.decimals;

      // Apply slippage (0-100) - reduce amount by slippage percentageFixed slippage value
      const amountWithSlippage = (BigInt(amount) * BigInt(100 - slippage)) / BigInt(100);

      const formattedAmount = formatTokenAmount(amountWithSlippage, decimals, 6, false);
      setDstAmount(formattedAmount);
    } else {
      setDstAmount("");
    }
  }, [anyspendQuote, slippage]);

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
    isSrcInputDirty,
    setIsSrcInputDirty,
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
    getAnyspendQuoteError,
    activeInputAmountInWei,
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
