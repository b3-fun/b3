import { useB3ConfigStore } from "../../stores/configStore";

/**
 * Hook to access B3 configuration
 * Returns all config values from the Zustand store
 * Since config is static (set once at initialization), destructuring is fine here
 */
export const useB3Config = () => {
  return useB3ConfigStore(state => ({
    automaticallySetFirstEoa: state.automaticallySetFirstEoa,
    environment: state.environment,
    theme: state.theme,
    clientType: state.clientType,
    partnerId: state.partnerId,
    createClientReferenceId: state.createClientReferenceId,
    enableTurnkey: state.enableTurnkey,
    stripePublishableKey: state.stripePublishableKey,
    defaultPermissions: state.defaultPermissions,
    accountOverride: state.accountOverride,
  }));
};

