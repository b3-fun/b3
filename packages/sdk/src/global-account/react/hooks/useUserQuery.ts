import { Users } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

/**
 * NOTE: THIS IS ONLY MEANT FOR INTERNAL USE, from useOnConnect
 *
 * Custom hook to manage user state with react-query
 * This allows for invalidation and refetching of user data
 */
export function useUserQuery() {
  const queryClient = useQueryClient();

  // Query to get user data (primarily from cache/localStorage)
  const { data: user } = useQuery<Users | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: getUserFromStorage,
    staleTime: Infinity, // User data doesn't go stale automatically
    gcTime: Infinity, // Keep in cache indefinitely
    initialData: getUserFromStorage,
  });

  // Mutation to update user
  const setUserMutation = useMutation({
    mutationFn: async (newUser: Users | undefined) => {
      const userToSave = newUser ?? null;
      saveUserToStorage(userToSave);
      return userToSave;
    },
    onSuccess: data => {
      queryClient.setQueryData(USER_QUERY_KEY, data);
      debug("User updated", data);
    },
  });

  // Helper function to set user (maintains backward compatibility)
  const setUser = (newUser?: Users) => {
    setUserMutation.mutate(newUser);
  };

  // Helper function to invalidate and refetch user
  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    return queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
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
