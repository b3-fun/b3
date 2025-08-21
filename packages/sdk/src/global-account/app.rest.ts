import { createClient } from "@b3dotfun/b3-api";
import rest from "@feathersjs/rest-client";
import { authenticate as authenticateB3, B3_API_URL, clientOptions } from "../app.shared";

const connection = rest(B3_API_URL).fetch(window.fetch.bind(window));

const app = createClient(connection, clientOptions);

export const authenticate = async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
  return authenticateB3(app, accessToken, identityToken, params);
};

export default app;
