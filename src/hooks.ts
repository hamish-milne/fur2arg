import {
  type QueryClient,
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { hc } from "hono/client";
import type { app } from "../worker/app";
export type { AuthScope, Player, Client } from "../worker/app";

// We need to put a baseUrl here, then strip it out at the end, so that the $url method works.
export const api = hc<typeof app>("https://localhost/", {
  init: { credentials: "include" },
  fetch(input: RequestInfo | URL, init?: RequestInit) {
    return fetch(
      typeof input === "string" || input instanceof URL
        ? new URL(input).pathname
        : input,
      init,
    );
  },
}).api;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type TAny = any;

// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type TVoid = void;

type RouteParam<TArgs> = TArgs extends { param: Record<infer TParam, string> }
  ? { param: Record<TParam, string> }
  : { param: TVoid };
type RouteBody<TArgs> = TArgs extends { json: infer TBody }
  ? { json: TBody }
  : { json: TVoid };

type RouteTypes<TMethod extends string, TRoute> = TRoute extends {
  [_ in TMethod]: (
    args: infer TArgs,
  ) => Promise<{ json(): Promise<infer TResponse> }>;
}
  ? RouteParam<TArgs> & RouteBody<TArgs> & { response: TResponse }
  : never;

export function useApiGet<
  TRoute extends {
    $get: (args: TAny) => Promise<{ json(): Promise<unknown> }>;
    $url: (args: TAny) => URL;
  },
>(
  route: TRoute,
  param: RouteTypes<"$get", TRoute>["param"],
  options?: Omit<
    UseQueryOptions<RouteTypes<"$get", TRoute>["response"]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...options,
    queryKey: [route.$url({ param }).toString()],
    queryFn: () =>
      route.$get({ param }).then((x) => x.json()) as Promise<
        RouteTypes<"$get", TRoute>["response"]
      >,
  });
}

export function invalidate<
  TRoute extends {
    $url: (args: TAny) => URL;
  },
>(
  queryClient: QueryClient,
  route: TRoute,
  param?: RouteTypes<"$get", TRoute>["param"],
) {
  return queryClient.invalidateQueries({
    queryKey: [route.$url({ param }).toString()],
  });
}

export function useApiAction<
  TMethod extends "$patch" | "$post" | "$put" | "$delete",
  TRoute extends {
    $url: (args: TAny) => URL;
  } & { [_ in TMethod]: (args: TAny) => Promise<{ json(): Promise<unknown> }> },
>(
  route: TRoute,
  method: TMethod,
  param: RouteTypes<TMethod, TRoute>["param"],
  options?: Omit<
    UseMutationOptions<
      RouteTypes<TMethod, TRoute>["response"],
      Error,
      RouteTypes<TMethod, TRoute>["json"]
    >,
    "mutationFn" | "mutationKey"
  >,
) {
  return useMutation({
    ...options,
    mutationKey: [route.$url({ param }).toString(), method],
    mutationFn: (json) =>
      route[method]({ param, json }).then((x) => x.json()) as Promise<
        RouteTypes<TMethod, TRoute>["response"]
      >,
  });
}

export function useApiBulkAction<
  TMethod extends "$patch" | "$post" | "$put" | "$delete",
  TRoute extends {
    $url: (args: TAny) => URL;
  } & { [_ in TMethod]: (args: TAny) => Promise<{ json(): Promise<unknown> }> },
>(
  route: TRoute,
  method: TMethod,
  options?: Omit<
    UseMutationOptions<
      RouteTypes<TMethod, TRoute>["response"][],
      Error,
      Pick<RouteTypes<TMethod, TRoute>, "param" | "json">[]
    >,
    "mutationFn" | "mutationKey"
  >,
) {
  return useMutation({
    ...options,
    mutationKey: [route.$url({}), method],
    mutationFn: (body) =>
      Promise.all(
        body.map((x) => route[method](x).then((y) => y.json())),
      ) as Promise<RouteTypes<TMethod, TRoute>["response"][]>,
  });
}
