import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { GetQuoteRequest, GetQuoteResponse } from "../../types/api_req_res";

/**
 * React hook to fetch the price or rate for a relay swap using Anyspend.
 *
 * @param req - The request object containing source/destination chain, token addresses, and amount/price.
 * @remarks The query is enabled only if all required fields in `req` are present and the amount/price is non-zero.
 */
export type UseAnyspendQuoteResult = {
  anyspendQuote: GetQuoteResponse | undefined;
  isLoadingAnyspendQuote: boolean;
  getAnyspendQuoteError: Error | null;
  refetchAnyspendQuote: () => void;
};
export function useAnyspendQuote(req: GetQuoteRequest): UseAnyspendQuoteResult {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["useAnyspendQuote", JSON.stringify(req)],
    queryFn: (): Promise<GetQuoteResponse> => {
      return anyspendService.getQuote(req);
    },
    enabled: Boolean(
      req.srcChain &&
        req.dstChain &&
        req.srcTokenAddress &&
        req.dstTokenAddress &&
        BigInt(
          req.type === "swap" || req.type === "hype_duel"
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
