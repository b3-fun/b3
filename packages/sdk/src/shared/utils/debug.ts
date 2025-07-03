import createDebug from "debug";

createDebug.formatters.h = v => {
  return v.toString("hex");
};

export const debug = createDebug("@@b3dotfun/sdk");
let debugMakers: Record<string, any> = {};

export const debugB3React = (name: string) => {
  if (!debugMakers[name]) {
    debugMakers[name] = debug.extend(name);
  }
  return debugMakers[name];
};

export default debug;
