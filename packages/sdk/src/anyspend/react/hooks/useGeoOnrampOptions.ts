import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { useMemo } from "react";
import { VisitorData } from "../../types/fingerprint";
import { useCoinbaseOnrampOptions } from "./useCoinbaseOnrampOptions";
import { useGetGeo } from "./useGetGeo";
import { useStripeSupport } from "./useStripeSupport";

export function useGeoOnrampOptions(isMainnet: boolean, srcFiatAmount: string) {
  // Get fingerprint data
  const { data: fpData, isLoading: isLoadingVisitorData } = useVisitorData(
    { extendedResult: true },
    { immediate: true },
  );
  const visitorData: VisitorData | undefined = fpData && {
    requestId: fpData.requestId,
    visitorId: fpData.visitorId,
  };

  // Use existing hooks
  const { geoData, loading: isLoadingGeo, error: geoError } = useGetGeo();
  const { coinbaseOnrampOptions, isLoadingCoinbaseOnrampOptions, coinbaseOnrampOptionsError } =
    useCoinbaseOnrampOptions(isMainnet, geoData?.country, visitorData);
  const { isStripeOnrampSupported, stripeWeb2Support, isLoadingStripeSupport, stripeSupportError } = useStripeSupport(
    isMainnet,
    geoData?.ip || "",
    srcFiatAmount,
    visitorData,
  );

  // Calculate available payment methods based on the amount
  const coinbaseAvailablePaymentMethods = useMemo(() => {
    if (!coinbaseOnrampOptions?.paymentCurrencies?.[0]?.limits || !srcFiatAmount) return [];
    const amountNum = parseFloat(srcFiatAmount);
    if (isNaN(amountNum)) return [];

    return coinbaseOnrampOptions.paymentCurrencies[0].limits.filter((limit: any) => {
      const min = parseFloat(limit.min);
      const max = parseFloat(limit.max);
      return amountNum >= min && amountNum <= max;
    });
  }, [coinbaseOnrampOptions, srcFiatAmount]);

  return useMemo(
    () => ({
      geoData,
      coinbaseOnrampOptions,
      coinbaseAvailablePaymentMethods,
      isStripeOnrampSupported,
      stripeWeb2Support,
      isOnrampSupported: coinbaseAvailablePaymentMethods.length > 0 || isStripeOnrampSupported || stripeWeb2Support,
      isLoading: isLoadingGeo || isLoadingCoinbaseOnrampOptions || isLoadingStripeSupport || isLoadingVisitorData,
      isLoadingGeo,
      isLoadingCoinbaseOnrampOptions,
      isLoadingStripeSupport,
      geoError,
      coinbaseOnrampOptionsError,
      stripeSupportError,
    }),
    [
      geoData,
      coinbaseOnrampOptions,
      coinbaseAvailablePaymentMethods,
      isStripeOnrampSupported,
      stripeWeb2Support,
      isLoadingGeo,
      isLoadingCoinbaseOnrampOptions,
      isLoadingStripeSupport,
      isLoadingVisitorData,
      geoError,
      coinbaseOnrampOptionsError,
      stripeSupportError,
    ],
  );
}
