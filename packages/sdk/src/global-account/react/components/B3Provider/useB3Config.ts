import { useContext, useMemo } from "react";
import { B3Context } from "./types";

export const useB3Config = () => {
  const context = useContext(B3Context);

  if (!context) {
    throw new Error("useB3 must be used within a B3Provider");
  }

  const {
    automaticallySetFirstEoa,
    environment,
    theme,
    clientType,
    partnerId,
    createClientReferenceId,
    enableTurnkey,
  } = context;

  // Return a stable reference
  return useMemo(
    () => ({
      automaticallySetFirstEoa,
      environment,
      theme,
      clientType,
      partnerId,
      createClientReferenceId,
      enableTurnkey,
    }),
    [automaticallySetFirstEoa, environment, theme, clientType, partnerId, createClientReferenceId, enableTurnkey],
  );
};
