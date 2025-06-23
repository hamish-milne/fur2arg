export type AuthScope = "admin" | `room-${string}`;

export interface Player {
  id: string;
  state: Record<string, string | number | boolean>;
  createdAt: string;
  lastModified: string;
}

export interface Client {
  id: string;
  scope: AuthScope | null;
  createdAt: string;
  lastModified: string;
}

export interface Api {
  "/api/clients": {
    get: {
      response: {
        clients: Client[];
      };
    };
  };
  "/api/clients/me": {
    get: {
      response: Pick<Client, "id" | "scope">;
    };
  };
  "/api/clients/:id": {
    params: {
      id: string;
    };
    get: {
      response: {
        client: Client;
      };
    };
    patch: {
      request: Pick<Client, "scope">;
      response: {
        success: boolean;
      };
    };
    delete: {
      response: {
        success: boolean;
      };
    };
  };
  "/api/players": {
    get: {
      response: {
        players: Pick<Player, "id" | "createdAt" | "lastModified">[];
      };
    };
  };
  "/api/players/:id": {
    params: {
      id: string;
    };
    get: {
      response: {
        player: Player;
      };
    };
    post: {
      request: Pick<Player, "state">;
      response: {
        success: boolean;
      };
    };
    patch: {
      request: Pick<Player, "state">;
      response: {
        success: boolean;
      };
    };
    delete: {
      response: {
        success: boolean;
      };
    };
  };
}
