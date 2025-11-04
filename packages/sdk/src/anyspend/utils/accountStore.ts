import type { Wallet } from "thirdweb/wallets";
import { create } from "zustand";

interface GlobalWalletState {
  globalAccountWallet?: Wallet;
  setGlobalAccountWallet: (account?: Wallet) => void;
}

export const useGlobalWalletState = create<GlobalWalletState>(set => ({
  globalAccountWallet: undefined,
  setGlobalAccountWallet: account => set({ globalAccountWallet: account }),
}));
