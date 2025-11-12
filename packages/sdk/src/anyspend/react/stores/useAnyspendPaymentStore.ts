import { create } from "zustand";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { FiatPaymentMethod } from "../components/common/FiatPaymentMethod";

interface AnyspendPaymentStore {
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  selectedFiatPaymentMethod: FiatPaymentMethod;
  
  setSelectedCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  setSelectedFiatPaymentMethod: (method: FiatPaymentMethod) => void;
  
  reset: () => void;
}

export const useAnyspendPaymentStore = create<AnyspendPaymentStore>((set) => ({
  selectedCryptoPaymentMethod: CryptoPaymentMethodType.NONE,
  selectedFiatPaymentMethod: FiatPaymentMethod.NONE,
  
  setSelectedCryptoPaymentMethod: (method) => set({ selectedCryptoPaymentMethod: method }),
  setSelectedFiatPaymentMethod: (method) => set({ selectedFiatPaymentMethod: method }),
  
  reset: () => set({
    selectedCryptoPaymentMethod: CryptoPaymentMethodType.NONE,
    selectedFiatPaymentMethod: FiatPaymentMethod.NONE,
  }),
}));

