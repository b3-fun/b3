import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { ShinyButton, StyleRoot, TransitionPanel } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import invariant from "invariant";
import { motion } from "motion/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { encodeFunctionData } from "viem";
import { base } from "viem/chains";
import { PanelView, useAnyspendFlow } from "../hooks/useAnyspendFlow";
import { CryptoPaymentMethod, CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { FiatPaymentMethod, FiatPaymentMethodComponent } from "./common/FiatPaymentMethod";
import { OrderDetails } from "./common/OrderDetails";
import { OrderStatus } from "./common/OrderStatus";
import { PaySection } from "./common/PaySection";
import { ReceiveSection } from "./common/ReceiveSection";
import { RecipientSelection } from "./common/RecipientSelection";

import { ESCROW_ABI } from "@b3dotfun/sdk/anyspend/abis/escrow";

const DEPOSIT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BETTING_ESCROW as `0x${string}`;

function generateEncodedDataForDepositHype(amount: string, beneficiary: string): string {
  invariant(BigInt(amount) > 0, "Amount must be greater than zero");
  const encodedData = encodeFunctionData({
    abi: ESCROW_ABI,
    functionName: "depositFor",
    args: [beneficiary as `0x${string}`, B3_TOKEN.address as `0x${string}`, BigInt(amount)],
  });
  return encodedData;
}

export function AnySpendDepositHype({
  loadOrder,
  mode = "modal",
  recipientAddress,
  depositAmount,
  paymentType = "crypto",
  onSuccess,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  depositAmount?: string;
  paymentType?: "crypto" | "fiat";
  onSuccess?: () => void;
}) {
  // Use shared flow hook
  const {
    activePanel,
    setActivePanel,
    orderId,
    oat,
    selectedSrcChainId,
    setSelectedSrcChainId,
    selectedSrcToken,
    setSelectedSrcToken,
    srcAmount,
    setSrcAmount,
    dstAmount,
    setIsSrcInputDirty,
    selectedCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    selectedFiatPaymentMethod,
    setSelectedFiatPaymentMethod,
    selectedRecipientAddress,
    setSelectedRecipientAddress,
    recipientName,
    globalAddress,
    anyspendQuote,
    isLoadingAnyspendQuote,
    getAnyspendQuoteError,
    activeInputAmountInWei,
    geoData,
    coinbaseAvailablePaymentMethods,
    stripeWeb2Support,
    getOnrampVendor,
    createOrder,
    isCreatingOrder,
    createOnrampOrder,
    isCreatingOnrampOrder,
  } = useAnyspendFlow({
    paymentType,
    recipientAddress,
    loadOrder,
    isDepositMode: true,
    onTransactionSuccess: onSuccess,
  });

  const showTokenSelection = !depositAmount;

  // Button state logic
  const btnInfo: { text: string; disable: boolean; error: boolean } = useMemo(() => {
    if (activeInputAmountInWei === "0") return { text: "Enter an amount", disable: true, error: false };
    if (isLoadingAnyspendQuote) return { text: "Loading quote...", disable: true, error: false };
    if (isCreatingOrder || isCreatingOnrampOrder) return { text: "Creating order...", disable: true, error: false };
    if (!selectedRecipientAddress) return { text: "Select recipient", disable: false, error: false };
    if (!anyspendQuote || !anyspendQuote.success) return { text: "Get quote error", disable: true, error: true };
    if (!dstAmount) return { text: "No quote available", disable: true, error: true };

    // Check minimum deposit amount (10 HYPE)
    const dstAmountNum = parseFloat(dstAmount);
    if (dstAmountNum < 10) {
      return { text: "Minimum 10 HYPE deposit", disable: true, error: true };
    }

    if (paymentType === "crypto") {
      if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
        return { text: "Choose payment method", disable: false, error: false };
      }
      return { text: "Continue to deposit", disable: false, error: false };
    }

    if (paymentType === "fiat") {
      if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
        return { text: "Select payment method", disable: false, error: false };
      }
      return { text: "Buy", disable: false, error: false };
    }

    return { text: "Continue to deposit", disable: false, error: false };
  }, [
    activeInputAmountInWei,
    isLoadingAnyspendQuote,
    isCreatingOrder,
    isCreatingOnrampOrder,
    selectedRecipientAddress,
    anyspendQuote,
    dstAmount,
    paymentType,
    selectedCryptoPaymentMethod,
    selectedFiatPaymentMethod,
  ]);

  const onMainButtonClick = async () => {
    if (btnInfo.disable) return;

    if (!selectedRecipientAddress) {
      setActivePanel(PanelView.RECIPIENT_SELECTION);
      return;
    }

    if (paymentType === "crypto") {
      if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
        setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD);
        return;
      }
      await handleCryptoOrder();
    } else if (paymentType === "fiat") {
      if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
        setActivePanel(PanelView.FIAT_PAYMENT_METHOD);
        return;
      }
      await handleFiatOrder();
    }
  };

  // Handle crypto order creation
  const handleCryptoOrder = async () => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(selectedRecipientAddress, "Recipient address is not found");

      const srcAmountBigInt = BigInt(activeInputAmountInWei);
      const depositAmountWei = anyspendQuote.data?.currencyOut?.amount || "0";
      const encodedData = generateEncodedDataForDepositHype(depositAmountWei, selectedRecipientAddress);

      createOrder({
        recipientAddress: selectedRecipientAddress,
        orderType: "custom",
        srcChain: selectedSrcChainId,
        dstChain: base.id,
        srcToken: selectedSrcToken,
        dstToken: B3_TOKEN,
        srcAmount: srcAmountBigInt.toString(),
        creatorAddress: globalAddress,
        payload: {
          amount: depositAmountWei,
          data: encodedData,
          to: DEPOSIT_CONTRACT_ADDRESS,
          action: "deposit HYPE",
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  // Handle fiat order creation
  const handleFiatOrder = async () => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(selectedRecipientAddress, "Recipient address is not found");

      if (!srcAmount || parseFloat(srcAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Determine vendor and payment method string
      let vendor: "coinbase" | "stripe" | "stripe-web2";
      let paymentMethodString = "";

      if (selectedFiatPaymentMethod === FiatPaymentMethod.COINBASE_PAY) {
        if (coinbaseAvailablePaymentMethods.length === 0) {
          toast.error("Coinbase Pay not available");
          return;
        }
        vendor = "coinbase";
        paymentMethodString = coinbaseAvailablePaymentMethods[0]?.id || "";
      } else if (selectedFiatPaymentMethod === FiatPaymentMethod.STRIPE) {
        if (!stripeWeb2Support || !stripeWeb2Support.isSupport) {
          toast.error("Stripe not available");
          return;
        }
        vendor = "stripe-web2";
        paymentMethodString = "";
      } else {
        toast.error("Please select a payment method");
        return;
      }

      const depositAmountWei = anyspendQuote.data?.currencyOut?.amount || "0";
      const encodedData = generateEncodedDataForDepositHype(depositAmountWei, selectedRecipientAddress);

      createOnrampOrder({
        recipientAddress: selectedRecipientAddress,
        orderType: "custom",
        dstChain: base.id,
        dstToken: B3_TOKEN,
        srcFiatAmount: srcAmount,
        onramp: {
          vendor: vendor,
          paymentMethod: paymentMethodString,
          country: geoData?.country || "US",
          redirectUrl:
            window.location.origin === "https://basement.fun" ? "https://basement.fun/deposit" : window.location.origin,
        },
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0",
        creatorAddress: globalAddress,
        payload: {
          amount: depositAmountWei,
          data: encodedData,
          to: DEPOSIT_CONTRACT_ADDRESS,
          action: "deposit HYPE",
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  // Order details view
  const orderDetailsView = (
    <div className={"mx-auto w-[460px] max-w-full"}>
      <div className="relative flex flex-col gap-4">
        {oat && (
          <>
            <OrderStatus order={oat.data.order} />
            <OrderDetails
              mode={mode}
              order={oat.data.order}
              depositTxs={oat.data.depositTxs}
              relayTx={oat.data.relayTx}
              executeTx={oat.data.executeTx}
              refundTxs={oat.data.refundTxs}
              cryptoPaymentMethod={paymentType === "fiat" ? CryptoPaymentMethodType.NONE : selectedCryptoPaymentMethod}
              onBack={() => {
                setActivePanel(PanelView.MAIN);
                onSuccess?.();
              }}
            />
          </>
        )}
      </div>
    </div>
  );

  // Loading view
  const loadingView = (
    <div className="mx-auto flex w-full flex-col items-center gap-4 p-5">
      <div className="text-as-primary">Loading order details...</div>
    </div>
  );

  // Panel views
  const recipientSelectionView = (
    <RecipientSelection
      initialValue={selectedRecipientAddress || ""}
      onBack={() => setActivePanel(PanelView.MAIN)}
      onConfirm={address => {
        setSelectedRecipientAddress(address);
        setActivePanel(PanelView.MAIN);
      }}
    />
  );

  const cryptoPaymentMethodView = (
    <CryptoPaymentMethod
      globalAddress={globalAddress}
      globalWallet={undefined}
      selectedPaymentMethod={selectedCryptoPaymentMethod}
      setSelectedPaymentMethod={setSelectedCryptoPaymentMethod}
      isCreatingOrder={isCreatingOrder}
      onBack={() => setActivePanel(PanelView.MAIN)}
      onSelectPaymentMethod={(method: CryptoPaymentMethodType) => {
        setSelectedCryptoPaymentMethod(method);
        setActivePanel(PanelView.MAIN);
      }}
    />
  );

  const fiatPaymentMethodView = (
    <FiatPaymentMethodComponent
      selectedPaymentMethod={selectedFiatPaymentMethod}
      setSelectedPaymentMethod={setSelectedFiatPaymentMethod}
      onBack={() => setActivePanel(PanelView.MAIN)}
      onSelectPaymentMethod={(method: FiatPaymentMethod) => {
        setSelectedFiatPaymentMethod(method);
        setActivePanel(PanelView.MAIN);
      }}
      srcAmountOnRamp={srcAmount}
    />
  );

  // If showing token selection, render with panel transitions
  if (showTokenSelection) {
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
            variants={{
              enter: { x: 300, opacity: 0 },
              center: { x: 0, opacity: 1 },
              exit: { x: -300, opacity: 0 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {[
              <div key="main-view" className={cn(mode === "page" && "p-6")}>
                <div className="mx-auto flex w-[460px] max-w-full flex-col items-center gap-2">
                  {/* Header */}
                  <div className="mb-4 flex flex-col items-center gap-3 text-center">
                    <div>
                      <h1 className="text-as-primary text-xl font-bold">
                        {paymentType === "crypto" ? "Deposit Crypto" : "Fund with Fiat"}
                      </h1>
                    </div>
                  </div>

                  <div className="relative flex w-full max-w-[calc(100vw-32px)] flex-col gap-2">
                    <PaySection
                      paymentType={paymentType}
                      selectedSrcChainId={selectedSrcChainId}
                      setSelectedSrcChainId={setSelectedSrcChainId}
                      selectedSrcToken={selectedSrcToken}
                      setSelectedSrcToken={setSelectedSrcToken}
                      srcAmount={srcAmount}
                      setSrcAmount={setSrcAmount}
                      setIsSrcInputDirty={setIsSrcInputDirty}
                      selectedCryptoPaymentMethod={selectedCryptoPaymentMethod}
                      selectedFiatPaymentMethod={selectedFiatPaymentMethod}
                      onSelectCryptoPaymentMethod={() => setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD)}
                      onSelectFiatPaymentMethod={() => setActivePanel(PanelView.FIAT_PAYMENT_METHOD)}
                      anyspendQuote={anyspendQuote}
                    />

                    <ReceiveSection
                      paymentType={paymentType}
                      isDepositMode={true}
                      selectedRecipientAddress={selectedRecipientAddress}
                      recipientName={recipientName || undefined}
                      onSelectRecipient={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
                      dstAmount={dstAmount}
                      dstToken={B3_TOKEN}
                      anyspendQuote={anyspendQuote}
                    />
                  </div>

                  {/* Error message section */}
                  {getAnyspendQuoteError && (
                    <div className="bg-as-on-surface-1 flex w-full max-w-[460px] items-center gap-2 rounded-2xl px-4 py-2">
                      <div className="bg-as-red h-4 min-h-4 w-4 min-w-4 rounded-full p-0 text-sm font-medium text-white" />
                      <div className="text-as-red text-sm">{getAnyspendQuoteError.message}</div>
                    </div>
                  )}

                  {/* Main button section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
                    className={cn("mt-4 flex w-full max-w-[460px] flex-col gap-2", getAnyspendQuoteError && "mt-0")}
                  >
                    <ShinyButton
                      accentColor={"hsl(var(--as-brand))"}
                      disabled={btnInfo.disable}
                      onClick={onMainButtonClick}
                      className={cn(
                        "as-main-button relative w-full",
                        btnInfo.error ? "!bg-as-red" : btnInfo.disable ? "!bg-as-on-surface-2" : "!bg-as-brand",
                      )}
                      textClassName={cn(
                        btnInfo.error ? "text-white" : btnInfo.disable ? "text-as-secondary" : "text-white",
                      )}
                    >
                      {btnInfo.text}
                    </ShinyButton>
                  </motion.div>
                </div>
              </div>,
              <div key="crypto-payment-method-view" className={cn(mode === "page" && "p-6")}>
                {cryptoPaymentMethodView}
              </div>,
              <div key="fiat-payment-method-view" className={cn(mode === "page" && "p-6")}>
                {fiatPaymentMethodView}
              </div>,
              <div key="recipient-selection-view" className={cn(mode === "page" && "p-6")}>
                {recipientSelectionView}
              </div>,
              <div key="order-details-view" className={cn(mode === "page" && "p-6")}>
                {orderDetailsView}
              </div>,
              <div key="loading-view" className={cn(mode === "page" && "p-6")}>
                {loadingView}
              </div>,
            ]}
          </TransitionPanel>
        </div>
      </StyleRoot>
    );
  }

  // If not showing token selection, return null (orders are created directly)
  return null;
}
