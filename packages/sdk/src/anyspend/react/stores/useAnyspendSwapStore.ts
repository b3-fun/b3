import { create } from "zustand";
import { components } from "../../../anyspend/types/api";

interface AnyspendSwapStore {
  // Source token state
  selectedSrcChainId: number;
  selectedSrcToken: components["schemas"]["Token"];
  srcAmount: string;
  
  // Destination token state
  selectedDstChainId: number;
  selectedDstToken: components["schemas"]["Token"];
  dstAmount: string;
  
  // Input tracking
  isSrcInputDirty: boolean;
  
  // Onramp amount
  srcAmountOnRamp: string;
  
  // Actions
  setSelectedSrcChainId: (chainId: number) => void;
  setSelectedSrcToken: (token: components["schemas"]["Token"]) => void;
  setSrcAmount: (amount: string) => void;
  
  setSelectedDstChainId: (chainId: number) => void;
  setSelectedDstToken: (token: components["schemas"]["Token"]) => void;
  setDstAmount: (amount: string) => void;
  
  setIsSrcInputDirty: (dirty: boolean) => void;
  setSrcAmountOnRamp: (amount: string) => void;
  
  // Reset
  reset: () => void;
}

export const useAnyspendSwapStore = create<AnyspendSwapStore>((set) => ({
  // Initial state - will be set by component
  selectedSrcChainId: 1,
  selectedSrcToken: {
    symbol: "",
    chainId: 1,
    address: "",
    name: "",
    decimals: 18,
    metadata: {},
  },
  srcAmount: "0.01",
  
  selectedDstChainId: 8453,
  selectedDstToken: {
    symbol: "",
    chainId: 8453,
    address: "",
    name: "",
    decimals: 18,
    metadata: {},
  },
  dstAmount: "",
  
  isSrcInputDirty: true,
  srcAmountOnRamp: "5",
  
  // Actions
  setSelectedSrcChainId: (chainId) => set({ selectedSrcChainId: chainId }),
  setSelectedSrcToken: (token) => set({ selectedSrcToken: token }),
  setSrcAmount: (amount) => set({ srcAmount: amount }),
  
  setSelectedDstChainId: (chainId) => set({ selectedDstChainId: chainId }),
  setSelectedDstToken: (token) => set({ selectedDstToken: token }),
  setDstAmount: (amount) => set({ dstAmount: amount }),
  
  setIsSrcInputDirty: (dirty) => set({ isSrcInputDirty: dirty }),
  setSrcAmountOnRamp: (amount) => set({ srcAmountOnRamp: amount }),
  
  reset: () => set({
    srcAmount: "0.01",
    dstAmount: "",
    isSrcInputDirty: true,
    srcAmountOnRamp: "5",
  }),
}));

