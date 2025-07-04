import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { hc, type InferResponseType } from "hono/client";
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type TAny = any;

// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
type TVoid = void;

type RouteParam<TArgs> = TArgs extends { param: Record<infer TParam, string> }
  ? { param: Record<TParam, string> }
  : { param: TVoid };
type RouteBody<TArgs> = TArgs extends { json: infer TBody }
  ? { body: TBody }
  : { body: TVoid };

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
  args: RouteTypes<"$get", TRoute>["param"],
  options?: Omit<
    UseQueryOptions<RouteTypes<"$get", TRoute>["response"]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...options,
    queryKey: [route.$url(args).toString()],
    queryFn: () =>
      route.$get(args).then((x) => x.json()) as Promise<
        RouteTypes<"$get", TRoute>["response"]
      >,
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
    ...options,
    mutationKey: [route.$url(args).toString(), method],
    mutationFn: (body) =>
      route[method]({ param: args, json: body }).then((x) =>
        x.json(),
      ) as Promise<RouteTypes<TMethod, TRoute>["response"]>,
  });
}
