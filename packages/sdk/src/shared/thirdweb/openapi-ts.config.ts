import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./insight-service.json",
  output: "./src/thirdweb/generated",
  plugins: ["@hey-api/client-fetch", "@tanstack/react-query"] // Using fetch client as an example
});
