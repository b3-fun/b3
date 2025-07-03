import { useMemo } from "react";

import { useCoinbaseOnrampOptions } from "./useCoinbaseOnrampOptions";
import { useGetGeo } from "./useGetGeo";
import { useStripeSupport } from "./useStripeSupport";

export function useGeoOnrampOptions(isMainnet: boolean, srcFiatAmount: string) {
  // Use existing hooks
  const { geoData, loading: isLoadingGeo, error: geoError } = useGetGeo();
  const { coinbaseOnrampOptions, isLoadingCoinbaseOnrampOptions, coinbaseOnrampOptionsError } =
    useCoinbaseOnrampOptions(isMainnet, geoData?.country);
  const { isStripeOnrampSupported, isStripeWeb2Supported, isLoadingStripeSupport, stripeSupportError } =
    useStripeSupport(isMainnet, geoData?.ip || "", srcFiatAmount);

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
      isStripeWeb2Supported,
      isOnrampSupported: coinbaseAvailablePaymentMethods.length > 0 || isStripeOnrampSupported || isStripeWeb2Supported,
      isLoading: isLoadingGeo || isLoadingCoinbaseOnrampOptions || isLoadingStripeSupport,
      isLoadingGeo,
      isLoadingCoinbaseOnrampOptions,
      isLoadingStripeSupport,
      geoError,
      coinbaseOnrampOptionsError,
      stripeSupportError
    }),
    [
      geoData,
      coinbaseOnrampOptions,
      coinbaseAvailablePaymentMethods,
      isStripeOnrampSupported,
      isStripeWeb2Supported,
      isLoadingGeo,
      isLoadingCoinbaseOnrampOptions,
      isLoadingStripeSupport,
      geoError,
      coinbaseOnrampOptionsError,
      stripeSupportError
    ]
  );
}
