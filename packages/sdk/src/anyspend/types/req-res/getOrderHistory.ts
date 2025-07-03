import { z } from "zod";
import { zOrder } from "../order";

export const zGetOrderHistoryResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(zOrder),
  statusCode: z.number()
});
