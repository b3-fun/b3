import { ENS_GATEWAY_URL } from "@b3dotfun/sdk/shared/constants";
import { useMemo } from "react";

export const useB3EnsName = () => {
  const registerEns = async (name: `${string}.b3.fun`, address: string, hash: string) : Promise<Response> => {
    const message = `Register ${name}`;
    const response = await fetch(ENS_GATEWAY_URL + "set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        owner: address.toLowerCase(),
        addresses: { "60": address.toLowerCase() },
        signature: {
          message: message,
          hash: hash
        }
      })
    });
    return response;
  };

  const getEns = async (address: string) => {
    const response = await fetch(`${ENS_GATEWAY_URL}address/${address}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ENS name: ${response.statusText}`);
    }

    const data = await response.json();
    return data as { name: string };
  };

  return useMemo(
    () => ({
      registerEns,
      getEns
    }),
    []
  );
};
