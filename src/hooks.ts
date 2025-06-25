import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { hc } from "hono/client";
import type { app } from "../worker/app";

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

type RouteParam<TArgs> = TArgs extends { param: Record<infer TParam, string> }
  ? { param: Record<TParam, string> }
  : { param: undefined };
type RouteBody<TArgs> = TArgs extends { json: infer TBody }
  ? { body: TBody }
  : { body: undefined };

type RouteTypes<TMethod extends string, TRoute> = TRoute extends {
  [_ in TMethod]: (
    args: infer TArgs,
  ) => Promise<{ json(): Promise<infer TResponse> }>;
}
  ? RouteParam<TArgs> & RouteBody<TArgs> & { response: TResponse }
  : never;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type TAny = any;

export function useApiGet<
  TRoute extends {
    $get: (args: TAny) => Promise<{ json(): Promise<unknown> }>;
    $url: (args: TAny) => URL;
  },
>(
  route: TRoute,
  args: RouteTypes<"$get", TRoute>["param"],
  options?: Omit<
    UseQueryOptions<RouteTypes<"$get", TRoute>["response"]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...options,
    queryKey: [
      route.$url(args).pathname,
      ...(args ? Object.entries(args).flat(1) : []),
    ],
    queryFn: () =>
      route.$get(args).then((x) => x.json()) as Promise<
        RouteTypes<"$get", TRoute>["response"]
      >,
  });
}

export function useApiPost<
  TMethod extends "$post" | "$put" | "$patch",
  TRoute extends {
    $url: (args: TAny) => URL;
  } & { [m in TMethod]: (args: TAny) => Promise<{ json(): Promise<unknown> }> },
>(
  route: TRoute,
  method: TMethod,
  args: RouteTypes<TMethod, TRoute>["param"],
  options?: Omit<
    UseMutationOptions<
      RouteTypes<TMethod, TRoute>["response"],
      Error,
      RouteTypes<TMethod, TRoute>["body"]
    >,
    "mutationFn" | "mutationKey"
  >,
) {
  return useMutation({
    mutationKey: [
      method,
      route.$url(args).pathname,
      ...(args ? Object.entries(args).flat(1) : []),
    ],
    mutationFn: (body) => route[method]({ param: args, json: body }),
    ...options,
  });
}
