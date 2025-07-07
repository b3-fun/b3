import {
  getChainName,
  GetQuoteResponse,
  OnrampVendor,
  OrderType,
  Token,
  useAnyspendCreateOnrampOrder,
  useGeoOnrampOptions
} from "@b3dotfun/sdk/anyspend";
import { Button } from "@b3dotfun/sdk/global-account/react";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";

interface WebviewOnrampPaymentProps {
  srcAmountOnRamp: string;
  recipientAddress?: string;
  destinationToken: Token;
  anyspendQuote: GetQuoteResponse | undefined;
  onOrderCreated: (orderId: string) => void;
  userId?: string;
}

export function WebviewOnrampPayment({
  srcAmountOnRamp,
  recipientAddress,
  destinationToken,
  anyspendQuote,
  onOrderCreated,
  userId
}: WebviewOnrampPaymentProps) {
  // Use a stable amount for geo onramp options to prevent unnecessary refetches
  const [stableAmountForGeo, setStableAmountForGeo] = useState(srcAmountOnRamp);
  const hasInitialized = useRef(false);

  // Only update the stable amount on first render or when explicitly needed
  useEffect(() => {
    if (!hasInitialized.current && srcAmountOnRamp) {
      setStableAmountForGeo(srcAmountOnRamp);
      hasInitialized.current = true;
    }
  }, [srcAmountOnRamp]);

  const {
    geoData,
    isStripeWeb2Supported,
    isLoading: isLoadingGeoOnramp
  } = useGeoOnrampOptions(true, stableAmountForGeo);

  console.log("isStripeWeb2Supported", isStripeWeb2Supported);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: data => {
      const orderId = data.data.id;
      window.location.href = `${window.location.origin}/?orderId=${orderId}`;
    },
    onError: error => {
      console.error(error);
      toast.error("Failed to create order: " + error.message);
    }
  });

  const handleContinueToPayment = async () => {
    try {
      if (!recipientAddress) {
        toast.error("Please select a recipient");
        return;
      }

      if (!srcAmountOnRamp || parseFloat(srcAmountOnRamp) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (!isStripeWeb2Supported) {
        toast.error("Stripe credit card not available");
        return;
      }

      if (!anyspendQuote) {
        toast.error("Failed to get quote");
        return;
      }

      const getDstToken = (): Token => {
        return {
          ...destinationToken,
          chainId: destinationToken.chainId,
          address: destinationToken.address
        };
      };

      createOrder({
        isMainnet: true,
        recipientAddress,
        orderType: OrderType.Swap,
        dstChain: getDstToken().chainId,
        dstToken: getDstToken(),
        srcFiatAmount: srcAmountOnRamp,
        onramp: {
          vendor: OnrampVendor.StripeWeb2,
          paymentMethod: "",
          country: geoData?.country || "US",
          ipAddress: geoData?.ip,
          redirectUrl: `${window.location.origin}${userId ? `?userId=${userId}` : ""}`
        },
        expectedDstAmount: anyspendQuote?.data?.currencyOut?.amount?.toString() || "0"
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create order: " + err.message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
      {/* Order Summary Section */}
      <>
        <h2 className="-mb-3 text-lg font-semibold">Order summary</h2>
        <div className="bg-b3-react-background border-b3-react-border flex flex-col gap-3 rounded-lg border p-4">
          {/* Destination Token */}
          <div className="flex items-center justify-between">
            <p className="text-b3-react-foreground/60">Receiving</p>
            <div className="flex items-center gap-2">
              {destinationToken.metadata?.logoURI && (
                <img
                  src={destinationToken.metadata.logoURI}
                  alt={destinationToken.symbol}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-b3-react-foreground/80">
                {anyspendQuote?.data?.currencyOut?.amount
                  ? Number(
                      formatUnits(BigInt(anyspendQuote.data.currencyOut.amount), destinationToken.decimals)
                    ).toFixed(4)
                  : "0"}{" "}
                {destinationToken.symbol}
              </span>
            </div>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between">
            <p className="text-b3-react-foreground/60">Network</p>
            <span className="text-b3-react-foreground/80">{getChainName(destinationToken.chainId)}</span>
          </div>

          {/* Recipient Section */}
          {recipientAddress && (
            <motion.div
              initial={false}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
              }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-between"
            >
              <p className="text-b3-react-foreground/60">Recipient</p>
              <div className="flex items-center gap-2">
                <span className="text-b3-react-foreground/80">{centerTruncate(recipientAddress)}</span>
              </div>
            </motion.div>
          )}

          {/* Amount Section */}
          <div className="border-b3-react-border border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-b3-react-foreground font-semibold">You Pay</p>
              <p className="text-b3-react-foreground text-xl font-semibold">
                ${parseFloat(srcAmountOnRamp).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </>

      {/* Payment Section */}
      {isCreatingOrder ? (
        <div className="bg-b3-react-background border-b3-react-border flex items-center justify-center gap-3 rounded-lg border p-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-as-primary/70">Creating payment session...</span>
        </div>
      ) : isLoadingGeoOnramp ? (
        <div className="bg-b3-react-background border-b3-react-border flex items-center justify-center gap-3 rounded-lg border p-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-as-primary/70">Loading payment options...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleContinueToPayment}
            disabled={isCreatingOrder || !isStripeWeb2Supported}
            className="bg-as-brand hover:bg-as-brand/90 text-as-primary h-14 w-full rounded-xl text-lg font-medium"
          >
            {isCreatingOrder ? "Creating Payment..." : "Continue to Payment"}
          </Button>
        </div>
      )}
    </div>
  );
}
