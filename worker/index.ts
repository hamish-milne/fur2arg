export { Game } from "./game";
import type { Method } from "tiny-request-router";
import { app } from "./app";
import "./client-auth";

export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    const match = app.match(request.method as Method, pathname);
    if (match) {
      const { handler, params } = match;
      return handler(request, params);
    }
    return Response.json({ error: "Not Found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
