import { QuoteDetails } from "@reservoir0x/relay-sdk";
import { z } from "zod";

import { OrderType } from "../order";
import { TradeType } from "../relay";
import { zCustomPayload } from "../custom";

const zGetQuoteBody = z.object({
  srcChain: z.number(),
  dstChain: z.number(),
  srcTokenAddress: z.string(),
  dstTokenAddress: z.string()
});

const zGetQuoteForSwapOrderBody = zGetQuoteBody.extend({
  type: z.literal(OrderType.Swap),
  tradeType: z.nativeEnum(TradeType),
  amount: z.string()
});

const zGetQuoteForMintNftOrderBody = zGetQuoteBody.extend({
  type: z.literal(OrderType.MintNFT),
  contractAddress: z.string(),
  price: z.string()
});

const zGetQuoteForJoinTournamentOrderBody = zGetQuoteBody.extend({
  type: z.literal(OrderType.JoinTournament),
  contractAddress: z.string(),
  price: z.string()
});

const zGetQuoteForFundTournamentOrderBody = zGetQuoteBody.extend({
  type: z.literal(OrderType.FundTournament),
  contractAddress: z.string(),
  fundAmount: z.string()
});

const zGetQuoteForCustomOrderBody = zGetQuoteBody.extend({
  type: z.literal(OrderType.Custom),
  payload: zCustomPayload
});

export const zGetQuoteRequest = z.object({
  body: z.discriminatedUnion("type", [
    zGetQuoteForSwapOrderBody,
    zGetQuoteForMintNftOrderBody,
    zGetQuoteForJoinTournamentOrderBody,
    zGetQuoteForFundTournamentOrderBody,
    zGetQuoteForCustomOrderBody
  ])
});
export type GetQuoteRequest = z.infer<typeof zGetQuoteRequest.shape.body>;

export interface GetQuoteResponse {
  success: boolean;
  message: string;
  data: QuoteDetails;
  statusCode: number;
}
