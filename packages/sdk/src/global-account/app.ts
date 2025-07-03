import { createClient } from "@b3dotfun/b3-api";
import { AuthenticationClient } from "@feathersjs/authentication-client";
import socketio from "@feathersjs/socketio-client";
import Cookies from "js-cookie";
import io from "socket.io-client";
import { B3_AUTH_COOKIE_NAME } from "../shared/constants";

const B3_API_URL =
  process.env.EXPO_PUBLIC_B3_API || process.env.NEXT_PUBLIC_B3_API || process.env.PUBLIC_B3_API || "https://api.b3.fun";

const socket = io(B3_API_URL);

class MyAuthenticationClient extends AuthenticationClient {
  getFromLocation(location: any) {
    // Do custom location things here
    return super.getFromLocation(location);
  }
}

const app = createClient(socketio(socket), {
  Authentication: MyAuthenticationClient,
  jwtStrategy: "jwt",
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
  storageKey: B3_AUTH_COOKIE_NAME
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
        strategy: "jwt",
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
