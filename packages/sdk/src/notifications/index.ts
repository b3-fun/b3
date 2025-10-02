export const VERSION = "1.0.0";

// Export types
export * from "./types";

// Export services
export * from "./services";

// Re-export auth token getter from shared for convenience
// Note: Auth token is managed by B3 Global Account authentication
export { getAuthToken } from "../shared/utils/auth-token";
