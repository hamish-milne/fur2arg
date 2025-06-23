import { env } from "cloudflare:workers";
import { app, type Handler } from "./app";
import { parse, serialize } from "cookie";

interface ClientEntry {
  code: string;
  authorized: "admin" | `room-${string}`;
}

function getDO() {
  return env.GAME.get(env.GAME.idFromName("game"));
}

function getToken(request: Request) {
  const { client_id } = parse(request.headers.get("Cookie") || "");
  return client_id;
}

export async function auth(
  scope: "admin" | "room",
  request: Request,
  handler: Handler,
): Promise<Response> {
  const client_id = getToken(request);
  const clientAuth = client_id
    ? await getDO().getClientAuth(client_id)
    : undefined;

  if (clientAuth && "authorized" in clientAuth) {
    if (scope === "admin" && clientAuth.authorized !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(request, {});
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

app.get("/api/register-client", async (request) => {
  const state = await getDO().registerClient(getToken(request));
  if ("authorized" in state) {
    return Response.json(state);
  }
  return Response.json(
    {
      code: state.code,
    },
    {
      headers:
        "token" in state
          ? {
              "Set-Cookie": serialize("client_id", state.token, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
              }),
            }
          : undefined,
    },
  );
});

app.post("/api/admin/provision-client", (request) =>
  auth("admin", request, async (req) => {
    const body = await req.json();
    const { code, authorized } = body as ClientEntry;
    await getDO().provisionClient(code, authorized);
    return Response.json({ success: true });
  }),
);
