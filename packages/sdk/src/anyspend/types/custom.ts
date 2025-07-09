import z from "zod";
import { zToken } from "./token";

export const zCustomPayload = z.object({
  data: z.string(),
  to: z.string(),
  spenderAddress: z.string().optional(),
  amount: z.string(),
});
export type CustomPayload = z.infer<typeof zCustomPayload>;

export const zCustomMetadata = z.object({
  srcToken: zToken,
  dstToken: zToken,
  action: z.string().optional(),
});
export type CustomMetadata = z.infer<typeof zCustomMetadata>;
