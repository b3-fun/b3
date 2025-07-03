import { z } from "zod";
import { zToken } from "./token";

export const zSwapPayload = z.object({
  expectedDstAmount: z.string(),
  actualDstAmount: z.string().nullable()
});

export const zSwapMetadata = z.object({
  srcToken: zToken,
  dstToken: zToken
});
