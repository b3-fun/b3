import { CLIENT_APP_BUNDLE_ID, THIRDWEB_CLIENT_ID, THIRDWEB_SECRET_KEY } from "@b3dotfun/sdk/shared/constants";
import { client } from "./generated/client.gen";

(function () {
  // Set BASE URL
  client.setConfig({
    baseUrl: "https://insight.thirdweb.com",
  });

  // Interceptors for issues described here https://npc-labs.slack.com/archives/C070E6HNG85/p1742446793549779?thread_ts=1741637902.666019&cid=C070E6HNG85
  client.interceptors.request.use((request, options) => {
    const headers = new Headers(request.headers);
    headers.set("X-Client-Id", THIRDWEB_CLIENT_ID);
    headers.set("x-secret-key", THIRDWEB_SECRET_KEY);
    headers.set("x-bundle-id", CLIENT_APP_BUNDLE_ID);

    let newUrl = request.url;

    if (options.path) {
      for (const key in options.path) {
        newUrl = newUrl.replace(`:${key}`, options.path[key] as string);
      }
    }

    return new Request(newUrl, {
      ...request,
      headers,
    });
  });
})();
