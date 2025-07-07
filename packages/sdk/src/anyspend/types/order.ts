import { z } from "zod";
import { zOnrampMetadata } from "./onramp";
import { zPermit } from "./permit";
import { zMintNftMetadata, zMintNftPayload } from "./nft";
import { zSwapMetadata, zSwapPayload } from "./swap";
import { zFundTournamentPayload, zJoinTournamentPayload, zTournamentMetadata } from "./tournament";
import { zCustomMetadata, zCustomPayload } from "./custom";

export enum OrderStatus {
  // Prepare steps: For non-permit orders
  ScanningDepositTransaction = "scanning_deposit_transaction",
  WaitingStripePayment = "waiting_stripe_payment",

  // Prepare steps: For permit orders
  ObtainToken = "obtain_token",
  ObtainFailed = "obtain_failed",

  //
  Expired = "expired",

  //
  SendingTokenFromVault = "sending_token_from_vault",

  // Execute steps
  Relay = "relay",
  Executed = "executed",

  // Refund steps
  Refunding = "refunding",
  Refunded = "refunded",

  // Failed order
  Failure = "failure"
}

export enum OrderType {
  Swap = "swap",
  MintNFT = "mint_nft",
  JoinTournament = "join_tournament",
  FundTournament = "fund_tournament",
  Custom = "custom"
}

export const zBaseOrder = z.object({
  id: z.string(),

  recipientAddress: z.string(),
  globalAddress: z.string(),
  srcChain: z.number(),
  dstChain: z.number(),
  srcTokenAddress: z.string(),
  dstTokenAddress: z.string(),
  srcAmount: z.string(),
  status: z.nativeEnum(OrderStatus),
  errorDetails: z.string().nullable(),
  createdAt: z.number(),
  expiredAt: z.number(),
  onrampMetadata: zOnrampMetadata.nullable(),
  creatorAddress: z.string().nullable(),
  partnerId: z.string().nullable(),

  oneClickBuyUrl: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),

  permit: zPermit.nullable()
});

export const zOrder = z.discriminatedUnion("type", [
  zBaseOrder.extend({
    type: z.literal(OrderType.Swap),
    payload: zSwapPayload,
    metadata: zSwapMetadata
  }),
  zBaseOrder.extend({
    type: z.literal(OrderType.MintNFT),
    payload: zMintNftPayload,
    metadata: zMintNftMetadata
  }),
  zBaseOrder.extend({
    type: z.literal(OrderType.JoinTournament),
    payload: zJoinTournamentPayload,
    metadata: zTournamentMetadata
  }),
  zBaseOrder.extend({
    type: z.literal(OrderType.FundTournament),
    payload: zFundTournamentPayload,
    metadata: zTournamentMetadata
  }),
  zBaseOrder.extend({
    type: z.literal(OrderType.Custom),
    payload: zCustomPayload,
    metadata: zCustomMetadata
  })
]);
export type Order = z.infer<typeof zOrder>;
