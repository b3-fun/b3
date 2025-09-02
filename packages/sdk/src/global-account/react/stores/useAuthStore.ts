import type { Chain } from "thirdweb";
import { create } from "zustand";

interface AuthState {
  isOpen: boolean;
  step: "login" | "permissions";
  provider?: string;
  accessToken?: string;
  chain?: Chain;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  onSuccess?: (account: any) => void;
  onError?: (error: Error) => void;
  setB3ModalOpen: (isOpen: boolean) => void;
  setStep: (step: "login" | "permissions") => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsAuthenticating: (isAuthenticating: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  startAuth: (params: {
    provider: string;
    accessToken?: string;
    chain?: Chain;
    onSuccess?: (account: any) => void;
    onError?: (error: Error) => void;
  }) => void;
  reset: () => void;
  isAuthenticatingV2: boolean;
  setIsAuthenticatingV2: (isAuthenticating: boolean) => void;
  isAuthenticatedV2: boolean;
  setIsAuthenticatedV2: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  isOpen: false,
  step: "login",
  provider: undefined,
  accessToken: undefined,
  chain: undefined,
  isAuthenticating: false,
  isAuthenticated: false,
  isConnecting: false,
  isConnected: false,
  onSuccess: undefined,
  onError: undefined,
  setB3ModalOpen: isOpen => set({ isOpen }),
  setStep: step => set({ step }),
  setIsConnecting: isConnecting => set({ isConnecting }),
  setIsConnected: isConnected => set({ isConnected }),
  setIsAuthenticating: isAuthenticating => set({ isAuthenticating }),
  setIsAuthenticated: isAuthenticated => set({ isAuthenticated }),
  startAuth: params =>
    set({
      isOpen: true,
      step: params.accessToken ? "permissions" : "login",
      provider: params.provider,
      accessToken: params.accessToken,
      chain: params.chain,
      onSuccess: params.onSuccess,
      onError: params.onError,
    }),
  reset: () =>
    set({
      isOpen: false,
      step: "login",
      provider: undefined,
      accessToken: undefined,
      chain: undefined,
      isAuthenticating: false,
      isAuthenticated: false,
      onSuccess: undefined,
      onError: undefined,
    }),
  isAuthenticatingV2: true,
  setIsAuthenticatingV2: isAuthenticating => set({ isAuthenticatingV2: isAuthenticating }),
  isAuthenticatedV2: false,
  setIsAuthenticatedV2: isAuthenticated => set({ isAuthenticatedV2: isAuthenticated }),
}));
