import { create } from "zustand";

export interface RecipientOption {
  address: string;
  icon?: string;
  label: string;
  ensName?: string;
}

interface AnyspendRecipientStore {
  recipientAddress: string | undefined;
  customRecipients: RecipientOption[];
  
  setRecipientAddress: (address: string | undefined) => void;
  setCustomRecipients: (recipients: RecipientOption[]) => void;
  addCustomRecipient: (recipient: RecipientOption) => void;
  
  reset: () => void;
}

export const useAnyspendRecipientStore = create<AnyspendRecipientStore>((set) => ({
  recipientAddress: undefined,
  customRecipients: [],
  
  setRecipientAddress: (address) => set({ recipientAddress: address }),
  setCustomRecipients: (recipients) => set({ customRecipients: recipients }),
  addCustomRecipient: (recipient) => set((state) => ({
    customRecipients: [...state.customRecipients, recipient],
  })),
  
  reset: () => set({
    recipientAddress: undefined,
    customRecipients: [],
  }),
}));

