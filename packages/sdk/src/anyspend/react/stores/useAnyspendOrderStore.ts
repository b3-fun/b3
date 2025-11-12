import { create } from "zustand";

interface AnyspendOrderStore {
  orderId: string | undefined;
  
  setOrderId: (id: string | undefined) => void;
  clearOrder: () => void;
}

export const useAnyspendOrderStore = create<AnyspendOrderStore>((set) => ({
  orderId: undefined,
  
  setOrderId: (id) => set({ orderId: id }),
  clearOrder: () => set({ orderId: undefined }),
}));

