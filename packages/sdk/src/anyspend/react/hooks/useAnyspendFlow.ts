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
  useAccountWallet,
  useProfile,
  useRouter,
  useSearchParamsSSR,
  useTokenBalance,
} from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount, formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { base, mainnet } from "viem/chains";
import { useAccount } from "wagmi";
import { components } from "../../types/api";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { FiatPaymentMethod } from "../components/common/FiatPaymentMethod";

export enum PanelView {
  MAIN,
  CRYPTO_PAYMENT_METHOD,
  FIAT_PAYMENT_METHOD,
  RECIPIENT_SELECTION,
  ORDER_DETAILS,
  LOADING,
}

interface UseAnyspendFlowProps {
  paymentType?: "crypto" | "fiat";
  recipientAddress?: string;
  loadOrder?: string;
  isDepositMode?: boolean;
  onOrderSuccess?: (orderId: string) => void;
  onTransactionSuccess?: (amount?: string) => void;
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  slippage?: number;
  disableUrlParamManagement?: boolean;
}

export function useAnyspendFlow({
  paymentType = "crypto",
  recipientAddress,
  loadOrder,
  isDepositMode = false,
  onOrderSuccess,
  onTransactionSuccess,
  sourceTokenAddress,
  sourceTokenChainId,
  slippage = 0,
  disableUrlParamManagement = false,
}: UseAnyspendFlowProps) {
  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  // Panel and order state
  const [activePanel, setActivePanel] = useState<PanelView>(loadOrder ? PanelView.ORDER_DETAILS : PanelView.MAIN);
  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);
  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  // Token selection state - use provided sourceTokenChainId if available
  const [selectedSrcChainId, setSelectedSrcChainId] = useState<number>(
    sourceTokenChainId || (paymentType === "fiat" ? base.id : mainnet.id),
  );
  const [selectedDstChainId, setSelectedDstChainId] = useState<number>(base.id); // Default to Base for cross-chain swaps
  const defaultSrcToken = paymentType === "fiat" ? USDC_BASE : getDefaultToken(selectedSrcChainId);
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(defaultSrcToken);
  const [srcAmount, setSrcAmount] = useState<string>(paymentType === "fiat" ? "5" : "0.1");
  const [dstAmount, setDstAmount] = useState<string>("");
  const [isSrcInputDirty, setIsSrcInputDirty] = useState(true);

  // Payment method state
  const [selectedCryptoPaymentMethod, setSelectedCryptoPaymentMethod] = useState<CryptoPaymentMethodType>(
    CryptoPaymentMethodType.NONE,
  );
  const [selectedFiatPaymentMethod, setSelectedFiatPaymentMethod] = useState<FiatPaymentMethod>(FiatPaymentMethod.NONE);

  // Recipient state
  const { address: globalAddress } = useAccountWallet();
  const { address: wagmiAddress } = useAccount();
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState<string | undefined>(recipientAddress);
  const recipientProfile = useProfile({ address: selectedRecipientAddress, fresh: true });
  const recipientName = recipientProfile.data?.name;

  // Set default recipient address when wallet changes
  useEffect(() => {
    if (!selectedRecipientAddress && globalAddress) {
      setSelectedRecipientAddress(globalAddress);
    }
  }, [selectedRecipientAddress, globalAddress]);

  // Check token balance for crypto payments
  const { rawBalance, isLoading: isBalanceLoading } = useTokenBalance({
    token: selectedSrcToken,
    address: wagmiAddress,
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

  // Auto-set crypto payment method based on balance
  useEffect(() => {
    if (paymentType === "crypto" && !isBalanceLoading) {
      if (hasEnoughBalance) {
        setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
      } else {
        setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
      }
    }
  }, [paymentType, hasEnoughBalance, isBalanceLoading]);

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
  const activeInputAmountInWei = parseUnits(srcAmount.replace(/,/g, ""), selectedSrcToken.decimals).toString();
  const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } = useAnyspendQuote({
    srcChain: paymentType === "fiat" ? base.id : selectedSrcChainId,
    dstChain: isDepositMode ? base.id : selectedDstChainId, // For deposits, always Base; for swaps, use selected destination
    srcTokenAddress: paymentType === "fiat" ? USDC_BASE.address : selectedSrcToken.address,
    dstTokenAddress: isDepositMode ? B3_TOKEN.address : selectedSrcToken.address, // For deposits, always B3
    type: "swap",
    tradeType: "EXACT_INPUT",
    amount: activeInputAmountInWei,
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
        if (selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
          console.log("Setting cryptoPaymentMethod in URL:", selectedCryptoPaymentMethod);
          params.set("cryptoPaymentMethod", selectedCryptoPaymentMethod);
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
      console.log("Order executed successfully");
      // just get the payload.amount if available from custompayload
      const amount = (oat.data.order.payload as { amount?: string })?.amount;
      onTransactionSuccess?.(amount);
    }
  }, [oat?.data?.order.status, oat?.data?.order.payload, onTransactionSuccess]);

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
    selectedDstChainId,
    setSelectedDstChainId,
    selectedSrcToken,
    setSelectedSrcToken,
    srcAmount,
    setSrcAmount,
    dstAmount,
    setDstAmount,
    isSrcInputDirty,
    setIsSrcInputDirty,
    // Payment methods
    selectedCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    selectedFiatPaymentMethod,
    setSelectedFiatPaymentMethod,
    // Recipient
    selectedRecipientAddress,
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
