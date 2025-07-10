import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { GetQuoteRequest, OrderType } from "@b3dotfun/sdk/anyspend/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * React hook to fetch the price or rate for a relay swap using Anyspend.
 *
 * @param {boolean} isMainnet - Whether to use mainnet or testnet endpoints.
 * @param {object} req - The request object containing source/destination chain, token addresses, and amount/price.
 *                       (Consider specifying the exact type of 'req' if available, e.g., @param {AnyspendQuoteRequest} req)
 * @param {boolean} [isRefetch=false] - If true, refetches the price every 10 seconds; otherwise, fetches once. Defaults to false.
 *
 * @returns {object} An object containing the state and data for the Anyspend quote.
 * @property {object | undefined} anyspendQuote - The fetched quote data. (Consider specifying the exact type if available, e.g., AnyspendQuoteResponse)
 * @property {boolean} isLoadingAnyspendQuote - Loading state for the quote query.
 * @property {Error | null} getAnyspendQuoteError - Error object if the query failed, otherwise null.
 * @property {Function} refetchAnyspendQuote - Function to manually refetch the quote.
 *
 * @remarks The query is enabled only if all required fields in `req` are present and the amount/price is non-zero.
 */
export function useAnyspendQuote(isMainnet: boolean, req: GetQuoteRequest) {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["useAnyspendQuote", isMainnet, JSON.stringify(req)],
    queryFn: () => {
      return anyspendService.getQuote(isMainnet, req);
    },
    enabled: Boolean(
      req.srcChain &&
        req.dstChain &&
        req.srcTokenAddress &&
        req.dstTokenAddress &&
        BigInt(
          req.type === OrderType.Swap
            ? req.amount
            : req.type === OrderType.MintNFT
              ? req.price
              : req.type === OrderType.JoinTournament
                ? req.price
                : req.type === OrderType.FundTournament
                  ? req.fundAmount
                  : req.payload.amount,
        ) !== BigInt(0),
    ),
    refetchInterval: 10000,
    retry: false,
  });

  return useMemo(
    () => ({
      anyspendQuote: data,
      isLoadingAnyspendQuote: isLoading,
      getAnyspendQuoteError: error,
      refetchAnyspendQuote: refetch,
    }),
    [data, error, isLoading, refetch],
  );
}
