import { DurableObject } from "cloudflare:workers";
import { type Context, Hono, type Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { validator } from "hono/validator";

export type AuthScope = "admin" | `room-${string}`;

export interface Player {
  id: string;
  state: Record<string, string | number | boolean>;
  created: string;
  modified: string;
}

export interface Client {
  id: string;
  scope: AuthScope | null;
  created: string;
  modified: string;
}

const uuidPattern =
  /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/;

const clientIdPattern = /^[A-Z]{4}$/;

const playerIdPattern = /^[A-F0-9]{6}$/;

type CEnv = {
  Bindings: {
    sql: SqlStorage;
  } & Env;
};

function initSql(sql: SqlStorage) {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      token TEXT PRIMARY KEY,
      id TEXT NOT NULL UNIQUE,
      scope TEXT,
      created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT, WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      state BLOB,
      created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT, WITHOUT ROWID;
    `);
}

function getClient(
  c: Context<CEnv>,
  token: string | undefined,
): { id: string; scope: AuthScope | null } | undefined {
  if (!token || !uuidPattern.test(token)) {
    return undefined;
  }
  if (token === c.env.ROOT_TOKEN) {
    return { id: "ROOT", scope: "admin" };
  }
  const cursor = c.env.sql.exec<Pick<Client, "id" | "scope">>(
    "SELECT id, scope FROM clients WHERE token = ?1",
    token,
  );
  if (cursor.rowsRead === 0) {
    return undefined;
  }
  return cursor.one();
}

function getCurrentScope(c: Context<CEnv>) {
  const token = getCookie(c, "token");
  if (!token) {
    return;
  }
  const state = getClient(c, token);
  return state?.scope;
}

async function authAdmin(c: Context<CEnv>, next: Next) {
  const scope = getCurrentScope(c);
  if (scope !== "admin") {
    return c.json({ error: "Unauthorized" }, { status: 403 });
  }
  return next();
}

async function authClient(c: Context<CEnv>, next: Next) {
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

const clientIdValidator = validator("param", (input: { id: string }, c) => {
  const { id } = input;
  if (!clientIdPattern.test(id)) {
    return c.json({ error: "Invalid client ID" }, { status: 400 });
  }
  return input;
});

const playerIdValidator = validator("param", (input: { id: string }, c) => {
  const { id } = input;
  if (!playerIdPattern.test(id)) {
    return c.json({ error: "Invalid player ID" }, { status: 400 });
  }
  return input;
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

function sqlDate(col: string) {
  return `strftime('%Y-%m-%dT%H:%M:%fZ', ${col}) AS ${col}`;
}

const getClients = `SELECT id, scope, ${sqlDate("created")}, ${sqlDate("modified")} FROM clients ORDER BY created DESC`;

const getClientById = `SELECT id, scope, ${sqlDate("created")}, ${sqlDate("modified")} FROM clients WHERE id = ?1`;

const getPlayers = `SELECT id, ${sqlDate("created")}, ${sqlDate("modified")} FROM players ORDER BY modified DESC`;

const getPlayerById = `SELECT id, ${sqlDate("created")}, ${sqlDate("modified")}, json(state) AS state FROM players WHERE id = ?1`;

function getPlayer(c: Context<CEnv>, id: string) {
  const cursor = c.env.sql.exec<Omit<Player, "state"> & { state: string }>(
    getPlayerById,
    id,
  );
  if (cursor.rowsRead === 0) {
    return c.json({ error: "Player not found" }, { status: 404 });
  }
  const player = cursor.one();
  const data: Player = {
    ...player,
    state: JSON.parse(player.state),
  };
  return c.json({ data: data });
}

// NOTE: All response data must be cast to a fixed-structure type without an index signature,
// so no Pick<,> or Omit<,> or the like.
export const app = new Hono<CEnv>()
  .basePath("/api")
  .get("/clients/all", authAdmin, (c) => {
    const clients = c.env.sql
      .exec<Pick<Client, keyof Client>>(getClients)
      .toArray();
    const data: Client[] = clients;
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
        secure: !c.env.DEV_MODE,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    for (let i = 0; i < 1000; i++) {
      const id = generateClientId();
      const { rowsWritten } = c.env.sql.exec(
        "INSERT INTO clients (token, id) VALUES (?1, ?2)",
        token,
        id,
      );
      if (rowsWritten > 0) {
        return c.json({ data: { id, scope: null } });
      }
    }
    return c.json({ error: "Unable to create client" }, { status: 500 });
  })
  .get("/client/:id", authAdmin, clientIdValidator, function foo(c) {
    const cursor = c.env.sql.exec<Pick<Client, keyof Client>>(
      getClientById,
      c.req.valid("param").id,
    );
    if (cursor.rowsRead === 0) {
      return c.json({ error: "Client not found" }, { status: 404 });
    }
    const data: Client = cursor.one();
    return c.json({ data: data }, { status: 200 });
  })
  .patch(
    "/client/:id",
    authAdmin,
    clientIdValidator,
    clientBodyValidator,
    async (c) => {
      const { scope } = c.req.valid("json");
      const { rowsWritten } = c.env.sql.exec(
        "UPDATE clients SET scope = ?1 WHERE id = ?2",
        scope,
        c.req.valid("param").id,
      );
      if (rowsWritten === 0) {
        return c.json({ error: "Client not found" }, { status: 404 });
      }
      return c.json({ success: true });
    },
  )
  .delete("/client/:id", authAdmin, clientIdValidator, (c) => {
    const { rowsWritten } = c.env.sql.exec(
      "DELETE FROM clients WHERE id = ?1",
      c.req.valid("param").id,
    );
    if (rowsWritten === 0) {
      return c.json({ error: "Client not found" }, { status: 404 });
    }
    return c.json({ success: true });
  })
  .get("/players/all", authAdmin, async (c) => {
    const players = c.env.sql
      .exec<Pick<Player, "id" | "created" | "modified">>(getPlayers)
      .toArray();
    const data: { id: string; created: string; modified: string }[] = players;
    return c.json({ data });
  })
  .get("/player/:id", authClient, playerIdValidator, (c) => {
    return getPlayer(c, c.req.valid("param").id);
  })
  .get("/player/:id/register", authClient, playerIdValidator, async (c) => {
    const { id } = c.req.valid("param");
    c.env.sql.exec(
      "INSERT INTO players (id) VALUES (?1) ON CONFLICT DO NOTHING",
      id,
    );
    return getPlayer(c, id);
  })
  .patch(
    "/player/:id",
    authClient,
    playerIdValidator,
    playerBodyValidator,
    async (c) => {
      const { state } = c.req.valid("json");
      const cursor = c.env.sql.exec(
        "UPDATE players SET state = jsonb_patch(state, ?1), modified = CURRENT_TIMESTAMP WHERE id = ?2",
        JSON.stringify(state),
        c.req.valid("param").id,
      );
      if (cursor.rowsWritten === 0) {
        return c.json({ error: "Player not found" }, { status: 404 });
      }
      return c.json({ success: true });
    },
  )
  .delete("/player/:id", authAdmin, playerIdValidator, (c) => {
    const cursor = c.env.sql.exec(
      "DELETE FROM players WHERE id = ?1",
      c.req.valid("param").id,
    );
    if (cursor.rowsWritten === 0) {
      return c.json({ error: "Player not found" }, { status: 404 });
    }
    return c.json({ success: true });
  });

export class AppDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    initSql(ctx.storage.sql);
  }

  override fetch(request: Request) {
    return app.fetch(request, { ...this.env, sql: this.ctx.storage.sql });
  }
}
