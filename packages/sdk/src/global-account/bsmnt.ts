import { createClient } from "@b3dotfun/basement-api";
import { AuthenticationClient } from "@feathersjs/authentication-client";
import socketio from "@feathersjs/socketio-client";
import Cookies from "js-cookie";
import io from "socket.io-client";

// Also use b3 auth token since we are using b3-jwt strategy
const BSMNT_AUTH_COOKIE_NAME = "b3-auth";

const BSMNT_API_URL =
  process.env.EXPO_PUBLIC_BSMNT_API ||
  process.env.NEXT_PUBLIC_BSMNT_API ||
  process.env.PUBLIC_BSMNT_API ||
  "https://api.basement.fun";

const socket = io(BSMNT_API_URL, { transports: ["websocket"] });

class MyAuthenticationClient extends AuthenticationClient {
  getFromLocation(location: any) {
    // Do custom location things here
    return super.getFromLocation(location);
  }
}

const app = createClient(socketio(socket), {
  Authentication: MyAuthenticationClient,
  jwtStrategy: "b3-jwt",
  storage: {
    getItem: (key: string) => {
      return Cookies.get(key);
    },
    setItem: (key: string, value: string) => {
      Cookies.set(key, value);
    },
    removeItem: (key: string) => {
      Cookies.remove(key);
    }
  },
  storageKey: BSMNT_AUTH_COOKIE_NAME
});

export const authenticate = async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
  const fullToken = `${accessToken}+${identityToken}`;

  // Do not authenticate if there is no token
  if (!fullToken) {
    console.log("No token found, not authenticating");
    return null;
  }

  try {
    const response = await app.authenticate(
      {
        strategy: "b3-jwt",
        accessToken: fullToken
      },
      {
        query: params || {}
      }
    );
    return response;
  } catch (error) {
    return null;
  }
};

export const resetSocket = () => {
  if (socket.connected) socket.disconnect();
  socket.connect();
  // reset the socket connection
};

export default app;
