// Re-export from client manager for backwards compatibility
export {
  authenticate, authenticateBoth, authenticateWithClient, getClient as default, getClientByType, getClientType, resetSocket,
  setClientType
} from "./client-manager";

// Ensure socket client is the default for backwards compatibility
import { setClientType } from "./client-manager";
setClientType("socket");
