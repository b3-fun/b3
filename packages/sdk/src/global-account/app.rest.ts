import { getClientByType } from "./client-manager";

export { authenticateWithClient, getClientByType, getClientType, setClientType } from "./client-manager";
export const getRestClient = () => getClientByType("rest");
