import bsmntApp from "@b3dotfun/sdk/global-account/bsmnt";
import { B3_AUTH_COOKIE_NAME } from "@b3dotfun/sdk/shared/constants";
import Cookies from "js-cookie";

import { useCallback, useMemo } from "react";

export const useB3EnsName = () => {
  const registerEns = useCallback(
    async (username: string, message: string, hash: string) => {
      if (!bsmntApp.authentication.authenticated) {
        await bsmntApp.authentication.authenticate({
          strategy: "b3-jwt",
          accessToken: Cookies.get(B3_AUTH_COOKIE_NAME) || ""
        });
      }

      const response = await bsmntApp.service("profiles").registerUsername(
        {
          username,
          message,
          hash
        },
        {}
      );

      return response;
    },
    [bsmntApp.authentication.authenticated]
  );

  const getEns = useCallback(async (address: string) => {
    const response = await fetch(`https://ens-gateway.b3.fun/address/${address}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ENS name: ${response.statusText}`);
    }

    const data = await response.json();
    return data as { name: string };
  }, []);

  return useMemo(
    () => ({
      registerEns,
      getEns
    }),
    [registerEns, getEns]
  );
};
