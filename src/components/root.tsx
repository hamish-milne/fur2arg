import { api, useApiGet } from "../hooks";
import { Admin } from "./admin";
import { Register } from "./register";

export function Root() {
  const { data: auth } = useApiGet(api.clients.me, undefined, {
    refetchInterval: 3000,
  });

  const { id, scope } = auth && "data" in auth ? auth.data : {};

  return (
    <div className="h-full w-full relative">
      <Register code={id || ""} visible={Boolean(id && !scope)} />
      <Admin visible={Boolean(scope === "admin")} />
      <div className="absolute bottom-0 left-0">{id || "No ID"}</div>
    </div>
  );
}
