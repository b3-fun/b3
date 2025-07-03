import { z } from "zod";
import { zOrder } from "../order";
import { zDepositTransaction, zExecuteTransaction, zRefundTransaction, zRelayTransaction } from "../transaction";

export const zGetOrderAndTransactionsRequest = z.object({
  params: z.object({
    orderId: z.string()
  })
});

export const zGetOrderAndTxsResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    order: zOrder,
    depositTxs: z.array(zDepositTransaction).nullable(),
    relayTx: zRelayTransaction.nullable(),
    executeTx: zExecuteTransaction.nullable(),
    refundTxs: z.array(zRefundTransaction).nullable()
  }),
  statusCode: z.number()
});
export type GetOrderAndTxsResponse = z.infer<typeof zGetOrderAndTxsResponse>;
