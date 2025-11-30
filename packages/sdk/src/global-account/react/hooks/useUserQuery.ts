import { Users } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useRef, useState } from "react";

const debug = debugB3React("useUserQuery");

const USER_QUERY_KEY = ["b3-user"];

/**
 * Retrieves the user from localStorage
 */
function getUserFromStorage(): Users | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("b3-user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.warn("Failed to restore user from localStorage:", error);
    return null;
  }
}

/**
 * Saves user to localStorage
 */
function saveUserToStorage(user: Users | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    localStorage.setItem("b3-user", JSON.stringify(user));
  } else {
    localStorage.removeItem("b3-user");
  }
}

// Event emitter for cross-component synchronization
const userUpdateListeners = new Set<() => void>();

function notifyUserUpdate() {
  userUpdateListeners.forEach(listener => listener());
}

/**
 * NOTE: THIS IS ONLY MEANT FOR INTERNAL USE, from useOnConnect
 *
 * Custom hook to manage user state with plain React
 * This allows for invalidation and refetching of user data
 */
export function useUserQuery() {
  const [user, setUserState] = useState<Users | undefined>(() => {
    const storedUser = getUserFromStorage();
    return storedUser ?? undefined;
  });

  const listenerRef = useRef<(() => void) | undefined>(undefined);

  // Sync with localStorage changes from other components
  useEffect(() => {
    listenerRef.current = () => {
      const storedUser = getUserFromStorage();
      setUserState(storedUser ?? undefined);
    };

    userUpdateListeners.add(listenerRef.current);

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "b3-user") {
        listenerRef.current?.();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (listenerRef.current) {
        userUpdateListeners.delete(listenerRef.current);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Helper function to set user
  const setUser = (newUser?: Users) => {
    const userToSave = newUser ?? null;
    saveUserToStorage(userToSave);
    setUserState(newUser ?? undefined);
    notifyUserUpdate();
    debug("User updated", userToSave);
  };

  // Helper function to invalidate and refetch user
  const refetchUser = async () => {
    const storedUser = getUserFromStorage();
    setUserState(storedUser ?? undefined);
    return Promise.resolve(storedUser ?? undefined);
  };

  // Helper function to clear user
  const clearUser = () => {
    setUser(undefined);
  };

  return {
    user: user ?? undefined,
    setUser,
    refetchUser,
    clearUser,
    queryKey: USER_QUERY_KEY,
  };
}
