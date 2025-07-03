import { z } from "zod";

export const zRelayStatus = z.enum(["refund", "delayed", "waiting", "failure", "pending", "success"]);
export type RelayStatus = z.infer<typeof zRelayStatus>;

export const zRelayStepStatus = z.enum(["complete", "incomplete"]);
export type RelayStepStatus = z.infer<typeof zRelayStepStatus>;

export enum TradeType {
  EXACT_INPUT = "EXACT_INPUT",
  EXPECTED_OUTPUT = "EXPECTED_OUTPUT",
  EXACT_OUTPUT = "EXACT_OUTPUT"
}
