import { Users } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect } from "react";
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
const useUserStore = create<UserStore>()(
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

/**
 * NOTE: THIS IS ONLY MEANT FOR INTERNAL USE, from useOnConnect
 *
 * Hook to query and manage user data
 * Provides user state and methods to update it
 * Uses Zustand store with persistence to localStorage
 */
export function useUserQuery() {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const clearUser = useUserStore(state => state.clearUser);

  useEffect(() => {
    if (user) {
      debug("User loaded from store", user);
    }
  }, [user]);

  return {
    user,
    setUser,
    clearUser,
  };
}

export { USER_QUERY_KEY };
