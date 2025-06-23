import { Hono, type Context, type Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Client, Player } from "../common/api";
import { validator } from "hono/validator";

declare module "hono" {
  interface ContextVariableMap {
    sql: SqlStorage;
    // id: string;
  }
}

const uuidPattern =
  /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/;

const idPattern = /^[A-Z]{4}$/;

function initSql(sql: SqlStorage) {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      token TEXT PRIMARY KEY CHECK (token REGGEXP '${uuidPattern.source}'),
      id TEXT NOT NULL UNIQUE CHECK (id REGEXP '${idPattern.source}'),
      scope TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastModified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK
    ) STRICT, WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY CHECK (id REGEXP '${uuidPattern.source}'),
      state BLOB,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastModified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT, WITHOUT ROWID;
    `);
}

function getClient(c: Context, token: string | undefined) {
  if (!token || !uuidPattern.test(token)) {
    return undefined;
  }
  const cursor = c
    .get("sql")
    .exec<Pick<Client, "id" | "scope">>(
      "SELECT id, scope FROM clients WHERE token = ?1",
      token,
    );
  if (cursor.rowsRead === 0) {
    return undefined;
  }
  return cursor.one();
}

function getCurrentScope(c: Context) {
  const token = getCookie(c, "token");
  if (!token) {
    return;
  }
  const state = getClient(c, token);
  return state?.scope;
}

async function verifyAdmin(c: Context, next: Next) {
  const scope = getCurrentScope(c);
  if (scope !== "admin") {
    return c.json({ error: "Unauthorized" }, { status: 403 });
  }
  return next();
}

async function verifyClient(c: Context, next: Next) {
  const scope = getCurrentScope(c);
  if (!scope) {
    return c.json({ error: "Unauthorized" }, { status: 403 });
  }
  return next();
}

function generateClientId(): string {
  const arr = crypto.getRandomValues(new Uint8Array(4));
  const offset = 65; // ASCII 'A'
  return String.fromCharCode(...arr.map((x) => (x % 26) + offset));
}

const clientIdValidator = validator("param", (input, c) => {
  const { id } = input;
  if (!idPattern.test(id)) {
    return c.json({ error: "Invalid client ID" }, { status: 400 });
  }
  return id;
});

const playerIdValidator = validator("param", (input, c) => {
  const { id } = input;
  if (!uuidPattern.test(id)) {
    return c.json({ error: "Invalid player ID" }, { status: 400 });
  }
  return id;
});

const playerBodyValidator = validator("json", (x: Pick<Player, "state">, c) => {
  if (!x.state || typeof x.state !== "object") {
    return c.json({ error: "Invalid player state" }, { status: 400 });
  }
  return x;
});

const clientBodyValidator = validator("json", (x: Pick<Client, "scope">, c) => {
  if (!x.scope || typeof x.scope !== "string") {
    return c.json({ error: "Invalid client scope" }, { status: 400 });
  }
  if (x.scope !== "admin" && !x.scope.startsWith("room-")) {
    return c.json({ error: "Invalid client scope" }, { status: 400 });
  }
  return x;
});

const app = new Hono()
  .basePath("/api")
  .use("/client/:id", verifyAdmin)
  .use("/players/:id", verifyClient)
  .get("/clients/all", verifyAdmin, (c) => {
    const data = c
      .get("sql")
      .exec<Pick<Client, keyof Client>>(
        "SELECT id, scope, createdAt, lastModified FROM clients ORDER BY createdAt DESC",
      )
      .toArray();
    return c.json({ data });
  })
  .get("/clients/me", async (c) => {
    let token = getCookie(c, "token");
    const client = getClient(c, token);
    if (client) {
      return c.json({ data: client });
    }
    if (!token || !uuidPattern.test(token)) {
      token = crypto.randomUUID();
      setCookie(c, "token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
    }
    for (let i = 0; i < 1000; i++) {
      const id = generateClientId();
      const { rowsWritten } = c
        .get("sql")
        .exec("INSERT INTO clients (token, id) VALUES (?1, ?2)", token, id);
      if (rowsWritten > 0) {
        return c.json({ data: { id } });
      }
    }
    throw new Error("Unable to create client");
  })
  .get("/client/:id", clientIdValidator, (c) => {
    const cursor = c
      .get("sql")
      .exec<Pick<Client, keyof Client>>(
        "SELECT id, scope, createdAt, lastModified FROM clients WHERE id = ?1",
        c.req.valid("param"),
      );
    if (cursor.rowsRead === 0) {
      return c.json({ error: "Client not found" }, { status: 404 });
    }
    return c.json({ data: cursor.one() });
  })
  .patch("/client/:id", clientIdValidator, clientBodyValidator, async (c) => {
    const { scope } = c.req.valid("json");
    const { rowsWritten } = c
      .get("sql")
      .exec(
        "UPDATE clients SET scope = ?1 WHERE id = ?2",
        scope,
        c.req.valid("param"),
      );
    if (rowsWritten === 0) {
      return c.json({ error: "Client not found" }, { status: 404 });
    }
    return c.json({ success: true });
  })
  .delete("/client/:id", clientIdValidator, (c) => {
    const { rowsWritten } = c
      .get("sql")
      .exec("DELETE FROM clients WHERE id = ?1", c.req.valid("param"));
    if (rowsWritten === 0) {
      return c.json({ error: "Client not found" }, { status: 404 });
    }
    return c.json({ success: true });
  })
  .get("/players/all", verifyAdmin, async (c) => {
    const data = c
      .get("sql")
      .exec<Pick<Player, "id" | "createdAt" | "lastModified">>(
        "SELECT id, createdAt, lastModified FROM players ORDER BY lastModified DESC",
      )
      .toArray();
    return c.json({ data });
  })
  .get("/player/:id", playerIdValidator, (c) => {
    const cursor = c
      .get("sql")
      .exec<Omit<Player, "state"> & { state: string }>(
        "SELECT id, createdAt, lastModified, json(state) AS state FROM players WHERE id = ?1",
        c.req.valid("param"),
      );
    if (cursor.rowsRead === 0) {
      return c.json({ error: "Player not found" }, { status: 404 });
    }
    const player = cursor.one();
    return c.json({ data: { ...player, state: JSON.parse(player.state) } });
  })
  .post("/player/:id", playerIdValidator, playerBodyValidator, async (c) => {
    const { state } = c.req.valid("json");
    const cursor = c
      .get("sql")
      .exec(
        "INSERT INTO players (id, state) VALUES (?1, jsonb(?2))",
        c.req.valid("param"),
        JSON.stringify(state),
      );
    if (cursor.rowsWritten === 0) {
      return c.json({ error: "Unable to create player" }, { status: 500 });
    }
    return c.json({ success: true });
  })
  .patch("/player/:id", playerIdValidator, playerBodyValidator, async (c) => {
    const { state } = c.req.valid("json");
    const cursor = c
      .get("sql")
      .exec(
        "UPDATE players SET state = jsonb_patch(state, ?1), lastModified = CURRENT_TIMESTAMP WHERE id = ?2",
        JSON.stringify(state),
        c.req.valid("param"),
      );
    if (cursor.rowsWritten === 0) {
      return c.json({ error: "Player not found" }, { status: 404 });
    }
    return c.json({ success: true });
  })
  .delete("/player/:id", verifyAdmin, playerIdValidator, (c) => {
    const cursor = c
      .get("sql")
      .exec("DELETE FROM players WHERE id = ?1", c.req.valid("param"));
    if (cursor.rowsWritten === 0) {
      return c.json({ error: "Player not found" }, { status: 404 });
    }
    return c.json({ success: true });
  });

export { app };
