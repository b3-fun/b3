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
  onSuccess?: (account: any) => void;
  onError?: (error: Error) => void;
  setB3ModalOpen: (isOpen: boolean) => void;
  setStep: (step: "login" | "permissions") => void;
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
}

export const useAuthStore = create<AuthState>(set => ({
  isOpen: false,
  step: "login",
  provider: undefined,
  accessToken: undefined,
  chain: undefined,
  isAuthenticating: false,
  isAuthenticated: false,
  onSuccess: undefined,
  onError: undefined,
  setB3ModalOpen: isOpen => set({ isOpen }),
  setStep: step => set({ step }),
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
}));
