import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useState } from "react";

/**
 * Custom hook to get B3 JWT from SDK authentication
 *
 * Benefits over manual cookie reading:
 * - ✅ Reactive to auth state changes (login/logout)
 * - ✅ Uses SDK's internal auth management
 * - ✅ Automatically handles token refresh
 * - ✅ Type-safe
 *
 * @returns JWT string or undefined if not authenticated
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const jwt = useB3JWT();
 *
 *   const sendToOtherServer = async () => {
 *     if (!jwt) return;
 *
 *     await fetch("https://your-server.com/api", {
 *       headers: { Authorization: `Bearer ${jwt}` }
 *     });
 *   };
 *
 *   return <button onClick={sendToOtherServer}>Send</button>;
 * }
 * ```
 */
export function useB3JWT() {
  const [jwt, setJwt] = useState<string | undefined>();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    const getJWT = async () => {
      if (!isAuthenticated) {
        setJwt(undefined);
        return;
      }

      try {
        // Try to get JWT from reAuthenticate (reads from cookie)
        const authResult = await app.reAuthenticate();
        setJwt(authResult.accessToken);
      } catch (error) {
        console.warn("Failed to get JWT:", error);
        setJwt(undefined);
      }
    };

    getJWT();
  }, [isAuthenticated]); // Re-run when auth state changes

  return jwt;
}
