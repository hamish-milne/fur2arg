import { api, useApiGet } from "../hooks";
import { Register } from "./register";

export function Root() {
  const { data: auth } = useApiGet(api, {
    refetchInterval: 3000,
  });

  return (
    <div className="h-full w-full relative">
      <Register
        code={auth?.id || ""}
        visible={Boolean(auth?.id && !auth?.scope)}
      />
      <div className="absolute bottom-0 left-0">{auth?.id || "No ID"}</div>
    </div>
  );
}
