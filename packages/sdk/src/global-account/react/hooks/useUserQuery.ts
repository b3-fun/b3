import { Users } from "@b3dotfun/b3-api";
import { useEffect, useLayoutEffect } from "react";
import { useUserStore } from "../stores/userStore";

const USER_QUERY_KEY = ["b3-user"];

/**
 * NOTE: THIS IS ONLY MEANT FOR INTERNAL USE, from useOnConnect
 *
 * Custom hook to manage user state with Zustand
 * This allows for invalidation and refetching of user data
 */
export function useUserQuery() {
  const user = useUserStore(state => state.user);
  const setUserStore = useUserStore(state => state.setUser);
  const clearUserStore = useUserStore(state => state.clearUser);

  // Manually rehydrate persisted store inside useLayoutEffect to avoid
  // updating AuthenticationProvider state during Hydrate render.
  // useLayoutEffect (not useEffect) ensures rehydration triggers a
  // synchronous re-render before any useEffect callbacks fire, so
  // downstream effects always see the persisted user value.
  useLayoutEffect(() => {
    if (!useUserStore.persist.hasHydrated()) {
      useUserStore.persist.rehydrate();
    }
  }, []);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "b3-user") {
        // Sync with changes from other tabs/windows
        const stored = e.newValue;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Zustand persist format: { state: { user: ... }, version: ... }
            const userData = parsed?.state?.user ?? parsed?.user ?? null;
            useUserStore.setState({ user: userData });
          } catch (error) {
            console.warn("Failed to parse user from storage event:", error);
          }
        } else {
          useUserStore.setState({ user: null });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Helper function to set user (maintains backward compatibility)
  const setUser = (newUser?: Users) => {
    setUserStore(newUser);
  };

  // Helper function to invalidate and refetch user
  const refetchUser = async () => {
    // Re-read from localStorage and update store
    // Zustand persist stores data as { state: { user: ... }, version: ... }
    const stored = localStorage.getItem("b3-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Zustand persist format: { state: { user: ... }, version: ... }
        const userData = parsed?.state?.user ?? parsed?.user ?? null;
        useUserStore.setState({ user: userData });
        return userData ?? undefined;
      } catch (error) {
        console.warn("Failed to refetch user from localStorage:", error);
        // Fallback to current store state
        return useUserStore.getState().user ?? undefined;
      }
    }
    useUserStore.setState({ user: null });
    return undefined;
  };

  // Helper function to clear user
  const clearUser = () => {
    clearUserStore();
  };

  return {
    user: user ?? undefined,
    setUser,
    refetchUser,
    clearUser,
    queryKey: USER_QUERY_KEY,
  };
}
