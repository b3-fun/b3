import { ClientApplication, createClient } from "@b3dotfun/b3-api";
import rest from "@feathersjs/rest-client";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";
import { authenticate as authenticateB3, B3_API_URL, clientOptions } from "../app.shared";

export type ClientType = "socket" | "rest";

// Global state to track which client type is active
let currentClientType: ClientType = "socket";
let currentClient: ClientApplication | null = null;

// Socket client instance
let socketClient: ClientApplication | null = null;
let socketInstance: any = null;

// REST client instance  
let restClient: ClientApplication | null = null;

/**
 * Creates a socket client
 */
function createSocketClient(): ClientApplication {
  if (!socketClient) {
    socketInstance = io(B3_API_URL, { transports: ["websocket"] });
    socketClient = createClient(socketio(socketInstance), clientOptions);
  }
  return socketClient;
}

/**
 * Creates a REST client
 */
function createRestClient(): ClientApplication {
  if (!restClient) {
    const connection = rest(B3_API_URL).fetch(window.fetch.bind(window));
    restClient = createClient(connection, clientOptions);
  }
  return restClient;
}

/**
 * Sets the active client type and creates the appropriate client
 */
export function setClientType(clientType: ClientType): void {
  if (currentClientType === clientType && currentClient) {
    return; // Already set to the correct type
  }

  currentClientType = clientType;
  
  if (clientType === "socket") {
    currentClient = createSocketClient();
  } else {
    currentClient = createRestClient();
  }
}

/**
 * Gets the current active client
 */
export function getClient(): ClientApplication {
  if (!currentClient) {
    setClientType(currentClientType);
  }
  return currentClient!;
}

/**
 * Gets the current client type
 */
export function getClientType(): ClientType {
  return currentClientType;
}

/**
 * Gets a specific client type (useful for parallel operations)
 */
export function getClientByType(clientType: ClientType): ClientApplication {
  if (clientType === "socket") {
    return createSocketClient();
  } else {
    return createRestClient();
  }
}

/**
 * Resets the socket connection (only applicable for socket client)
 */
export function resetSocket(): void {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
    socketInstance.connect();
  }
}

/**
 * Authenticates with the current active client
 */
export const authenticate = async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
  return authenticateB3(getClient(), accessToken, identityToken, params);
};

/**
 * Authenticates with a specific client type
 */
export const authenticateWithClient = async (
  clientType: ClientType, 
  accessToken: string, 
  identityToken: string, 
  params?: Record<string, any>
) => {
  const client = getClientByType(clientType);
  return authenticateB3(client, accessToken, identityToken, params);
};

/**
 * Authenticates with both clients in parallel (useful for migration scenarios)
 */
export const authenticateBoth = async (accessToken: string, identityToken: string, params?: Record<string, any>) => {
  const [socketResult, restResult] = await Promise.allSettled([
    authenticateWithClient("socket", accessToken, identityToken, params),
    authenticateWithClient("rest", accessToken, identityToken, params)
  ]);
  
  return {
    socket: socketResult.status === "fulfilled" ? socketResult.value : null,
    rest: restResult.status === "fulfilled" ? restResult.value : null,
    success: socketResult.status === "fulfilled" || restResult.status === "fulfilled"
  };
};

