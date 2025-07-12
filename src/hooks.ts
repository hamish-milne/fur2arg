import {
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { hc } from "hono/client";
import type { app } from "../worker/app";

export type { AuthScope, Client, Player } from "../worker/app";

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

// biome-ignore lint/suspicious/noExplicitAny: Using 'unknown' for the arguments doesn't work here.
type TAny = any;

// biome-ignore lint/suspicious/noConfusingVoidType: Using 'void' allows omitting the 'param' and 'json' properties in the route types.
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

export interface AnyRoute {
  $url: (args: TAny) => URL;
}

export function invalidate<TRoute extends AnyRoute>(
  queryClient: QueryClient,
  route: TRoute,
  param?: RouteTypes<"$get", TRoute>["param"],
) {
  return queryClient.invalidateQueries({
    queryKey: [route.$url({ param }).toString()],
  });
}

export type Method = "$patch" | "$post" | "$put" | "$delete";

export type Route<TMethod extends Method> = AnyRoute & {
  [_ in TMethod]: (args: TAny) => Promise<{ json(): Promise<unknown> }>;
};

export function useApiAction<
  TMethod extends Method,
  TRoute extends Route<TMethod>,
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

export type BulkData<
  TMethod extends Method,
  TRoute extends Route<TMethod>,
> = Pick<RouteTypes<TMethod, TRoute>, "param" | "json">[];

export function useApiBulkAction<
  TMethod extends Method,
  TRoute extends Route<TMethod>,
>(
  route: TRoute,
  method: TMethod,
  options?: Omit<
    UseMutationOptions<
      RouteTypes<TMethod, TRoute>["response"][],
      Error,
      BulkData<TMethod, TRoute>
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
