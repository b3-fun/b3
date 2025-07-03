import { z } from "zod";

export const zGlobalWallet = z.object({
  chain: z.number(),
  encryptedPrvkey: z.string(),
  address: z.string(),
  orderId: z.string().nullable()
});
export type GlobalWallet = z.infer<typeof zGlobalWallet>;
