import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentAddress {
  address: string;
  timestamp: number;
}

interface RecentAddressesStore {
  recentAddresses: RecentAddress[];
  addRecentAddress: (address: string) => void;
  clearRecentAddresses: () => void;
}

/**
 * Store for managing recently used addresses in the Send flow
 * Persists to localStorage and keeps the last 6 unique addresses
 */
export const useRecentAddressesStore = create<RecentAddressesStore>()(
  persist(
    set => ({
      recentAddresses: [],

      /**
       * Add a new address to the recent addresses list
       * Deduplicates and maintains a maximum of 6 addresses
       */
      addRecentAddress: (address: string) => {
        set(state => {
          // Remove any existing entry with the same address
          const filtered = state.recentAddresses.filter(item => item.address.toLowerCase() !== address.toLowerCase());

          // Add the new address at the beginning
          const updated = [{ address, timestamp: Date.now() }, ...filtered];

          // Keep only the last 6 addresses
          return {
            recentAddresses: updated.slice(0, 6),
          };
        });
      },

      /**
       * Clear all recent addresses
       */
      clearRecentAddresses: () => {
        set({ recentAddresses: [] });
      },
    }),
    {
      name: "b3-recent-addresses-storage",
    },
  ),
);

