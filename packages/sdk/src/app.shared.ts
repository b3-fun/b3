import { ClientApplication } from "@b3dotfun/b3-api";
import { AuthenticationClient } from "@feathersjs/authentication-client";
import Cookies from "js-cookie";
import { B3_AUTH_COOKIE_NAME } from "./shared/constants";

export const B3_API_URL =
  process.env.EXPO_PUBLIC_B3_API || process.env.NEXT_PUBLIC_B3_API || process.env.PUBLIC_B3_API || "https://api.b3.fun";

const DEV_USER_GROUP = 4;

export const authenticate = async (
  app: ClientApplication,
  accessToken: string,
  identityToken: string,
  params?: Record<string, any>,
) => {
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
        accessToken: fullToken,
      },
      {
        query: params || {},
      },
    );

    // Extend cookie expiration to 30 days for dev users
    if (response?.user?.userGroups?.includes(DEV_USER_GROUP)) {
      const token = Cookies.get(B3_AUTH_COOKIE_NAME);
      if (token) {
        Cookies.set(B3_AUTH_COOKIE_NAME, token, { expires: 30 });
      }
    }

    return response;
  } catch (error) {
    return null;
  }
};

export class MyAuthenticationClient extends AuthenticationClient {
  getFromLocation(location: any) {
    // Do custom location things here
    return super.getFromLocation(location);
  }
}

export const clientOptions = {
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
    },
  },
  storageKey: B3_AUTH_COOKIE_NAME,
};
