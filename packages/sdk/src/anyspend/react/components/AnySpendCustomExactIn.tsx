import { useGasPrice } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import {
  Button,
  ShinyButton,
  StyleRoot,
  toast,
  TransitionPanel,
  useAccountWallet,
} from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { ArrowDown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type { AnySpendCustomExactInClasses } from "./types/classes";

import { useSetActiveWallet } from "thirdweb/react";
import { B3_TOKEN } from "../../constants";
import { generateEncodedData, PanelView, useAnyspendFlow } from "../hooks/useAnyspendFlow";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "./AnySpendFingerprintWrapper";
import { CryptoPaySection } from "./common/CryptoPaySection";
import { CryptoPaymentMethod, CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { CryptoReceiveSection } from "./common/CryptoReceiveSection";
import { FeeDetailPanel } from "./common/FeeDetailPanel";
import { FiatPaymentMethod, FiatPaymentMethodComponent } from "./common/FiatPaymentMethod";
import { GasIndicator } from "./common/GasIndicator";
import { OrderDetails } from "./common/OrderDetails";
import { PanelOnramp } from "./common/PanelOnramp";
import { PointsDetailPanel } from "./common/PointsDetailPanel";
import { RecipientSelection } from "./common/RecipientSelection";

const SLIPPAGE_PERCENT = 3;

type CustomExactInConfig = {
  functionAbi: string;
  functionName: string;
  functionArgs: string[];
  to: string;
  spenderAddress?: string;
  action?: string;
};

export interface AnySpendCustomExactInProps {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  paymentType?: "crypto" | "fiat";
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  destinationToken: components["schemas"]["Token"];
  destinationChainId: number;
  destinationTokenAmount?: string;
  onSuccess?: (amount: string) => void;
  onOpenCustomModal?: () => void;
  mainFooter?: React.ReactNode;
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  customUsdInputValues?: string[];
  preferEoa?: boolean;
  customExactInConfig?: CustomExactInConfig;
  orderType?: "hype_duel" | "custom_exact_in" | "swap";
  minDestinationAmount?: number;
  header?: ({
    anyspendPrice,
    isLoadingAnyspendPrice,
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  /** Custom URL to redirect to when clicking "Return to Home" on complete order screen */
  returnToHomeUrl?: string;
  /** Custom label for recipient display (e.g., "OBSN Telegram Bot") */
  customRecipientLabel?: string;
  /** Custom label for the return home button (overrides "Return to Home" / "Close") */
  returnHomeLabel?: string;
  /** Custom class names for styling specific elements */
  classes?: AnySpendCustomExactInClasses;
}

export function AnySpendCustomExactIn(props: AnySpendCustomExactInProps) {
  const fingerprintConfig = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <AnySpendCustomExactInInner {...props} />
    </AnySpendFingerprintWrapper>
  );
}

function AnySpendCustomExactInInner({
  loadOrder,
  mode = "modal",
  recipientAddress,
  paymentType = "crypto",
  sourceTokenAddress,
  sourceTokenChainId,
  destinationToken,
  destinationChainId,
  onSuccess,
  onOpenCustomModal,
  mainFooter,
  onTokenSelect,
  customUsdInputValues,
  preferEoa,
  customExactInConfig,
  destinationTokenAmount,
  orderType = "custom_exact_in",
  minDestinationAmount,
  header,
  returnToHomeUrl,
  customRecipientLabel,
  returnHomeLabel,
  classes,
}: AnySpendCustomExactInProps) {
  const actionLabel = customExactInConfig?.action ?? "Custom Execution";

  const DESTINATION_TOKEN_DETAILS = {
    SYMBOL: destinationToken.symbol ?? "TOKEN",
    LOGO_URI: destinationToken.metadata?.logoURI ?? "",
  };

  const {
    activePanel,
    setActivePanel,
    orderId,
    setOrderId,
    oat,
    selectedSrcChainId,
    setSelectedSrcChainId,
    selectedSrcToken,
    setSelectedSrcToken,
    selectedDstToken,
    selectedDstChainId,
    srcAmount,
    setSrcAmount,
    dstAmount,
    dstAmountInput,
    setDstAmountInput,
    isSrcInputDirty,
    setIsSrcInputDirty,
    tradeType,
    selectedCryptoPaymentMethod,
    effectiveCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    selectedFiatPaymentMethod,
    setSelectedFiatPaymentMethod,
    selectedRecipientAddress,
    setSelectedRecipientAddress,
    recipientName,
    globalAddress,
    hasEnoughBalance,
    isBalanceLoading,
    anyspendQuote,
    isLoadingAnyspendQuote,
    isQuoteLoading,
    activeInputAmountInWei,
    activeOutputAmountInWei,
    geoData,
    coinbaseAvailablePaymentMethods,
    stripeWeb2Support,
    createOrder,
    isCreatingOrder,
    createOnrampOrder,
    isCreatingOnrampOrder,
  } = useAnyspendFlow({
    paymentType,
    recipientAddress,
    loadOrder,
    onTransactionSuccess: onSuccess,
    sourceTokenAddress,
    sourceTokenChainId,
    destinationTokenAddress: destinationToken.address,
    destinationTokenChainId: destinationChainId,
    slippage: SLIPPAGE_PERCENT,
    disableUrlParamManagement: true,
    orderType,
    customExactInConfig,
  });

  const { connectedEOAWallet } = useAccountWallet();
  const setActiveWallet = useSetActiveWallet();

  // Get gas price for source chain (where the user pays from)
  const { gasPrice: gasPriceData, isLoading: isLoadingGas } = useGasPrice(selectedSrcChainId);
  const appliedPreferEoa = useRef(false);

  useEffect(() => {
    if (preferEoa && !appliedPreferEoa.current) {
      if (connectedEOAWallet) {
        appliedPreferEoa.current = true;
        setActiveWallet(connectedEOAWallet);
      }
    }
  }, [preferEoa, connectedEOAWallet, setActiveWallet]);

  // Prefill destination amount if provided (for EXACT_OUTPUT mode)
  const appliedDestinationAmount = useRef(false);
  useEffect(() => {
    if (destinationTokenAmount && !appliedDestinationAmount.current) {
      appliedDestinationAmount.current = true;
      // Convert wei to human-readable format
      const formattedAmount = formatUnits(destinationTokenAmount, destinationToken.decimals);
      setDstAmountInput(formattedAmount);
      setIsSrcInputDirty(false); // Switch to EXACT_OUTPUT mode
    }
  }, [destinationTokenAmount, destinationToken.decimals, setDstAmountInput, setIsSrcInputDirty]);

  const selectedRecipientOrDefault = selectedRecipientAddress ?? recipientAddress;

  const expectedDstAmountRaw = anyspendQuote?.data?.currencyOut?.amount ?? "0";

  const buildCustomPayload = (_recipient: string | undefined) => {
    if (!customExactInConfig) {
      // For hype_duel or other simple order types
      return {
        expectedDstAmount: expectedDstAmountRaw,
      };
    }

    // For custom_exact_in with custom config
    return {
      amount: expectedDstAmountRaw,
      expectedDstAmount: expectedDstAmountRaw,
      functionAbi: customExactInConfig.functionAbi,
      functionName: customExactInConfig.functionName,
      functionArgs: customExactInConfig.functionArgs,
      to: normalizeAddress(customExactInConfig.to),
      spenderAddress: customExactInConfig.spenderAddress
        ? normalizeAddress(customExactInConfig.spenderAddress)
        : undefined,
      action: customExactInConfig.action,
    };
  };

  const btnInfo: { text: string; disable: boolean; error: boolean; loading: boolean } = useMemo(() => {
    // Check for empty amount based on trade type
    const isAmountEmpty =
      tradeType === "EXACT_OUTPUT" ? !dstAmountInput || dstAmountInput === "0" : activeInputAmountInWei === "0";

    if (isAmountEmpty) return { text: "Enter an amount", disable: true, error: false, loading: false };
    if (orderType === "hype_duel" && selectedSrcToken?.address?.toLowerCase() === B3_TOKEN.address.toLowerCase()) {
      return { text: "Convert to HYPE using B3", disable: false, error: false, loading: false };
    }
    if (isQuoteLoading) return { text: "Loading quote...", disable: true, error: false, loading: true };
    if (isCreatingOrder || isCreatingOnrampOrder)
      return { text: "Creating order...", disable: true, error: false, loading: true };
    if (!selectedRecipientOrDefault) return { text: "Select recipient", disable: false, error: false, loading: false };
    if (!anyspendQuote || !anyspendQuote.success)
      return { text: "Get quote error", disable: true, error: true, loading: false };

    // Check minimum destination amount if specified
    // Check minimum destination amount if specified
    if (
      minDestinationAmount &&
      anyspendQuote.data?.currencyOut?.amount &&
      anyspendQuote.data.currencyOut.currency &&
      anyspendQuote.data.currencyOut.currency.decimals != null
    ) {
      const rawAmountInWei = BigInt(anyspendQuote.data.currencyOut.amount);
      const decimals = anyspendQuote.data.currencyOut.currency.decimals;
      const actualAmount = parseFloat(formatUnits(rawAmountInWei.toString(), decimals));

      if (actualAmount < minDestinationAmount) {
        return {
          text: `Minimum ${minDestinationAmount} ${DESTINATION_TOKEN_DETAILS.SYMBOL} deposit`,
          disable: true,
          error: true,
          loading: false,
        };
      }
    }

    if (paymentType === "crypto") {
      if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
        return { text: "Choose payment method", disable: false, error: false, loading: false };
      }
      if (
        !hasEnoughBalance &&
        !isBalanceLoading &&
        effectiveCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET
      ) {
        return { text: "Insufficient balance", disable: true, error: true, loading: false };
      }
      // Use different text based on order type
      const buttonText = orderType === "hype_duel" ? "Continue to deposit" : `Execute ${actionLabel}`;
      return { text: buttonText, disable: false, error: false, loading: false };
    }

    if (paymentType === "fiat") {
      if (selectedFiatPaymentMethod === FiatPaymentMethod.NONE) {
        return { text: "Select payment method", disable: false, error: false, loading: false };
      }
      return { text: "Buy", disable: false, error: false, loading: false };
    }

    return { text: "Continue", disable: false, error: false, loading: false };
  }, [
    activeInputAmountInWei,
    isQuoteLoading,
    isCreatingOrder,
    isCreatingOnrampOrder,
    selectedRecipientOrDefault,
    anyspendQuote,
    paymentType,
    effectiveCryptoPaymentMethod,
    selectedFiatPaymentMethod,
    hasEnoughBalance,
    isBalanceLoading,
    actionLabel,
    minDestinationAmount,
    DESTINATION_TOKEN_DETAILS.SYMBOL,
    orderType,
    selectedSrcToken,
    tradeType,
    dstAmountInput,
  ]);

  const onMainButtonClick = async () => {
    if (orderType === "hype_duel" && selectedSrcToken?.address?.toLowerCase() === B3_TOKEN.address.toLowerCase()) {
      onOpenCustomModal?.();
      return;
    }
    if (btnInfo.disable) return;

    if (!selectedRecipientOrDefault) {
      setActivePanel(PanelView.RECIPIENT_SELECTION);
      return;
    }

    if (paymentType === "crypto") {
      if (effectiveCryptoPaymentMethod === CryptoPaymentMethodType.NONE) {
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

  const headerContent = header ? (
    header({ anyspendPrice: anyspendQuote, isLoadingAnyspendPrice: isLoadingAnyspendQuote })
  ) : (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">{actionLabel}</h1>
        <p className="text-as-secondary text-sm">Pay from any token to execute a custom exact-in transaction.</p>
      </div>
    </div>
  );

  const mainView = (
    <div
      className={
        classes?.container ||
        "anyspend-custom-exact-in-container mx-auto flex w-[460px] max-w-full flex-col items-center gap-2"
      }
    >
      {headerContent}

      <div className="relative flex w-full max-w-[calc(100vw-32px)] flex-col gap-2">
        <div className="relative flex w-full max-w-[calc(100vw-32px)] flex-col gap-2">
          {paymentType === "crypto" ? (
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
              onSelectCryptoPaymentMethod={() => setActivePanel(PanelView.CRYPTO_PAYMENT_METHOD)}
              anyspendQuote={anyspendQuote}
              onTokenSelect={onTokenSelect}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
            >
              <PanelOnramp
                srcAmountOnRamp={srcAmount}
                setSrcAmountOnRamp={setSrcAmount}
                selectedPaymentMethod={selectedFiatPaymentMethod}
                setActivePanel={setActivePanel}
                _recipientAddress={selectedRecipientOrDefault}
                destinationToken={selectedDstToken}
                destinationChainId={selectedDstChainId}
                dstTokenSymbol={DESTINATION_TOKEN_DETAILS.SYMBOL}
                hideDstToken
                destinationAmount={dstAmount}
                onDestinationTokenChange={() => {}}
                onDestinationChainChange={() => {}}
                fiatPaymentMethodIndex={PanelView.FIAT_PAYMENT_METHOD}
                recipientSelectionPanelIndex={PanelView.RECIPIENT_SELECTION}
                anyspendQuote={anyspendQuote}
                onShowPointsDetail={() => setActivePanel(PanelView.POINTS_DETAIL)}
                onShowFeeDetail={() => setActivePanel(PanelView.FEE_DETAIL)}
                customUsdInputValues={customUsdInputValues}
                customRecipientLabel={customRecipientLabel}
              />
            </motion.div>
          )}

          <div
            className={cn("relative -my-1 flex h-0 items-center justify-center", paymentType === "fiat" && "hidden")}
          >
            <Button
              variant="ghost"
              className={
                classes?.swapDirectionButton ||
                "swap-direction-button border-as-stroke bg-as-surface-primary z-10 h-10 w-10 cursor-default rounded-xl border-2 sm:h-8 sm:w-8 sm:rounded-xl"
              }
            >
              <div className="relative flex items-center justify-center transition-opacity">
                <ArrowDown className="text-as-primary/50 h-5 w-5" />
              </div>
            </Button>
          </div>

          {paymentType === "crypto" && (
            <CryptoReceiveSection
              isDepositMode={false}
              isBuyMode={false}
              effectiveRecipientAddress={selectedRecipientOrDefault}
              recipientName={recipientName || undefined}
              customRecipientLabel={customRecipientLabel}
              onSelectRecipient={() => setActivePanel(PanelView.RECIPIENT_SELECTION)}
              dstAmount={isSrcInputDirty ? dstAmount : dstAmountInput}
              dstToken={selectedDstToken}
              dstTokenSymbol={DESTINATION_TOKEN_DETAILS.SYMBOL}
              dstTokenLogoURI={DESTINATION_TOKEN_DETAILS.LOGO_URI}
              selectedDstChainId={selectedDstChainId}
              setSelectedDstChainId={() => {}}
              setSelectedDstToken={() => {}}
              isSrcInputDirty={isSrcInputDirty}
              onChangeDstAmount={value => {
                setIsSrcInputDirty(false);
                setDstAmountInput(value);
              }}
              anyspendQuote={anyspendQuote}
              onShowPointsDetail={() => setActivePanel(PanelView.POINTS_DETAIL)}
              onShowFeeDetail={() => setActivePanel(PanelView.FEE_DETAIL)}
            />
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
        className={cn("mt-4 flex w-full max-w-[460px] flex-col gap-2")}
      >
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
      </motion.div>

      {/* Gas indicator - show when source chain has gas data */}
      {gasPriceData && !isLoadingGas && paymentType === "crypto" && (
        <GasIndicator gasPrice={gasPriceData} className={classes?.gasIndicator || "mt-2 w-full"} />
      )}

      {mainFooter ? mainFooter : null}
    </div>
  );

  const handleCryptoOrder = async () => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(selectedRecipientOrDefault, "Recipient address is not found");

      if (tradeType === "EXACT_OUTPUT") {
        // EXACT_OUTPUT mode: create a custom order (like AnySpendStakeUpside)
        const srcAmountFromQuote = anyspendQuote.data?.currencyIn?.amount;
        invariant(srcAmountFromQuote, "Source amount from quote is not found");

        const expectedDstAmount = anyspendQuote.data?.currencyOut?.amount ?? "0";
        const encodedData = generateEncodedData(customExactInConfig, activeOutputAmountInWei);

        createOrder({
          recipientAddress: selectedRecipientOrDefault,
          orderType: "custom",
          srcChain: selectedSrcChainId,
          dstChain: selectedDstChainId,
          srcToken: selectedSrcToken,
          dstToken: selectedDstToken,
          srcAmount: srcAmountFromQuote,
          expectedDstAmount,
          creatorAddress: globalAddress,
          payload: {
            amount: activeOutputAmountInWei,
            data: encodedData,
            to: customExactInConfig ? normalizeAddress(customExactInConfig.to) : undefined,
            spenderAddress: customExactInConfig?.spenderAddress
              ? normalizeAddress(customExactInConfig.spenderAddress)
              : undefined,
          },
        });
      } else {
        // EXACT_INPUT mode: create custom_exact_in order (original behavior)
        const srcAmountBigInt = BigInt(activeInputAmountInWei);
        const payload = buildCustomPayload(selectedRecipientOrDefault);

        createOrder({
          recipientAddress: selectedRecipientOrDefault,
          orderType,
          srcChain: selectedSrcChainId,
          dstChain: selectedDstChainId,
          srcToken: selectedSrcToken,
          dstToken: selectedDstToken,
          srcAmount: srcAmountBigInt.toString(),
          expectedDstAmount: expectedDstAmountRaw,
          creatorAddress: globalAddress,
          payload,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  const handleFiatOrder = async () => {
    try {
      invariant(anyspendQuote, "Relay price is not found");
      invariant(selectedRecipientOrDefault, "Recipient address is not found");

      if (!srcAmount || parseFloat(srcAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

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
      } else {
        toast.error("Please select a payment method");
        return;
      }

      const onrampOptions = {
        vendor,
        paymentMethod: paymentMethodString,
        country: geoData?.country || "US",
        redirectUrl: window.location.origin,
      };

      if (tradeType === "EXACT_OUTPUT") {
        // EXACT_OUTPUT mode: create a custom order (like AnySpendStakeUpside)
        const expectedDstAmount = anyspendQuote.data?.currencyOut?.amount ?? "0";
        const encodedData = generateEncodedData(customExactInConfig, activeOutputAmountInWei);

        createOnrampOrder({
          recipientAddress: selectedRecipientOrDefault,
          orderType: "custom",
          dstChain: selectedDstChainId,
          dstToken: selectedDstToken,
          srcFiatAmount: srcAmount,
          onramp: onrampOptions,
          expectedDstAmount,
          creatorAddress: globalAddress,
          payload: {
            amount: activeOutputAmountInWei,
            data: encodedData,
            to: customExactInConfig ? normalizeAddress(customExactInConfig.to) : undefined,
            spenderAddress: customExactInConfig?.spenderAddress
              ? normalizeAddress(customExactInConfig.spenderAddress)
              : undefined,
          },
        });
      } else {
        // EXACT_INPUT mode: create custom_exact_in order (original behavior)
        const payload = buildCustomPayload(selectedRecipientOrDefault);

        createOnrampOrder({
          recipientAddress: selectedRecipientOrDefault,
          orderType,
          dstChain: selectedDstChainId,
          dstToken: selectedDstToken,
          srcFiatAmount: srcAmount,
          onramp: onrampOptions,
          expectedDstAmount: expectedDstAmountRaw,
          creatorAddress: globalAddress,
          payload,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

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
            cryptoPaymentMethod={paymentType === "fiat" ? CryptoPaymentMethodType.NONE : effectiveCryptoPaymentMethod}
            selectedCryptoPaymentMethod={effectiveCryptoPaymentMethod}
            onPaymentMethodChange={setSelectedCryptoPaymentMethod}
            onBack={() => {
              setOrderId(undefined);
              setActivePanel(PanelView.MAIN);
            }}
            disableUrlParamManagement
            points={oat.data.points || undefined}
            returnToHomeUrl={returnToHomeUrl}
            returnHomeLabel={returnHomeLabel}
          />
        )}
      </div>
    </div>
  );

  const loadingView = (
    <div className="mx-auto flex w-full flex-col items-center gap-4 p-5">
      <div className="text-as-primary">Loading order details...</div>
    </div>
  );

  const recipientSelectionView = (
    <RecipientSelection
      initialValue={selectedRecipientOrDefault || ""}
      onBack={() => setActivePanel(PanelView.MAIN)}
      onConfirm={address => {
        setSelectedRecipientAddress(address);
        setActivePanel(PanelView.MAIN);
      }}
    />
  );

  const cryptoPaymentMethodView = (
    <CryptoPaymentMethod
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

  const pointsDetailView = (
    <PointsDetailPanel
      pointsAmount={anyspendQuote?.data?.pointsAmount || 0}
      onBack={() => setActivePanel(PanelView.MAIN)}
    />
  );

  const feeDetailView = anyspendQuote?.data?.fee ? (
    <FeeDetailPanel
      fee={anyspendQuote.data.fee}
      transactionAmountUsd={
        paymentType === "fiat"
          ? parseFloat(srcAmount)
          : anyspendQuote.data.currencyIn?.amountUsd
            ? Number(anyspendQuote.data.currencyIn.amountUsd)
            : undefined
      }
      onBack={() => setActivePanel(PanelView.MAIN)}
    />
  ) : null;

  return (
    <StyleRoot>
      <div
        className={
          classes?.root ||
          cn(
            "anyspend-container font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
            mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
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
          variants={{
            enter: { x: 300, opacity: 0 },
            center: { x: 0, opacity: 1 },
            exit: { x: -300, opacity: 0 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {[
            <div key="main-view">{mainView}</div>,
            <div key="crypto-payment-method-view">{cryptoPaymentMethodView}</div>,
            <div key="fiat-payment-method-view">{fiatPaymentMethodView}</div>,
            <div key="recipient-selection-view">{recipientSelectionView}</div>,
            <div key="order-details-view">{orderDetailsView}</div>,
            <div key="loading-view">{loadingView}</div>,
            <div key="points-detail-view">{pointsDetailView}</div>,
            <div key="fee-detail-view">{feeDetailView}</div>,
          ]}
        </TransitionPanel>
      </div>
    </StyleRoot>
  );
}
