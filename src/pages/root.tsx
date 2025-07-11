import { api, useApiGet } from "../hooks";
import { Admin } from "./admin";
import { Register } from "./register";

export function Root() {
  const { data: auth } = useApiGet(api.clients.me, undefined, {
    refetchInterval: 5000,
  });

  const { id, scope } = auth && "data" in auth ? auth.data : {};

  return (
    <div className="h-full w-full relative">
      <Register code={id || ""} visible={Boolean(id && !scope)} />
      <Admin visible={Boolean(scope === "admin")} />
      <div className="fixed bottom-2 left-2">{id || "No ID"}</div>
    </div>
  );
}
