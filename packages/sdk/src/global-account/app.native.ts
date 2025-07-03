import { createClient } from "@b3dotfun/b3-api";
import { AuthenticationClient } from "@feathersjs/authentication-client";
import socketio from "@feathersjs/socketio-client";
import { MMKV } from "react-native-mmkv";
import io from "socket.io-client";

const B3_AUTH_COOKIE_NAME = "b3-auth";

const B3_API_URL =
  process.env.EXPO_PUBLIC_B3_API || process.env.NEXT_PUBLIC_B3_API || process.env.PUBLIC_B3_API || "https://api.b3.fun";

// React Native compatible store
export const localStoreInstance = new MMKV();

class LocalStorage {
  setItem(key: string, value: string | number | boolean) {
    localStoreInstance.set(`${key}`, value);
  }

  getString(key: string): string | undefined {
    return localStoreInstance.getString(`${key}`);
  }

  getNumber(key: string): number | undefined {
    return localStoreInstance.getNumber(`${key}`);
  }

  getBoolean(key: string): boolean | undefined {
    return localStoreInstance.getBoolean(`${key}`);
  }

  deleteItem(key: string) {
    localStoreInstance.delete(`${key}`);
  }

  deleteAll(keys: Array<string>) {
    keys?.forEach(key => this.deleteItem(key));
  }

  clear() {
    localStoreInstance.clearAll();
  }

  /**
   * Get all keys
   */
  getAllItem(): Array<string> {
    return localStoreInstance.getAllKeys();
  }
}

const localStorage = new LocalStorage();

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
      return localStorage.getString(key);
    },
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
      localStorage.deleteItem(key);
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

export default app;
