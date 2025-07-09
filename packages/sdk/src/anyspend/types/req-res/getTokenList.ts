import { z } from "zod";

export const zGetTokenListResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(
    z.object({
      chainId: z.number(),
      address: z.string(),
      symbol: z.string(),
      name: z.string(),
      decimals: z.number(),
      metadata: z.object({
        logoURI: z.string().optional(),
      }),
    }),
  ),
});
