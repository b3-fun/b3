import {
  AnySpendMetadata,
  CreateOrderParams,
  eqci,
  getDefaultToken,
  GetQuoteRequest,
  GetQuoteResponse,
  isCustomTxMetadata,
  isNftMetadata,
  isTournamentMetadata,
  NftType,
  OnrampVendor,
  OrderStatus,
  OrderType,
  RELAY_ETH_ADDRESS,
  Token,
  USDC_BASE,
  useAnyspendCreateOnrampOrder,
  useAnyspendCreateOrder,
  useAnyspendOrderAndTransactions,
  useAnyspendQuote,
  useAnyspendTokenList,
  useGeoOnrampOptions
} from "@b3dotfun/sdk/anyspend";
import {
  Badge,
  Button,
  ShinyButton,
  Skeleton,
  StyleRoot,
  Tabs,
  TabsContent,
  TabsList,
  TabTrigger,
  TextShimmer,
  TransitionPanel,
  useAccountWallet,
  useB3,
  useBsmntProfile,
  useHasMounted,
  useModalStore,
  useRouter,
  useSearchParamsSSR,
  useTokenBalancesByChain
} from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { simpleHashChainToChainName } from "@b3dotfun/sdk/shared/utils/simplehash";
import { motion } from "framer-motion";
import invariant from "invariant";
import { ChevronRightCircle, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { b3, base, baseSepolia } from "viem/chains";
import { OrderDetails } from "./common/OrderDetails";
import { OrderHistory } from "./common/OrderHistory";
import { OrderStatus as OrderStatusDisplay } from "./common/OrderStatus";
import { OrderToken } from "./common/OrderToken";
import { PanelOnrampPayment } from "./common/PanelOnrampPayment";

enum PanelView {
  CONFIRM_ORDER,
  HISTORY,
  ORDER_DETAILS,
  LOADING
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
  spenderAddress
}: {
  orderType: OrderType;
  srcChainId: number;
  srcToken: Token;
  dstChainId: number;
  dstToken: Token;
  dstAmount: string;
  contractAddress: string;
  tokenId?: number | null;
  contractType?: NftType;
  encodedData: string;
  spenderAddress?: string;
}): GetQuoteRequest {
  switch (orderType) {
    case OrderType.MintNFT: {
      return {
        type: OrderType.MintNFT,
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        price: dstAmount,
        contractAddress: contractAddress,
        tokenId: tokenId!,
        contractType: contractType!
      };
    }
    case OrderType.JoinTournament: {
      return {
        type: OrderType.JoinTournament,
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        price: dstAmount,
        contractAddress: contractAddress
      };
    }
    case OrderType.FundTournament: {
      return {
        type: OrderType.FundTournament,
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        fundAmount: dstAmount,
        contractAddress: contractAddress
      };
    }
    case OrderType.Custom: {
      return {
        type: OrderType.Custom,
        srcChain: srcChainId,
        srcTokenAddress: srcToken.address,
        dstChain: dstChainId,
        dstTokenAddress: dstToken.address,
        payload: {
          amount: dstAmount,
          data: encodedData,
          to: contractAddress,
          spenderAddress: spenderAddress
        }
      };
    }
    default: {
      throw new Error("Unsupported order type");
    }
  }
}

export function AnySpendCustom({
  isMainnet = true,
  loadOrder,
  mode = "modal",
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
  showRecipient = true
}: {
  isMainnet?: boolean;
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress?: string;
  spenderAddress?: string;
  orderType: OrderType;
  dstChainId: number;
  dstToken: Token;
  dstAmount: string;
  contractAddress: string;
  encodedData: string;
  metadata: AnySpendMetadata;
  header: ({
    anyspendPrice,
    isLoadingAnyspendPrice
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  onSuccess?: (txHash?: string) => void;
  showRecipient?: boolean;
}) {
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const hasMounted = useHasMounted();

  const searchParams = useSearchParamsSSR();
  const router = useRouter();

  const [activePanel, setActivePanel] = useState<PanelView>(
    loadOrder ? PanelView.ORDER_DETAILS : PanelView.CONFIRM_ORDER
  );
  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">("crypto");

  // Get current user's wallet
  const currentWallet = useAccountWallet();

  const recipientPropsProfile = useBsmntProfile({ address: recipientAddressProps });

  const recipientAddress = recipientAddressProps || currentWallet.address;
  const recipientEnsName = recipientAddressProps
    ? recipientPropsProfile.data?.username?.replaceAll(".b3.fun", "")
    : currentWallet.ensName;
  const recipientImageUrl = recipientAddressProps
    ? recipientPropsProfile.data?.avatar
    : currentWallet.wallet.meta?.icon;

  const [orderId, setOrderId] = useState<string | undefined>(loadOrder);

  const [srcChainId, setSrcChainId] = useState<number>(isMainnet ? base.id : baseSepolia.id);

  // Get token list for token balance check
  const chainName = useMemo(() => simpleHashChainToChainName(srcChainId), [srcChainId]);
  const { data: tokenList } = useAnyspendTokenList(isMainnet, srcChainId, "");

  // Get token balances for the selected chain
  const { nativeTokens, fungibleTokens } = useTokenBalancesByChain({
    address: currentWallet?.wallet?.address || "",
    chainsIds: [srcChainId],
    enabled: !!currentWallet?.wallet?.address && !!chainName
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
  const [srcToken, setSrcToken] = useState<Token>(getDefaultToken(srcChainId));
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

  const { account: isAuthenticated } = useB3();

  const getRelayQuoteRequest = generateGetRelayQuoteRequest({
    orderType: orderType,
    srcChainId: srcChainId,
    srcToken: srcToken,
    dstChainId: dstChainId,
    dstToken: dstToken,
    dstAmount: dstAmount,
    contractAddress: contractAddress,
    tokenId: isNftMetadata(metadata) ? metadata.nftContract.tokenId : undefined,
    contractType: isNftMetadata(metadata) ? metadata.nftContract.type : undefined,
    encodedData: encodedData,
    spenderAddress: spenderAddress
  });
  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote(isMainnet, getRelayQuoteRequest);

  // Get geo data and onramp options (after quote is available)
  const { geoData, isOnrampSupported } = useGeoOnrampOptions(
    isMainnet,
    anyspendQuote?.data?.currencyIn?.amountUsd || "0"
  );

  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(isMainnet, orderId);

  const onSelectOrder = (selectedOrderId: string) => {
    setActivePanel(PanelView.ORDER_DETAILS);
    setOrderId(selectedOrderId);
    // Update URL with the new orderId
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderId", selectedOrderId);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const [srcAmount, setSrcAmount] = useState<bigint | null>(null);
  const formattedSrcAmount = srcAmount ? formatTokenAmount(srcAmount, srcToken.decimals, 6, false) : null;

  // Update the selected src token to USDC and chain to base when the active tab is fiat,
  // also force not to update srcToken by setting dirtySelectSrcToken to true.
  useEffect(() => {
    if (activeTab === "fiat") {
      setSrcChainId(base.id);
      setSrcToken(USDC_BASE);
      setDirtySelectSrcToken(true);
    }
  }, [activeTab]);

  // Update dependent amount when relay price changes
  useEffect(() => {
    if (
      anyspendQuote?.data &&
      anyspendQuote.data.currencyIn?.amount &&
      anyspendQuote.data.currencyIn?.currency?.decimals
    ) {
      // Use toPrecision instead of toSignificant
      const amount = anyspendQuote.data.currencyIn.amount;
      setSrcAmount(BigInt(amount));
    } else {
      setSrcAmount(null);
    }
  }, [anyspendQuote?.data]);

  useEffect(() => {
    if (oat?.data?.order.status === OrderStatus.Executed) {
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
    }
  });

  const { createOrder: createOnrampOrder, isCreatingOrder: isCreatingOnrampOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      setOrderId(data.data.id);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    }
  });

  const isCreatingOrder = isCreatingRegularOrder || isCreatingOnrampOrder;

  const handleCreateOrder = async (
    recipientAddress: string,
    onramp?: { paymentMethod: string; vendor: OnrampVendor }
  ) => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(srcAmount, "Src amount is null");

      const createOrderParams = {
        isMainnet: isMainnet,
        orderType: orderType,
        srcChain: srcChainId,
        dstChain: dstChainId,
        srcToken: srcToken,
        dstToken: dstToken,
        srcAmount: srcAmount.toString(),
        recipientAddress,
        creatorAddress: currentWallet?.wallet?.address,
        nft: isNftMetadata(metadata)
          ? metadata.nftContract.type === NftType.ERC1155
            ? {
                type: NftType.ERC1155,
                contractAddress: metadata.nftContract.contractAddress,
                tokenId: metadata.nftContract.tokenId!,
                imageUrl: metadata.nftContract.imageUrl,
                nftPrice: dstAmount
              }
            : {
                type: NftType.ERC721,
                contractAddress: metadata.nftContract.contractAddress,
                contractType: metadata.nftContract.type,
                nftPrice: dstAmount
              }
          : undefined,
        tournament: isTournamentMetadata(metadata)
          ? {
              ...metadata.tournament,
              contractAddress: contractAddress,
              entryPriceOrFundAmount: dstAmount
            }
          : undefined,
        payload: {
          amount: dstAmount,
          data: encodedData,
          spenderAddress: spenderAddress,
          to: contractAddress,
          action: isCustomTxMetadata(metadata) ? metadata.action : undefined
        }
      } as CreateOrderParams;

      if (onramp) {
        invariant(srcToken.address === USDC_BASE.address, "Selected src token is not USDC");
        invariant(srcChainId === base.id, "Selected src chain is not base");
        void createOnrampOrder({
          ...createOrderParams,
          srcFiatAmount: anyspendQuote?.data?.currencyIn?.amountUsd || "0",
          onramp: {
            vendor: onramp.vendor,
            paymentMethod: onramp.paymentMethod,
            country: geoData?.country || "US",
            ipAddress: geoData?.ip,
            redirectUrl:
              window.location.origin === "https://basement.fun"
                ? "https://basement.fun/deposit"
                : window.location.origin
          },
          expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0"
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

  const handleConfirmOrder = async (onramp?: { paymentMethod: string; vendor: OnrampVendor }) => {
    if (!isAuthenticated) {
      // Copied from https://github.com/b3-fun/b3-mono/blob/main/apps/anyspend-web/components/User/index.tsx#L85
      setB3ModalContentType({
        chain: {
          ...b3,
          rpc: "https://mainnet-rpc.b3.fun",
          blockExplorers: [{ name: "B3 Explorer", url: "https://explorer.b3.fun/" }],
          testnet: undefined
        },
        partnerId: String(process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID),
        type: "signInWithB3",
        showBackButton: false
      });
      setB3ModalOpen(true);
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

  const recipientSection =
    showRecipient && isAuthenticated && recipientAddress ? (
      <motion.div
        initial={false}
        animate={{
          opacity: hasMounted ? 1 : 0,
          y: hasMounted ? 0 : 20,
          filter: hasMounted ? "blur(0px)" : "blur(10px)"
        }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
        className="flex w-full items-center justify-between gap-4"
      >
        <div className="text-b3-react-foreground">
          {orderType === OrderType.Swap
            ? "Recipient"
            : orderType === OrderType.MintNFT
              ? "Receive NFT at"
              : orderType === OrderType.JoinTournament
                ? "Join for"
                : "Recipient"}
        </div>
        <div>
          <Button variant="outline" className="w-full justify-between border-none p-0">
            <div className="flex items-center gap-2">
              {recipientImageUrl && (
                <img
                  src={recipientImageUrl}
                  alt={recipientImageUrl}
                  className="bg-b3-react-foreground size-7 rounded-full object-cover opacity-100"
                />
              )}
              <div className="flex flex-col items-start gap-1">
                {recipientEnsName && <span>@{recipientEnsName}</span>}
                <span>{centerTruncate(recipientAddress)}</span>
              </div>
            </div>
            <ChevronRightCircle className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </motion.div>
    ) : null;

  const historyView = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-center p-5",
        mode === "modal" && "bg-b3-react-background"
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
        "mx-auto flex w-full flex-col items-center gap-4 p-5",
        mode === "modal" && "bg-b3-react-background"
      )}
    >
      {oat && (
        <>
          <OrderStatusDisplay order={oat.data.order} />
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
              setActivePanel(PanelView.CONFIRM_ORDER);
              // Remove orderId from URL when canceling
              const params = new URLSearchParams(searchParams.toString());
              params.delete("orderId");
              router.push(`${window.location.pathname}?${params.toString()}`);
            }}
          />
        </>
      )}
      {mode === "page" && <div className="h-12" />}
    </div>
  );

  const loadingView = (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-4 p-5",
        mode === "modal" && "bg-b3-react-background"
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

  // Confirm order view.
  const confirmOrderView = (
    <div className={"relative mx-auto flex w-full flex-col items-center"}>
      {header({ anyspendPrice: anyspendQuote, isLoadingAnyspendPrice: isLoadingAnyspendQuote })}

      <div className="divider w-full" />

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as "crypto" | "fiat")}
        className="bg-b3-react-background w-full p-5"
      >
        {/* Only show tabs when geo onramp has been properly initialized */}
        {isOnrampSupported || activeTab === "fiat" ? (
          <TabsList hideGradient className="justify-center">
            <TabTrigger value="crypto">
              <span className="text-as-primary w-[140px]">Pay with crypto</span>
            </TabTrigger>
            <TabTrigger value="fiat">
              <span className="text-as-primary w-[140px]">Pay with fiat</span>
            </TabTrigger>
          </TabsList>
        ) : null}

        {/* Crypto tab */}
        <TabsContent value="crypto">
          <div className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)"
                }}
                transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
                className="relative flex w-full items-center justify-between"
              >
                <div className="font-medium">Pay with</div>
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

              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)"
                }}
                transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
                className="relative flex w-full items-center justify-between"
              >
                <span className="font-medium">Price</span>
                <h2 className={cn("text-as-primary text-2xl font-semibold")}>
                  {formattedSrcAmount || "--"} {srcToken.symbol}
                </h2>
              </motion.div>
            </div>

            {recipientSection}

            {/* Action Buttons */}
            <div className={cn("flex w-full flex-col items-center justify-between gap-2")}>
              <motion.div
                initial={false}
                animate={{
                  opacity: hasMounted ? 1 : 0,
                  y: hasMounted ? 0 : 20,
                  filter: hasMounted ? "blur(0px)" : "blur(10px)"
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
                  {!isAuthenticated ? (
                    "Sign in with B3"
                  ) : isCreatingOrder ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Creating order...</span>
                    </div>
                  ) : isLoadingAnyspendQuote ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading quote...</span>
                    </div>
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
          <div className="mt-6 flex w-full flex-col gap-6">
            <PanelOnrampPayment
              srcAmountOnRamp={anyspendQuote?.data?.currencyIn?.amountUsd || "0"}
              recipientName={recipientEnsName}
              recipientAddress={recipientAddress}
              isMainnet={isMainnet}
              isBuyMode={false}
              selectedDstChainId={dstChainId}
              selectedDstToken={dstToken}
              anyspendQuote={anyspendQuote}
              globalAddress={currentWallet?.wallet?.address}
              onOrderCreated={(orderId: string) => setOrderId(orderId)}
              onBack={() => setActiveTab("crypto")}
              orderType={orderType}
              nft={
                isNftMetadata(metadata)
                  ? metadata.nftContract.type === NftType.ERC1155
                    ? {
                        type: NftType.ERC1155,
                        contractAddress: metadata.nftContract.contractAddress,
                        tokenId: metadata.nftContract.tokenId!,
                        imageUrl: metadata.nftContract.imageUrl,
                        name: metadata.nftContract.name,
                        description: metadata.nftContract.description,
                        price: dstAmount
                      }
                    : {
                        type: NftType.ERC721,
                        contractAddress: metadata.nftContract.contractAddress,
                        name: metadata.nftContract.name,
                        description: metadata.nftContract.description,
                        imageUrl: metadata.nftContract.imageUrl,
                        price: dstAmount
                      }
                  : undefined
              }
              payload={
                isCustomTxMetadata(metadata)
                  ? {
                      ...metadata,
                      amount: dstAmount,
                      data: encodedData,
                      to: contractAddress,
                      spenderAddress: spenderAddress
                    }
                  : undefined
              }
              recipientEnsName={recipientEnsName}
              recipientImageUrl={recipientImageUrl}
            />
          </div>
        </TabsContent>
      </Tabs>
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
        className={cn("w-full")}
        variants={{
          enter: { x: 300, opacity: 0 },
          center: { x: 0, opacity: 1 },
          exit: { x: -300, opacity: 0 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {[
          <div key="edit-recipient-view" className="w-full">
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
          </div>
        ]}
      </TransitionPanel>
    </StyleRoot>
  );
}
