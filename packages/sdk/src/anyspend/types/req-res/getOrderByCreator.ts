import { z } from "zod";

export const zGetOrdersByCreatorRequest = z.object({
  query: z.object({
    creatorAddress: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});
