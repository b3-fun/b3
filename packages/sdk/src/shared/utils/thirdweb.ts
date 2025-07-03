import { createThirdwebClient } from "thirdweb";
import { THIRDWEB_CLIENT_ID, THIRDWEB_SECRET_KEY } from "../constants";

const clientId = THIRDWEB_CLIENT_ID;
const secretKey = THIRDWEB_SECRET_KEY;

if (!clientId && !secretKey) {
  throw new Error("Either NEXT_PUBLIC_THIRDWEB_CLIENT_ID or THIRDWEB_SECRET_KEY must be provided");
}

export const client = createThirdwebClient({ clientId, secretKey });
