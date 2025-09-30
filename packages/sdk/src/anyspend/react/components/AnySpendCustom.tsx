import { eqci, getDefaultToken, roundUpUSDCBaseAmountToNearest } from "@b3dotfun/sdk/anyspend";
import { RELAY_ETH_ADDRESS, USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import {
  CreateOrderParams,
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useAnyspendTokenList,
  useConnectedUserProfile,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteRequest, GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import {
  Badge,
  ShinyButton,
  Skeleton,
  StyleRoot,
  Tabs,
  TabsContent,
  TextShimmer,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TransitionPanel,
  useAccountWallet,
  useHasMounted,
  useProfile,
  useRouter,
  useSearchParamsSSR,
  useTokenBalancesByChain,
} from "@b3dotfun/sdk/global-account/react";
import { cn, formatUsername } from "@b3dotfun/sdk/shared/utils";

import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatTokenAmount, formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { simpleHashChainToChainName } from "@b3dotfun/sdk/shared/utils/simplehash";
import invariant from "invariant";
import { ChevronRight, ChevronRightCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { base } from "viem/chains";
import { useFeatureFlags } from "../contexts/FeatureFlagsContext";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "./AnySpendFingerprintWrapper";
import { CryptoPaymentMethod, CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { FiatPaymentMethod, FiatPaymentMethodComponent } from "./common/FiatPaymentMethod";
import { OrderDetails } from "./common/OrderDetails";
import { OrderHistory } from "./common/OrderHistory";
import { OrderToken } from "./common/OrderToken";
import { PointsBadge } from "./common/PointsBadge";
import { PointsDetailPanel } from "./common/PointsDetailPanel";
import { RecipientSelection } from "./common/RecipientSelection";

enum PanelView {
  CONFIRM_ORDER,
  HISTORY,
  ORDER_DETAILS,
  LOADING,
  RECIPIENT_SELECTION,
  CRYPTO_PAYMENT_METHOD,
  FIAT_PAYMENT_METHOD,
  POINTS_DETAIL,
}

function generateGetRelayQuoteRequest({
  orderType,
  srcChainId,
  srcToken,
  dstChainId,
  dstToken,
  dstAmount,
  contractAddress,
  tokenId,
  contractType,
  encodedData,
  spenderAddress,
}: {
  orderType: components["schemas"]["Order"]["type"];
  srcChainId: number;
  srcToken: components["schemas"]["Token"];
  dstChainId: number;
  dstToken: components["schemas"]["Token"];
  dstAmount: string;
  contractAddress: string;
  tokenId?: number | null;
  contractType?: components["schemas"]["NftContract"]["type"];
  encodedData: string;
  spenderAddress?: string;
}): GetQuoteRequest {
  switch (orderType) {
    case "mint_nft": {
      invariant(contractType, "Contract type is required");
      return {
        type: "mint_nft",
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        price: dstAmount,
        contractAddress: contractAddress,
        tokenId: tokenId,
        contractType: contractType,
      };
    }
    case "join_tournament": {
      return {
        type: "join_tournament",
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        price: dstAmount,
        contractAddress: contractAddress,
      };
    }
    case "fund_tournament": {
      return {
        type: "fund_tournament",
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        fundAmount: dstAmount,
        contractAddress: contractAddress,
      };
    }
    case "custom": {
      return {
        type: "custom",
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        payload: {
          amount: dstAmount,
          data: encodedData,
          to: contractAddress,
          spenderAddress: spenderAddress,
        },
      };
    }
    default: {
      throw new Error("Unsupported order type");
    }
  }
}

export function AnySpendCustom(props: {
  loadOrder?: string;
  mode?: "modal" | "page";
  activeTab?: "crypto" | "fiat";
  recipientAddress?: string;
  spenderAddress?: string;
  orderType: components["schemas"]["Order"]["type"];
  dstChainId: number;
  dstToken: components["schemas"]["Token"];
  dstAmount: string;
  contractAddress: string;
  encodedData: string;
  metadata: any;
  header: ({
    anyspendPrice,
    isLoadingAnyspendPrice,
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  onSuccess?: (txHash?: string) => void;
  showRecipient?: boolean;
  onShowPointsDetail?: () => void;
}) {
  const fingerprintConfig = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <AnySpendCustomInner {...props} />
    </AnySpendFingerprintWrapper>
  );
}

function AnySpendCustomInner({
  loadOrder,
  mode = "modal",
  activeTab: activeTabProps = "crypto",
  recipientAddress: recipientAddressProps,
  spenderAddress,
  orderType,
  dstChainId,
  dstToken,
  dstAmount,
  contractAddress,
  encodedData,
  metadata,
  header,
  onSuccess,
  showRecipient = true,
  onShowPointsDetail,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  activeTab?: "crypto" | "fiat";
  recipientAddress?: string;
  spenderAddress?: string;
  orderType: components["schemas"]["Order"]["type"];
  dstChainId: number;
  dstToken: components["schemas"]["Token"];
  dstAmount: string;
  contractAddress: string;
  encodedData: string;
  metadata: any;
  header: ({
    anyspendPrice,
    isLoadingAnyspendPrice,
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  onSuccess?: (txHash?: string) => void;
  showRecipient?: boolean;
  onShowPointsDetail?: () => void;
}) {
  const hasMounted = useHasMounted();
  const featureFlags = useFeatureFlags();

  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  const [activePanel, setActivePanel] = useState<PanelView>(
    loadOrder ? PanelView.ORDER_DETAILS : PanelView.CONFIRM_ORDER,
  );
  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">(activeTabProps);

  // Add state for selected payment methods
  const [selectedCryptoPaymentMethod, setSelectedCryptoPaymentMethod] = useState<CryptoPaymentMethodType>(
    CryptoPaymentMethodType.NONE,
  );
  const [selectedFiatPaymentMethod, setSelectedFiatPaymentMethod] = useState<FiatPaymentMethod>(FiatPaymentMethod.NONE);

  // Get current user's wallet
  const currentWallet = useAccountWallet();

  // Add state for custom recipient
  const [customRecipientAddress, setCustomRecipientAddress] = useState<string | undefined>(recipientAddressProps);

  // Update recipient logic to use custom recipient
  const recipientAddress = customRecipientAddress || currentWallet.address;

  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);

  const [srcChainId, setSrcChainId] = useState<number>(base.id);

  // Get token list for token balance check
  const chainName = useMemo(() => simpleHashChainToChainName(srcChainId), [srcChainId]);
  const { data: tokenList } = useAnyspendTokenList(srcChainId, "");

  // Get token balances for the selected chain
  const { nativeTokens, fungibleTokens } = useTokenBalancesByChain({
    address: currentWallet?.wallet?.address || "",
    chainsIds: [srcChainId],
    enabled: !!currentWallet?.wallet?.address && !!chainName,
  });

  // Find a token with a balance, prioritizing tokens the user already owns
  const getTokenWithBalance = useCallback(() => {
    if (!currentWallet?.wallet?.address || (!nativeTokens && !fungibleTokens) || !tokenList) {
      return getDefaultToken(srcChainId);
    }

    // First check native tokens (ETH, etc.)
    const nativeToken = nativeTokens?.find(t => t.chainId === srcChainId && Number(t.displayValue) > 0);
    if (nativeToken) {
      const matchingToken = tokenList.find(t => t.address === RELAY_ETH_ADDRESS);
      if (matchingToken) return matchingToken;
    }

    // Then check ERC20 tokens
    if (fungibleTokens?.length) {
      // Find the token with the highest balance
      const tokensWithBalance = fungibleTokens
        .filter(t => t.chain_id === srcChainId && Number(t.balance) > 0)
        .sort((a, b) => Number(b.balance) - Number(a.balance));

      if (tokensWithBalance.length > 0) {
        // Extract the token address from fungible_id (chain.address)
        const topToken = tokensWithBalance[0];
        const tokenAddress = topToken.token_address;

        const matchingToken = tokenList.find(t => t.address.toLowerCase() === tokenAddress);

        if (matchingToken) return matchingToken;
      }
    }

    // Default fallback
    return getDefaultToken(srcChainId);
  }, [currentWallet?.wallet?.address, nativeTokens, fungibleTokens, tokenList, srcChainId]);

  // Set the selected token with preference for tokens user owns
  const [srcToken, setSrcToken] = useState<components["schemas"]["Token"]>(getDefaultToken(srcChainId));
  const [dirtySelectSrcToken, setDirtySelectSrcToken] = useState(false);

  // Update token when chain changes or token balances are loaded
  useEffect(() => {
    if (tokenList?.length && !dirtySelectSrcToken) {
      const tokenWithBalance = getTokenWithBalance();
      if (eqci(tokenWithBalance.address, dstToken.address) === false) {
        setSrcToken(tokenWithBalance);
      }
    }
  }, [srcChainId, tokenList, getTokenWithBalance, nativeTokens, fungibleTokens, dirtySelectSrcToken, dstToken.address]);

  // const { account: isAuthenticated } = useB3();

  const getRelayQuoteRequest = useMemo(() => {
    return generateGetRelayQuoteRequest({
      orderType: orderType,
      srcChainId: activeTab === "fiat" ? base.id : srcChainId,
      srcToken: activeTab === "fiat" ? USDC_BASE : srcToken,
      dstChainId: dstChainId,
      dstToken: dstToken,
      dstAmount: dstAmount,
      contractAddress: contractAddress,
      tokenId: orderType === "mint_nft" ? metadata.nftContract.tokenId : undefined,
      contractType: orderType === "mint_nft" ? metadata.nftContract.type : undefined,
      encodedData: encodedData,
      spenderAddress: spenderAddress,
    });
  }, [
    activeTab,
    contractAddress,
    dstAmount,
    dstChainId,
    dstToken,
    encodedData,
    metadata?.nftContract?.tokenId,
    metadata?.nftContract?.type,
    orderType,
    spenderAddress,
    srcChainId,
    srcToken,
  ]);
  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote(getRelayQuoteRequest);

  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  const onSelectOrder = (selectedOrderId: string) => {
    setActivePanel(PanelView.ORDER_DETAILS);
    setOrderId(selectedOrderId);
    // Update URL with the new orderId
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderId", selectedOrderId);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Update dependent amount when relay price changes
  const srcAmount = useMemo(() => {
    if (
      !anyspendQuote?.data ||
      !anyspendQuote?.data?.currencyIn?.amount ||
      !anyspendQuote?.data?.currencyIn?.currency?.decimals
    )
      return null;

    const amount = anyspendQuote.data.currencyIn.amount;
    if (activeTab === "fiat") {
      const roundUpAmount = roundUpUSDCBaseAmountToNearest(amount);
      return BigInt(roundUpAmount);
    } else {
      return BigInt(amount);
    }
  }, [activeTab, anyspendQuote?.data]);
  const formattedSrcAmount = srcAmount ? formatTokenAmount(srcAmount, srcToken.decimals, 6, false) : null;
  const srcFiatAmount = useMemo(
    () => (activeTab === "fiat" && srcAmount ? formatUnits(srcAmount.toString(), USDC_BASE.decimals) : "0"),
    [activeTab, srcAmount],
  );

  // Get geo data and onramp options (after quote is available)
  const { geoData, isOnrampSupported, coinbaseAvailablePaymentMethods, stripeWeb2Support } =
    useGeoOnrampOptions(srcFiatAmount);

  useEffect(() => {
    if (oat?.data?.order.status === "executed") {
      console.log("Calling onSuccess");
      const txHash = oat?.data?.executeTx?.txHash;
      onSuccess?.(txHash);
    }
  }, [oat?.data?.executeTx?.txHash, oat?.data?.order.status, onSuccess]);

  const { createOrder: createRegularOrder, isCreatingOrder: isCreatingRegularOrder } = useAnyspendCreateOrder({
    onSuccess: data => {
      setOrderId(data.data.id);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  const { createOrder: createOnrampOrder, isCreatingOrder: isCreatingOnrampOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      setOrderId(data.data.id);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  const isCreatingOrder = isCreatingRegularOrder || isCreatingOnrampOrder;

  const { address: connectedAddress, name: connectedName } = useConnectedUserProfile();
  const recipientProfile = useProfile({ address: recipientAddress });
  const recipientName = recipientProfile.data?.name;

  const handleCreateOrder = async (
    recipientAddress: string,
    onramp?: { paymentMethod: string; vendor: components["schemas"]["OnrampMetadata"]["vendor"] },
  ) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(srcAmount, "Src amount is null");

      const createOrderParams = {
        orderType: orderType,
        srcChain: activeTab === "fiat" ? base.id : srcChainId,
        dstChain: dstChainId,
        srcToken: activeTab === "fiat" ? USDC_BASE : srcToken,
        dstToken: dstToken,
        srcAmount: srcAmount.toString(),
        recipientAddress,
        creatorAddress: currentWallet?.wallet?.address,
        nft:
          orderType === "mint_nft"
            ? metadata.nftContract.type === "erc1155"
              ? {
                  type: "erc1155",
                  contractAddress: metadata.nftContract.contractAddress,
                  tokenId: metadata.nftContract.tokenId ?? 0,
                  name: metadata.nftContract.name,
                  description: metadata.nftContract.description,
                  imageUrl: metadata.nftContract.imageUrl,
                  price: dstAmount,
                }
              : {
                  type: "erc721",
                  contractAddress: metadata.nftContract.contractAddress,
                  contractType: metadata.nftContract.type,
                  price: dstAmount,
                  name: metadata.nftContract.name,
                  description: metadata.nftContract.description,
                  imageUrl: metadata.nftContract.imageUrl,
                }
            : undefined,
        tournament:
          orderType === "join_tournament" || orderType === "fund_tournament"
            ? {
                ...metadata.tournament,
                contractAddress: contractAddress,
                entryPriceOrFundAmount: dstAmount,
              }
            : undefined,
        // only populate payload for custom tx
        payload:
          orderType === "custom"
            ? {
                amount: dstAmount,
                data: encodedData,
                spenderAddress: spenderAddress,
                to: contractAddress,
              }
            : undefined,
      } as CreateOrderParams;

      if (onramp) {
        const effectiveSrcToken = activeTab === "fiat" ? USDC_BASE : srcToken;
        invariant(effectiveSrcToken.address === USDC_BASE.address, "Selected src token is not USDC");
        invariant((activeTab === "fiat" ? base.id : srcChainId) === base.id, "Selected src chain is not base");

        // Get the current geo data from the hook
        const currentGeoData = geoData;

        void createOnrampOrder({
          ...createOrderParams,
          srcFiatAmount: srcFiatAmount,
          onramp: {
            vendor: onramp.vendor,
            paymentMethod: onramp.paymentMethod,
            country: currentGeoData?.country || "US",
            redirectUrl:
              window.location.origin === "https://basement.fun"
                ? "https://basement.fun/deposit"
                : window.location.origin,
          },
          expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0",
        });
      } else {
        void createRegularOrder(createOrderParams);
      }
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
      throw err;
    }
  };

  const handleConfirmOrder = async (onramp?: {
    paymentMethod: string;
    vendor: components["schemas"]["OnrampMetadata"]["vendor"];
  }) => {
    // Check if recipient is selected
    if (!recipientAddress) {
      setActivePanel(PanelView.RECIPIENT_SELECTION);
      return;
    }

    // Check payment method selection for crypto tab
    if (activeTab === "crypto" && selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
      setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD);
      return;
    }

    // Check payment method selection for fiat tab
    if (activeTab === "fiat" && selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
      setActivePanel(PanelView.FIAT_PAYMENT_METHOD);
      return;
    }

    if (recipientAddress) {
      try {
        await handleCreateOrder(recipientAddress, onramp);
      } catch (err) {
        console.error("Error creating order:", err);
        toast(`Error creating order: ${err instanceof Error ? err.message : err}`);
      }
    }
  };

  // Handle fiat order creation
  const handleFiatOrder = async (paymentMethod: FiatPaymentMethod) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(recipientAddress, "Recipient address is not found");

      if (!srcFiatAmount || parseFloat(srcFiatAmount) <= 0) {
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
        paymentMethodString = coinbaseAvailablePaymentMethods[0]?.id || "";
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

      await handleCreateOrder(recipientAddress, {
        paymentMethod: paymentMethodString,
        vendor: vendor,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  const recipientSection = showRecipient ? (
    <motion.div
      initial={false}
      key={recipientAddress}
      animate={{
        opacity: hasMounted ? 1 : 0,
        y: hasMounted ? 0 : 20,
        filter: hasMounted ? "blur(0px)" : "blur(10px)",
      }}
      transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
      className="flex w-full items-center justify-between gap-4"
    >
      <div className="text-as-tertiarry text-sm">
        {orderType === "swap"
          ? "Recipient"
          : orderType === "mint_nft"
            ? "Receive NFT at"
            : orderType === "join_tournament"
              ? "Join for"
              : "Recipient"}
      </div>
      <div className="flex items-center gap-2">
        {recipientAddress ? (
          <button
            className={cn("text-as-tertiarry flex h-7 items-center gap-2 rounded-lg")}
            onClick={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
          >
            <>
              <div className="text-as-tertiarry flex items-center gap-1 text-sm">
                <span>{recipientName ? formatUsername(recipientName) : shortenAddress(recipientAddress)}</span>
              </div>
            </>
          </button>
        ) : (
          <button
            className="text-as-primary/70 flex items-center gap-1 rounded-lg"
            onClick={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
          >
            <div className="text-sm font-medium">Select recipient</div>
          </button>
        )}
        <ChevronRight className="h-4 w-4" />
      </div>
    </motion.div>
  ) : null;

  const historyView = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-center p-5",
        mode === "modal" && "bg-b3-react-background",
      )}
    >
      <OrderHistory
        mode={mode}
        onBack={() => {
          setActivePanel(PanelView.HISTORY);
        }}
        onSelectOrder={onSelectOrder}
      />
    </div>
  );

  const orderDetailsView = (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-4",
        mode === "modal" && "bg-b3-react-background rounded-xl",
      )}
    >
      {oat && (
        <OrderDetails
          mode={mode}
          order={oat.data.order}
          depositTxs={oat.data.depositTxs}
          relayTxs={oat.data.relayTxs}
          executeTx={oat.data.executeTx}
          refundTxs={oat.data.refundTxs}
          cryptoPaymentMethod={activeTab === "fiat" ? CryptoPaymentMethodType.NONE : selectedCryptoPaymentMethod}
          selectedCryptoPaymentMethod={selectedCryptoPaymentMethod}
          onPaymentMethodChange={setSelectedCryptoPaymentMethod}
          onBack={() => {
            setOrderId(undefined);
            setActivePanel(PanelView.CONFIRM_ORDER);
            // Remove orderId from URL when canceling
            const params = new URLSearchParams(searchParams.toString());
            params.delete("orderId");
            router.push(`${window.location.pathname}?${params.toString()}`);
          }}
        />
      )}
      {mode === "page" && <div className="h-12" />}
    </div>
  );

  const loadingView = (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-4 p-5",
        mode === "modal" && "bg-b3-react-background",
      )}
    >
      {/* Status Badge */}
      <Badge
        variant="default"
        className="bg-b3-react-muted/30 border-b3-react-border hover:bg-b3-react-muted/50 flex items-center gap-3 px-4 py-1 text-base transition-all"
      >
        <Loader2 className="text-b3-react-foreground size-4 animate-spin" />
        <TextShimmer duration={1} className="font-sf-rounded text-base font-semibold">
          Loading...
        </TextShimmer>
      </Badge>

      {/* Main Content Area */}
      <div className="flex w-full flex-1 flex-col">
        {/* Amount and Chain Info */}
        <div className="mb-4 flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="ml-4 h-8 w-32" />
          </div>
          <Skeleton className="mt-4 h-8 w-24" />
        </div>

        {/* Address Box */}
        <Skeleton className="mb-4 h-12 w-full" />

        {/* QR and Wallet Section */}
        <div className="flex w-full items-center justify-between gap-4">
          {/* QR Code Area */}
          <Skeleton className="rounded-lg bg-white/5 p-6 pb-3">
            <div className="size-[200px]" />
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="size-5 rounded-full" />
            </div>
          </Skeleton>

          {/* Wallet Buttons */}
          <div className="flex flex-1 flex-col gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-b3-react-muted/30 mt-8 w-full rounded-lg p-4">
        <Skeleton className="mb-3 h-4 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>

      {/* Order Info List */}
      <div className="flex w-full flex-col gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex w-full justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      <Skeleton className="h-10 w-full" />

      {mode === "page" && <div className="h-12" />}
    </div>
  );

  // Render points badge if conditions are met
  const renderPointsBadge = () => {
    if (featureFlags.showPoints && anyspendQuote?.data?.pointsAmount && anyspendQuote.data.pointsAmount > 0) {
      return (
        <PointsBadge
          pointsAmount={anyspendQuote.data.pointsAmount}
          pointsMultiplier={anyspendQuote.data.pointsMultiplier}
          onClick={() => {
            onShowPointsDetail?.();
            setActivePanel(PanelView.POINTS_DETAIL);
          }}
        />
      );
    }
    return null;
  };

  // Confirm order view.
  const confirmOrderView = (
    <div className={"relative mx-auto flex w-full flex-col items-center"}>
      {header({ anyspendPrice: anyspendQuote, isLoadingAnyspendPrice: isLoadingAnyspendQuote })}

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as "crypto" | "fiat")}
        className="bg-b3-react-background max-h-[60dvh] w-full overflow-y-auto p-5"
      >
        <div className="w-full">
          <div className="bg-as-surface-secondary relative mb-4 grid h-10 grid-cols-2 rounded-xl">
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
                setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
                setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE);
              }}
            >
              Pay with crypto
            </button>
            {isOnrampSupported ? (
              <button
                className={cn(
                  "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
                  activeTab === "fiat" ? "text-white" : "text-as-primary/70 hover:bg-as-on-surface-2 bg-transparent",
                )}
                onClick={() => {
                  setActiveTab("fiat");
                  setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
                  setSelectedFiatPaymentMethod(FiatPaymentMethod.NONE);
                }}
              >
                Pay with fiat
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "relative z-10 h-full w-full rounded-xl px-3 text-sm font-medium transition-colors duration-100",
                      "text-as-primary/50 cursor-not-allowed bg-transparent",
                    )}
                    disabled
                  >
                    Pay with fiat
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-as-primary w-[140px]">Fiat payments are not supported for this amount</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Warning */}
        {/* {srcChainId === base.id || dstChainId === base.id || activeTab === "fiat" ? (
          <>
            <Warning text="Base is experiencing temporary issues. Please check back later." />

            <div className="h-1" />
          </>
        ) : null} */}

        {/* Crypto tab */}
        <TabsContent value="crypto">
          <div className="mt-2 flex flex-col gap-6">
            <div className="border-as-border-secondary bg-as-surface-secondary flex w-full flex-col gap-4 rounded-xl border p-4">
              {/* Payment Method Selection */}
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
                className="relative flex w-full items-center justify-between"
              >
                <div className="text-as-tertiarry flex h-7 items-center text-sm">Pay</div>
                <button
                  className="text-as-tertiarry flex h-7 items-center gap-2 text-sm transition-colors hover:text-blue-700"
                  onClick={() => setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD)}
                >
                  {selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ? (
                    <>
                      {connectedAddress ? (
                        <>
                          <span className="text-as-tertiarry flex items-center gap-1">
                            {connectedName ? formatUsername(connectedName) : shortenAddress(connectedAddress || "")}
                          </span>
                        </>
                      ) : (
                        "Connect wallet"
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : selectedCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO ? (
                    <>
                      Transfer crypto
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Select payment method
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.div>

              <div className="divider w-full" />

              {recipientSection}

              <div className="divider w-full" />

              <div className="flex flex-col gap-4">
                <motion.div
                  initial={false}
                  animate={{
                    opacity: hasMounted ? 1 : 0,
                    y: hasMounted ? 0 : 20,
                    filter: hasMounted ? "blur(0px)" : "blur(10px)",
                  }}
                  transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
                  className="relative flex w-full items-center justify-between"
                >
                  <div className="text-as-tertiarry text-sm">Pay with</div>
                  <OrderToken
                    address={currentWallet?.wallet?.address}
                    context="from"
                    chainId={srcChainId}
                    setChainId={setSrcChainId}
                    token={srcToken}
                    setToken={token => {
                      setDirtySelectSrcToken(true);
                      setSrcToken(token);
                    }}
                    requiredAmount={srcAmount || undefined}
                  />
                </motion.div>

                <div className="divider w-full" />

                <motion.div
                  initial={false}
                  animate={{
                    opacity: hasMounted ? 1 : 0,
                    y: hasMounted ? 0 : 20,
                    filter: hasMounted ? "blur(0px)" : "blur(10px)",
                  }}
                  transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
                  className="relative flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-as-tertiarry text-sm">
                      Total <span className="text-as-tertiarry">(with fee)</span>
                    </span>
                    {renderPointsBadge()}
                  </div>
                  <span className="text-as-primary font-semibold">
                    {formattedSrcAmount || "--"} {srcToken.symbol}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={cn("flex w-full flex-col items-center justify-between gap-2")}>
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.3, delay: 0.3, ease: "easeInOut" }}
                className="flex w-full flex-col gap-2"
              >
                <ShinyButton
                  accentColor={"hsl(var(--as-brand))"}
                  textColor="text-white"
                  disabled={isCreatingOrder || isLoadingAnyspendQuote || !anyspendQuote}
                  onClick={() => handleConfirmOrder()}
                  className="relative w-full"
                >
                  {isCreatingOrder ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Creating order...</span>
                    </div>
                  ) : isLoadingAnyspendQuote ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading quote...</span>
                    </div>
                  ) : !recipientAddress ? (
                    "Select recipient"
                  ) : selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE ? (
                    "Choose payment method"
                  ) : anyspendQuote ? (
                    <>
                      <span>Checkout</span>
                      <ChevronRightCircle className="absolute right-0 top-1/2 size-6 -translate-y-1/2 opacity-70" />
                    </>
                  ) : (
                    "No quote found"
                  )}
                </ShinyButton>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* Fiat tab */}
        <TabsContent value="fiat">
          <div className="mt-2 flex flex-col gap-6">
            <div className="border-as-border-secondary bg-as-surface-secondary flex w-full flex-col gap-4 rounded-xl border p-4">
              {/* Fiat Payment Method Selection */}
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
                className="relative flex w-full items-center justify-between"
              >
                <div className="text-as-tertiarry flex h-7 items-center text-sm">Pay with</div>
                <button
                  className="text-as-tertiarry flex h-7 items-center gap-1 text-sm transition-colors hover:text-blue-700"
                  onClick={() => setActivePanel(PanelView.FIAT_PAYMENT_METHOD)}
                >
                  {selectedFiatPaymentMethod === FiatPaymentMethod.COINBASE_PAY ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <span className="text-xs font-bold text-white">C</span>
                        </div>
                        Coinbase Pay
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : selectedFiatPaymentMethod === FiatPaymentMethod.STRIPE ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <span className="text-xs font-bold text-white">S</span>
                        </div>
                        Credit/Debit Card
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Select payment method
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.div>

              <div className="divider w-full" />

              {recipientSection}

              <div className="divider w-full" />

              {/* Fiat Amount Display */}
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
                className="relative flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-as-tertiarry text-sm">
                    Total <span className="text-as-tertiarry">(USD)</span>
                  </span>
                  {renderPointsBadge()}
                </div>
                <span className="text-as-primary text-xl font-semibold">${srcFiatAmount || "0.00"}</span>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className={cn("flex w-full flex-col items-center justify-between gap-2")}>
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.3, delay: 0.3, ease: "easeInOut" }}
                className="flex w-full flex-col gap-2"
              >
                <ShinyButton
                  accentColor={"hsl(var(--as-brand))"}
                  textColor="text-white"
                  disabled={isCreatingOrder || isLoadingAnyspendQuote || !anyspendQuote}
                  onClick={() => {
                    if (selectedFiatPaymentMethod !== FiatPaymentMethod.NONE) {
                      handleFiatOrder(selectedFiatPaymentMethod);
                    } else {
                      handleConfirmOrder();
                    }
                  }}
                  className="relative w-full"
                >
                  {isCreatingOrder ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Creating order...</span>
                    </div>
                  ) : isLoadingAnyspendQuote ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading quote...</span>
                    </div>
                  ) : !recipientAddress ? (
                    "Select recipient"
                  ) : selectedFiatPaymentMethod === FiatPaymentMethod.NONE ? (
                    "Select payment method"
                  ) : anyspendQuote ? (
                    <>
                      <span>Buy</span>
                      <ChevronRightCircle className="absolute right-0 top-1/2 size-6 -translate-y-1/2 opacity-70" />
                    </>
                  ) : (
                    "No quote found"
                  )}
                </ShinyButton>
              </motion.div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Recipient selection view
  const recipientSelectionView = (
    <div className={cn("bg-as-surface-primary mx-auto w-[460px] max-w-full rounded-xl p-4")}>
      <RecipientSelection
        initialValue={customRecipientAddress || ""}
        title="Add recipient address or ENS"
        description="Send tokens to another address"
        onBack={() => setActivePanel(PanelView.CONFIRM_ORDER)}
        onConfirm={address => {
          setCustomRecipientAddress(address);
          setActivePanel(PanelView.CONFIRM_ORDER);
        }}
      />
    </div>
  );

  // Crypto payment method view
  const cryptoPaymentMethodView = (
    <div className={cn("bg-as-surface-primary mx-auto w-[460px] max-w-full rounded-xl p-4")}>
      <CryptoPaymentMethod
        globalAddress={currentWallet?.wallet?.address}
        globalWallet={currentWallet?.wallet}
        selectedPaymentMethod={selectedCryptoPaymentMethod}
        setSelectedPaymentMethod={setSelectedCryptoPaymentMethod}
        isCreatingOrder={isCreatingOrder}
        onBack={() => setActivePanel(PanelView.CONFIRM_ORDER)}
        onSelectPaymentMethod={(method: CryptoPaymentMethodType) => {
          setSelectedCryptoPaymentMethod(method);
          setActivePanel(PanelView.CONFIRM_ORDER);
        }}
      />
    </div>
  );

  // Fiat payment method view
  const fiatPaymentMethodView = (
    <div className={cn("bg-as-surface-primary mx-auto w-[460px] max-w-full rounded-xl p-4")}>
      <FiatPaymentMethodComponent
        selectedPaymentMethod={selectedFiatPaymentMethod}
        setSelectedPaymentMethod={setSelectedFiatPaymentMethod}
        onBack={() => setActivePanel(PanelView.CONFIRM_ORDER)}
        onSelectPaymentMethod={(method: FiatPaymentMethod) => {
          setSelectedFiatPaymentMethod(method);
          setActivePanel(PanelView.CONFIRM_ORDER);
        }}
        srcAmountOnRamp={srcFiatAmount}
      />
    </div>
  );

  // Points detail view
  const pointsDetailView = (
    <div className={cn("bg-as-surface-primary mx-auto w-[460px] max-w-full rounded-xl p-4")}>
      <PointsDetailPanel
        pointsAmount={anyspendQuote?.data?.pointsAmount || 0}
        onBack={() => setActivePanel(PanelView.CONFIRM_ORDER)}
      />
    </div>
  );

  // Return the TransitionPanel with all views
  return (
    <StyleRoot>
      <TransitionPanel
        activeIndex={
          orderId
            ? oat
              ? PanelView.ORDER_DETAILS
              : PanelView.LOADING
            : activePanel === PanelView.ORDER_DETAILS
              ? PanelView.CONFIRM_ORDER
              : activePanel
        }
        className={cn("anyspend-container font-inter w-full")}
        variants={{
          enter: { x: 300, opacity: 0 },
          center: { x: 0, opacity: 1 },
          exit: { x: -300, opacity: 0 },
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {[
          <div key="confirm-order-view" className="w-full">
            {confirmOrderView}
          </div>,
          <div key="history-view" className="w-full">
            {historyView}
          </div>,
          <div key="order-details-view" className="w-full">
            {orderDetailsView}
          </div>,
          <div key="loading-view" className="w-full">
            {loadingView}
          </div>,
          <div key="recipient-selection-view" className="w-full">
            {recipientSelectionView}
          </div>,
          <div key="crypto-payment-method-view" className="w-full">
            {cryptoPaymentMethodView}
          </div>,
          <div key="fiat-payment-method-view" className="w-full">
            {fiatPaymentMethodView}
          </div>,
          <div key="points-detail-view" className="w-full">
            {pointsDetailView}
          </div>,
        ]}
      </TransitionPanel>
    </StyleRoot>
  );
}
