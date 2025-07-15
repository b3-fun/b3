import { z } from "zod";

import { zCustomMetadata, zCustomPayload } from "../custom";
import { zMintNftMetadata, zMintNftPayload } from "../nft";
import { zOnrampMetadata } from "../onramp";
import { OrderType, zOrder } from "../order";
import { zSwapMetadata, zSwapPayload } from "../swap";
import { zFundTournamentPayload, zJoinTournamentPayload, zTournamentMetadata } from "../tournament";

const zBaseCreateOrderBody = z.object({
  recipientAddress: z.string(),
  srcChain: z.number(),
  dstChain: z.number(),
  srcTokenAddress: z.string(),
  dstTokenAddress: z.string(),
  srcAmount: z.string(),
  partnerId: z.string().optional(),
  onramp: zOnrampMetadata.optional(),
  creatorAddress: z.string().optional(),
});

const zCreateSwapOrderBody = zBaseCreateOrderBody.extend({
  type: z.literal(OrderType.Swap),
  payload: zSwapPayload,
  metadata: zSwapMetadata,
});

const zCreateMintNftOrderBody = zBaseCreateOrderBody.extend({
  type: z.literal(OrderType.MintNFT),
  payload: zMintNftPayload,
  metadata: zMintNftMetadata,
});

const zCreateJoinTournamentOrderBody = zBaseCreateOrderBody.extend({
  type: z.literal(OrderType.JoinTournament),
  payload: zJoinTournamentPayload,
  metadata: zTournamentMetadata,
});

const zCreateFundTournamentOrderBody = zBaseCreateOrderBody.extend({
  type: z.literal(OrderType.FundTournament),
  payload: zFundTournamentPayload,
  metadata: zTournamentMetadata,
});

const zCreateCustomOrderBody = zBaseCreateOrderBody.extend({
  type: z.literal(OrderType.Custom),
  payload: zCustomPayload,
  metadata: zCustomMetadata,
});

export const zCreateOrderRequest = z.object({
  body: z.discriminatedUnion("type", [
    zCreateSwapOrderBody,
    zCreateMintNftOrderBody,
    zCreateJoinTournamentOrderBody,
    zCreateFundTournamentOrderBody,
    zCreateCustomOrderBody,
  ]),
});
export type CreateOrderRequest = z.infer<typeof zCreateOrderRequest.shape.body>;

export const zCreateOrderResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: zOrder,
  statusCode: z.number(),
});
