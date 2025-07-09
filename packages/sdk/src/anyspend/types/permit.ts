import { z } from "zod";

export const zPermit = z.object({
  ownerAddress: z.string(),
  deadline: z.number(),
  v: z.number(),
  r: z.string(),
  s: z.string(),
});
export type Permit = z.infer<typeof zPermit>;
