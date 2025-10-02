import { create } from "zustand";

interface CurrencyModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useCurrencyModalStore = create<CurrencyModalState>(set => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
