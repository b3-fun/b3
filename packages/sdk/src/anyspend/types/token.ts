import { z } from "zod";

export const zToken = z.object({
  chainId: z.number(),
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  metadata: z.object({
    logoURI: z.string().optional()
  })
});
export type Token = z.infer<typeof zToken>;
