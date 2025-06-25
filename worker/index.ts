export { AppDO } from "./app";
import { env } from "cloudflare:workers";

const DO_ID = env.APP.idFromName("singleton");

export default {
  fetch(request) {
    return env.APP.get(DO_ID).fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  },
} satisfies ExportedHandler<Env>;
