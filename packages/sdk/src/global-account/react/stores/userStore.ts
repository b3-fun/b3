import { Users } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const debug = debugB3React("useUserQuery");

const USER_QUERY_KEY = ["b3-user"];

interface UserStore {
  user: Users | null;
  setUser: (user: Users | undefined) => void;
  clearUser: () => void;
}

/**
 * Zustand store for managing user state
 * Persists user data to localStorage
 */
export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      user: null,
      setUser: (newUser: Users | undefined) => {
        const userToSave = newUser ?? null;
        set({ user: userToSave });
        debug("User updated", userToSave);
      },
      clearUser: () => {
        set({ user: null });
        debug("User cleared");
      },
    }),
    {
      name: "b3-user",
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          console.warn("Failed to rehydrate user store:", error);
        }
      },
    },
  ),
);
