import { useB3 } from "@b3dotfun/sdk/global-account/react";
import { useCallback } from "react";
import {
  ClientType,
  authenticateBoth,
  authenticateWithClient,
  getClient,
  getClientByType,
  setClientType,
} from "../../client-manager";

/**
 * Hook to access the current FeathersJS client and client management utilities
 */
export function useClient() {
  const { clientType } = useB3();

  const getCurrentClient = useCallback(() => {
    return getClient();
  }, []);

  const getClientByTypeCallback = useCallback((type: ClientType) => {
    return getClientByType(type);
  }, []);

  const switchClientType = useCallback((type: ClientType) => {
    setClientType(type);
  }, []);

  const authenticateWithType = useCallback(
    async (type: ClientType, accessToken: string, identityToken: string, params?: Record<string, any>) => {
      return authenticateWithClient(type, accessToken, identityToken, params);
    },
    [],
  );

  const authenticateWithBoth = useCallback(
    async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
      return authenticateBoth(accessToken, identityToken, params);
    },
    [],
  );

  return {
    // Current client info
    clientType,
    getCurrentClient,

    // Client management
    getClientByType: getClientByTypeCallback,
    switchClientType,

    // Authentication utilities
    authenticateWithType,
    authenticateWithBoth,
  };
}
