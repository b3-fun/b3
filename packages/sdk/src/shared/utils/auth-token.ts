import Cookies from "js-cookie";

const B3_AUTH_COOKIE_NAME = "b3-auth";

/**
 * Get the authentication token from the B3 auth cookie
 * This token is managed by the B3 Global Account authentication system
 *
 * @returns The JWT token string or null if not found
 */
export function getAuthToken(): string | null {
  return Cookies.get(B3_AUTH_COOKIE_NAME) || null;
}
