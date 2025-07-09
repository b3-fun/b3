import { z } from "zod";
import { zPermit } from "../permit";

export const zSendPermitDataRequest = z.object({
  body: z.object({
    orderId: z.string(),
    permitData: zPermit,
  }),
});
export type SendPermitDataRequestBody = z.infer<typeof zSendPermitDataRequest.shape.body>;
