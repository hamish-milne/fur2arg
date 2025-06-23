import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Api } from "../common/api";
import { hc } from "hono/client";
import type { app } from "../worker/app";

type RouteKey<TMethod extends "get" | "post"> = {
  [K in keyof Api]: Api[K] extends Record<TMethod, { response: unknown }>
    ? K
    : never;
}[keyof Api];

export const api = hc<typeof app>("", { init: { credentials: "include" } }).api;

type RouteTypes<TRoute> = TRoute extends {
  $get: (args: infer TArgs) => Promise<infer TResponse>;
}
  ? [TArgs, TResponse]
  : never;

export function useApiGet<
  TRoute extends {
    $get: (args: unknown) => Promise<unknown>;
    $url: (args: unknown) => URL;
  },
>(
  route: TRoute,
  args: RouteTypes<TRoute>[0],
  options?: Omit<
    UseQueryOptions<RouteTypes<TRoute>[1]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...options,
    queryKey: [route.$url(args).toString()],
    queryFn: () => route.$get(args) as Promise<RouteTypes<TRoute>[1]>,
  });
}

export function useApiPost<TRoute extends RouteKey<"post">>(
  route: string,
  options?: Omit<
    UseMutationOptions<
      Api[TRoute]["post"]["response"],
      Error,
      Api[TRoute]["post"]["request"]
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: async (body) => {
      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    ...options,
  });
}
