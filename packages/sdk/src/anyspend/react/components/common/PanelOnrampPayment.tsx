import { useAnyspendCreateOnrampOrder, useGeoOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { Button } from "@b3dotfun/sdk/global-account/react";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import invariant from "invariant";
import { ChevronLeft, ChevronRight, Landmark, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AnySpendFingerprintWrapper, getFingerprintConfig } from "../AnySpendFingerprintWrapper";

interface PanelOnrampPaymentProps {
  srcAmountOnRamp: string;
  recipientName?: string;
  recipientAddress?: string;
  isBuyMode: boolean;
  destinationTokenChainId?: number;
  destinationTokenAddress?: string;
  selectedDstChainId: number;
  selectedDstToken: components["schemas"]["Token"];
  anyspendQuote: GetQuoteResponse | undefined;
  globalAddress?: string;
  onOrderCreated: (orderId: string) => void;
  onBack: () => void;
  orderType: components["schemas"]["Order"]["type"];
  nft?: components["schemas"]["NFT"] & { price: string };
  tournament?: components["schemas"]["Tournament"] & { contractAddress: string; entryPriceOrFundAmount: string };
  payload?: any;
  recipientEnsName?: string;
  recipientImageUrl?: string;
}

export function PanelOnrampPayment(props: PanelOnrampPaymentProps) {
  const fingerprintConfig = getFingerprintConfig();

  return (
    <AnySpendFingerprintWrapper fingerprint={fingerprintConfig}>
      <PanelOnrampPaymentInner {...props} />
    </AnySpendFingerprintWrapper>
  );
}

function PanelOnrampPaymentInner(props: PanelOnrampPaymentProps) {
  const {
    srcAmountOnRamp,
    recipientAddress,
    isBuyMode,
    destinationTokenChainId,
    destinationTokenAddress,
    selectedDstChainId,
    selectedDstToken,
    anyspendQuote,
    globalAddress,
    onOrderCreated,
    onBack,
    orderType,
    nft,
    tournament,
    payload,
    recipientEnsName,
    recipientImageUrl,
  } = props;

  const {
    geoData,
    coinbaseOnrampOptions,
    coinbaseAvailablePaymentMethods,
    stripeWeb2Support,
    isLoading: isLoadingGeoOnramp,
  } = useGeoOnrampOptions(srcAmountOnRamp);

  const isLoading = isLoadingGeoOnramp;

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      onOrderCreated(orderId);
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    },
  });

  const handlePaymentMethodClick = async (
    vendor: components["schemas"]["OnrampMetadata"]["vendor"],
    paymentMethod?: string,
  ) => {
    try {
      if (!recipientAddress) {
        toast.error("Please select a recipient");
        return;
      }

      if (!srcAmountOnRamp || parseFloat(srcAmountOnRamp) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (vendor === "coinbase" && !coinbaseOnrampOptions) {
        toast.error("Onramp options not available");
        return;
      }

      if (vendor === "stripe-web2" && !stripeWeb2Support.isSupport) {
        toast.error("Stripe credit card not available");
        return;
      }

      if (!anyspendQuote) {
        toast.error("Failed to get quote");
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

      createOrder({
        recipientAddress,
        orderType,
        dstChain: getDstToken().chainId,
        dstToken: getDstToken(),
        srcFiatAmount: srcAmountOnRamp,
        onramp: {
          vendor: vendor,
          paymentMethod: paymentMethod || "",
          country: geoData?.country || "US",
          redirectUrl:
            window.location.origin === "https://basement.fun" ? "https://basement.fun/deposit" : window.location.origin,
        },
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0",
        creatorAddress: globalAddress,
        nft,
        tournament,
        payload,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6 px-5">
      {/* Order Summary Section */}
      <>
        <h2 className="-mb-3 text-lg font-semibold">Order summary</h2>
        <div className="bg-b3-react-background border-b3-react-border flex flex-col gap-3 rounded-lg border p-4">
          {/* Recipient Section */}
          {recipientAddress && (
            <motion.div
              initial={false}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-between"
            >
              <p className="text-b3-react-foreground/60">
                {orderType === "swap"
                  ? "Recipient"
                  : orderType === "mint_nft"
                    ? "Receive NFT at"
                    : orderType === "join_tournament"
                      ? "Join for"
                      : "Recipient"}
              </p>
              <div className="flex items-center gap-2">
                {recipientImageUrl && (
                  <img
                    src={recipientImageUrl}
                    alt={recipientImageUrl}
                    className="bg-b3-react-foreground size-7 rounded-full object-cover opacity-100"
                  />
                )}
                <div className="flex flex-col items-end gap-1">
                  {recipientEnsName && <span className="text-b3-react-foreground/80">@{recipientEnsName}</span>}
                  <span className="text-b3-react-foreground/80">{centerTruncate(recipientAddress)}</span>
                </div>
              </div>
            </motion.div>
          )}
          <div className="border-b3-react-border border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-b3-react-foreground font-semibold">Amount</p>
              <div className="flex flex-col items-end gap-0.5">
                <p
                  className="text-b3-react-foreground hover:text-b3-react-foreground/80 cursor-pointer text-xl font-semibold transition-colors"
                  onClick={onBack}
                >
                  ${parseFloat(srcAmountOnRamp).toFixed(2)}
                </p>
                {anyspendQuote?.data?.fee?.type === "standard_fee" && anyspendQuote.data.currencyIn?.amountUsd && (
                  <p className="text-b3-react-foreground/60 text-xs">
                    incl. $
                    {(
                      (Number(anyspendQuote.data.currencyIn.amountUsd) * anyspendQuote.data.fee.finalFeeBps) /
                      10000
                    ).toFixed(2)}{" "}
                    fee
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </>

      {isCreatingOrder ? (
        <div className="bg-b3-react-background border-b3-react-border flex items-center justify-center gap-3 rounded-lg border p-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-as-primary/70">Creating onramp order...</span>
        </div>
      ) : isLoading ? (
        <div className="bg-b3-react-background border-b3-react-border flex items-center justify-center gap-3 rounded-lg border p-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-as-primary/70">Loading payment options...</span>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment method</h2>
            <div className="flex items-center gap-1">
              {coinbaseAvailablePaymentMethods.length > 0 &&
                (() => {
                  const hasCard = coinbaseAvailablePaymentMethods.some(m => m.id === "CARD");
                  const hasApplePay = coinbaseAvailablePaymentMethods.some(m => m.id === "APPLE_PAY");
                  const hasBankAccount = coinbaseAvailablePaymentMethods.some(m => m.id === "ACH_BANK_ACCOUNT");

                  return (
                    <>
                      {hasCard && (
                        <>
                          <img
                            src="https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/visa.svg"
                            alt="Visa"
                            className="h-5"
                          />
                          <img
                            src="https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/mastercard.svg"
                            alt="Mastercard"
                            className="h-5"
                          />
                          <img
                            src="https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/amex.svg"
                            alt="Amex"
                            className="h-5"
                          />
                          <img
                            src="https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/discover.svg"
                            alt="Discover"
                            className="h-5"
                          />
                        </>
                      )}
                      {hasApplePay && (
                        <img
                          src="https://github.com/Kimmax/react-payment-icons/raw/main/assets/card-icons/card_apple-pay.svg"
                          alt="Apple Pay"
                          className="h-5"
                        />
                      )}
                      {hasBankAccount && <Landmark className="h-5 w-5" />}
                    </>
                  );
                })()}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {/* Coinbase Option - Show if payment methods available */}
            {coinbaseAvailablePaymentMethods.length > 0 &&
              (() => {
                const method = coinbaseAvailablePaymentMethods[0];

                return (
                  <button
                    onClick={() => handlePaymentMethodClick("coinbase", method.id)}
                    disabled={isCreatingOrder}
                    className="bg-b3-react-background border-b3-react-border hover:border-as-brand disabled:hover:border-b3-react-border group flex w-full items-center justify-between gap-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <img src="https://cdn.b3.fun/coinbase-wordmark-blue.svg" alt="Coinbase" className="h-6" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <h4 className="text-b3-react-foreground text-lg font-semibold">Coinbase Pay</h4>
                        <p className="text-b3-react-foreground/60 text-sm">
                          {method.id === "CARD" && "Debit card, bank account, or Coinbase Account"}
                          {method.id === "FIAT_WALLET" && "Pay with your Coinbase account balance"}
                          {method.id === "APPLE_PAY" && "Quick payment with Apple Pay"}
                          {method.id === "ACH_BANK_ACCOUNT" && "Direct bank account transfer"}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs font-medium text-green-600">Free</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-b3-react-foreground/40 group-hover:text-b3-react-foreground/60 h-5 w-5 transition-colors" />
                  </button>
                );
              })()}

            {/* Stripe Option - Show if supported */}
            {stripeWeb2Support.isSupport && (
              <button
                onClick={() => handlePaymentMethodClick("stripe-web2")}
                className="bg-b3-react-background border-b3-react-border hover:border-as-brand group flex w-full items-center justify-between gap-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                    <img
                      src="https://raw.githubusercontent.com/stripe/stripe.github.io/455f506a628dc3f6c505e3001db45a64e29e9fc3/images/stripe-logo.svg"
                      alt="Stripe"
                      className="h-5"
                    />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <h4 className="text-b3-react-foreground text-lg font-semibold">Stripe</h4>
                    <p className="text-b3-react-foreground/60 text-sm">Credit or debit card payment</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs font-medium text-orange-600">Fee Applied</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-b3-react-foreground/40 group-hover:text-b3-react-foreground/60 h-5 w-5 transition-colors" />
              </button>
            )}

            <Button
              variant="link"
              onClick={onBack}
              className="text-b3-react-foreground/70 hover:text-b3-react-foreground/90 mt-2 w-full"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
