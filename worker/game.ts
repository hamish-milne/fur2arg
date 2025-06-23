import { DurableObject } from "cloudflare:workers";
import type { Player, Client } from "../common/api";

const uuidPattern =
  /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/;

const timestampPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

type AuthScope = "admin" | `room-${string}`;
interface ClientEntry {
  authorized: AuthScope | null;
  code: string | null;
  [key: string]: SqlStorageValue; // Allow additional properties
}

function generateCode(): string {
  const arr = crypto.getRandomValues(new Uint8Array(4));
  const offset = 65; // ASCII 'A'
  return String.fromCharCode(...arr.map((x) => (x % 26) + offset));
}

export class Game extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        token TEXT PRIMARY KEY CHECK (token REGGEXP('${uuidPattern.source}')),
        id TEXT NOT NULL UNIQUE CHECK (id REGEXP '^[A-Z]{4}$'),
        authorized TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK (createdAt REGEXP '${timestampPattern.source}'),
        lastModified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK (lastModified REGEXP '${timestampPattern.source}')
      ) STRICT, WITHOUT ROWID;
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY CHECK (id REGEXP '${uuidPattern.source}'),
        state BLOB,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK (createdAt REGEXP '${timestampPattern.source}'),
        lastModified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP CHECK (lastModified REGEXP '${timestampPattern.source}')
      ) STRICT, WITHOUT ROWID;
      `);
  }

  getClientAuth(
    token: string,
  ): { authorized: AuthScope } | { code: string } | undefined {
    if (!uuidPattern.test(token)) {
      return undefined;
    }
    const { authorized, code } = this.ctx.storage.sql
      .exec<ClientEntry>(
        "SELECT authorized, code FROM clients WHERE id = ?1",
        token,
      )
      .one();
    if (authorized) {
      return { authorized };
    }
    if (code) {
      return { code };
    }
  }

  registerClient(
    token: string | null | undefined,
  ):
    | { authorized: AuthScope }
    | { code: string }
    | { token: string; code: string } {
    return this.ctx.storage.transactionSync(() => {
      const clientAuth = token && this.getClientAuth(token);
      if (clientAuth) {
        return clientAuth;
      }
      const newCode = generateCode();
      const newToken =
        token && uuidPattern.test(token) ? token : crypto.randomUUID();
      const { rowsWritten } = this.ctx.storage.sql.exec(
        "INSERT INTO clients (id, code) VALUES (?1, ?2) ON CONFLICT(id) DO UPDATE SET code = ?2",
        newToken,
        newCode,
      );
      if (rowsWritten === 0) {
        throw new Error("Unable to create client");
      }
      if (token === newToken) {
        return { code: newCode };
      }
      return { token: newToken, code: newCode };
    });
  }

  provisionClient(code: string, authorized: "admin" | `room-${string}`): void {
    if (
      !/^[A-Z]{4}$/.test(code) ||
      !authorized ||
      (authorized !== "admin" && !authorized.startsWith("room-"))
    ) {
      throw new Error("Invalid request");
    }

    const { rowsWritten } = this.ctx.storage.sql.exec(
      "UPDATE clients SET code = NULL, authorized = ?1 WHERE code = ?2",
      authorized,
      code,
    );
    if (rowsWritten === 0) {
      throw new Error("Client not found");
    }
  }

  listClients() {
    return this.ctx.storage.sql
      .exec<Pick<Client, keyof Client>>(
        "SELECT id, code, authorized, createdAt, lastModified FROM clients ORDER BY lastModified DESC",
      )
      .toArray();
  }

  listPlayers() {
    return this.ctx.storage.sql
      .exec<Pick<Player, "id" | "createdAt" | "lastModified">>(
        "SELECT id, createdAt, lastModified FROM players ORDER BY lastModified DESC",
      )
      .toArray();
  }

  getPlayer(id: string) {
    if (!uuidPattern.test(id)) {
      return undefined;
    }
    const obj = this.ctx.storage.sql
      .exec<Omit<Player, "state"> & { state: string }>(
        "SELECT id, createdAt, lastModified, json(state) AS state FROM players WHERE id = ?1",
        id,
      )
      .one();
    return {
      ...obj,
      state: JSON.parse(obj.state),
    };
  }

  createPlayer(player: Pick<Player, "id" | "state">) {
    if (!uuidPattern.test(player.id)) {
      throw new Error("Invalid player ID");
    }
    const { rowsWritten } = this.ctx.storage.sql.exec(
      "INSERT INTO players (id, state) VALUES (?1, jsonb(?2))",
      player.id,
      JSON.stringify(player.state),
    );
    if (rowsWritten === 0) {
      throw new Error("Unable to create player");
    }
  }

  updatePlayer(id: string, state: Pick<Player, "state">) {
    if (!uuidPattern.test(id)) {
      throw new Error("Invalid player ID");
    }
    const { rowsWritten } = this.ctx.storage.sql.exec(
      "UPDATE players SET state = jsonb_patch(state, ?1), lastModified = CURRENT_TIMESTAMP WHERE id = ?2",
      JSON.stringify(state),
      id,
    );
    if (rowsWritten === 0) {
      throw new Error("Player not found");
    }
  }

  deletePlayer(id: string) {
    if (!uuidPattern.test(id)) {
      throw new Error("Invalid player ID");
    }
    const { rowsWritten } = this.ctx.storage.sql.exec(
      "DELETE FROM players WHERE id = ?1",
      id,
    );
    if (rowsWritten === 0) {
      throw new Error("Player not found");
    }
  }
}
