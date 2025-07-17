import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { GetQuoteRequest } from "../../types/api_req_res";

/**
 * React hook to fetch the price or rate for a relay swap using Anyspend.
 *
 * @param {boolean} isMainnet - Whether to use mainnet or testnet endpoints.
 * @param {object} req - The request object containing source/destination chain, token addresses, and amount/price.
 *                       (Consider specifying the exact type of 'req' if available, e.g., @param {AnyspendQuoteRequest} req)
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
          req.type === "swap"
            ? req.amount
            : req.type === "mint_nft"
              ? req.price
              : req.type === "join_tournament"
                ? req.price
                : req.type === "fund_tournament"
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
