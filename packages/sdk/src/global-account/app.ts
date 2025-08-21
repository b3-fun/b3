import { createClient } from "@b3dotfun/b3-api";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";
import { authenticate as authenticateB3, B3_API_URL, clientOptions } from "../app.shared";

const socket = io(B3_API_URL, { transports: ["websocket"] });

const app = createClient(socketio(socket), clientOptions);

export const authenticate = async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
  return authenticateB3(app, accessToken, identityToken, params);
};

export const resetSocket = () => {
  if (socket.connected) socket.disconnect();
  socket.connect();
  // reset the socket connection
};

export default app;
