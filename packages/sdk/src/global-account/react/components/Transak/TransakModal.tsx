"use client";

import { TextShimmer, useAccountWallet, useB3, useModalStore } from "@b3dotfun/sdk/global-account/react";
import debug from "@b3dotfun/sdk/shared/utils/debug";
import { Transak, TransakConfig } from "@transak/transak-sdk";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function TransakModal() {
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<Error | null>(null);

  const account = useAccountWallet();
  const { environment } = useB3();

  console.log(`process.env.NEXT_PUBLIC_TRANSAK_API_KEY`, process.env.NEXT_PUBLIC_TRANSAK_API_KEY); // d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6

  const transakConfig = useMemo((): TransakConfig => {
    return {
      apiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY || "", // (Required)
      // Yes, I know it looks weird to use isDevelopment for staging, but this is how this was done on Basement. Leaving till confirming difference
      environment: environment === "development" ? Transak.ENVIRONMENTS.STAGING : Transak.ENVIRONMENTS.PRODUCTION, // (Required)
      containerId: "transakMount", // Id of the element where you want to initialize the iframe
      themeColor: "0c68e9",
      widgetHeight: "650px",
      productsAvailed: "BUY",
      hideMenu: true,
      colorMode: "DARK",
      backgroundColors: "000000", // TODO: figure out why this doesn't work
      exchangeScreenTitle: "Buy ETH on B3",
      isFeeCalculationHidden: true,
      cryptoCurrencyCode: "ETH",
      network: "b3",
    };
  }, [environment]);

  const { ready } = useB3();
  const modalOptions = useModalStore(state => state.contentType);
  const isOnRamp = modalOptions?.type === "transak";
  const destinationWalletAddress = isOnRamp ? modalOptions?.destinationWalletAddress : undefined;
  const defaultCryptoAmount = isOnRamp ? modalOptions?.defaultCryptoAmount : undefined;
  const onSuccess = isOnRamp ? modalOptions?.onSuccess : undefined;
  const fiatAmount = isOnRamp ? modalOptions?.fiatAmount : undefined;
  const countryCode = isOnRamp ? modalOptions?.countryCode : undefined;

  useEffect(() => {
    if (!ready || !isOnRamp) return;

    const config = {
      ...transakConfig,
      walletAddress: destinationWalletAddress || account?.address, // In the future, this should be set to the new global B3 SCW address
      defaultCryptoAmount,
      disableWalletAddressForm: !!destinationWalletAddress || !!account?.address, // Only disable the form if we have an address
      fiatAmount: fiatAmount,
      countryCode: countryCode,
    };

    const transak = new Transak(config);

    try {
      transak.init();

      // Add event listeners
      Transak.on("*", data => {
        debug("@@transak", data);
      });

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        setIsLoading(false);
        debug("@@transak", "Transak SDK closed!");
      });

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_INITIALISED, () => {
        debug("@@transak", "Transak SDK initialized!");
        setIsLoading(false);
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, orderData => {
        debug("@@transak", orderData);
        toast.error("Oh no! Something went wrong. Please try again.");
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, orderData => {
        debug("@@transak", orderData);
        toast.success("Successfully purchased ETH with credit card!");
        onSuccess?.();
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to initialize Transak"));
      toast.error("Oh no! Something went wrong. Please try again.");
      setIsLoading(false);
    }

    // Cleanup code
    return () => {
      transak.close();
    };
  }, [
    ready,
    account?.address,
    destinationWalletAddress,
    defaultCryptoAmount,
    isOnRamp,
    onSuccess,
    fiatAmount,
    transakConfig,
    countryCode,
  ]);

  return (
    <>
      {isLoading && (
        <div className="flex h-full min-h-[650px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-24 w-24 animate-spin opacity-10" />
          <TextShimmer>Powering up our credit card processor...</TextShimmer>
        </div>
      )}
      <div
        id="transakMount"
        style={{
          display: isLoading ? "none" : "block",
          width: "100%",
          height: "650px",
          borderRadius: "25px",
          overflow: "hidden",
        }}
      />
    </>
  );
}
