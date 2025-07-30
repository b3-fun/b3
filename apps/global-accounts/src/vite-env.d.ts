/// <reference types="vite/client" />

declare global {
  var process: {
    env: Record<string, string>;
  };
}
