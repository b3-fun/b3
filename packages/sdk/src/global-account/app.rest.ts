// Re-export from client manager for explicit REST client access
export {
  authenticateWithClient as authenticate,
  getClientByType as default,
  getClientByType,
  getClientType,
  setClientType,
} from "./client-manager";

// Helper to get REST client specifically
import { getClientByType } from "./client-manager";
export const getRestClient = () => getClientByType("rest");
