import { z } from "zod";

import { zOrder } from "../order";
import { zDepositTransaction, zExecuteTransaction, zRefundTransaction, zRelayTransaction } from "../transaction";

export const zGetOrderAndTransactionsRequest = z.object({
  params: z.object({
    orderId: z.string(),
  }),
});

export const zGetOrderAndTxsResponseData = z.object({
  order: zOrder,
  depositTxs: z.array(zDepositTransaction).nullable(),
  relayTx: zRelayTransaction.nullable(),
  executeTx: zExecuteTransaction.nullable(),
  refundTxs: z.array(zRefundTransaction).nullable(),
});
export type GetOrderAndTxsResponseData = z.infer<typeof zGetOrderAndTxsResponseData>;

export const zGetOrderAndTxsResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: zGetOrderAndTxsResponseData,
  statusCode: z.number(),
});
export type GetOrderAndTxsResponse = z.infer<typeof zGetOrderAndTxsResponse>;
