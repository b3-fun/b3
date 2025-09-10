import type { ClientApplication } from "@b3dotfun/b3-api";
import { authenticate, getClient, getClientByType, setClientType } from "./client-manager";

// Default to rest
setClientType("rest");

// Default export that *looks like* a Feathers app and auto-forwards
const app = new Proxy({} as ClientApplication, {
  get(_t, prop, receiver) {
    const target = getClient() as any;
    return Reflect.get(target, prop, receiver);
  },
  set(_t, prop, value) {
    const target = getClient() as any;
    return Reflect.set(target, prop, value);
  },
}) as ClientApplication;

export default app;

// Power-user helpers (named exports)
export { authenticate, getClient, getClientByType, setClientType };
