import { z } from "zod";
import { zRelayStatus } from "./relay";

export const zDepositTransaction = z.object({
  orderId: z.string(),
  chain: z.number(),
  from: z.string().nullable(),
  txHash: z.string(),
  amount: z.string(),
  createdAt: z.number(),
});
export type DepositTransaction = z.infer<typeof zDepositTransaction>;

export const zRelayTransaction = z.object({
  orderId: z.string(),
  chain: z.number(),
  txHash: z.string(),
  status: zRelayStatus,
  createdAt: z.number(),
});
export type RelayTransaction = z.infer<typeof zRelayTransaction>;

export const zExecuteTransaction = z.object({
  orderId: z.string(),
  chain: z.number(),
  txHash: z.string(),
  createdAt: z.number(),
});
export type ExecuteTransaction = z.infer<typeof zExecuteTransaction>;

export const zRefundTransaction = z.object({
  orderId: z.string(),
  chain: z.number(),
  txHash: z.string(),
  amount: z.string(),
  status: z.enum(["success", "failure"]),
  createdAt: z.number(),
});
export type RefundTransaction = z.infer<typeof zRefundTransaction>;
