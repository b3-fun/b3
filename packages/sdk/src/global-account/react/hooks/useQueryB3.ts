import { ServiceTypes } from "@b3dotfun/b3-api";
import { useCallback, useEffect, useState } from "react";
// https://feathersjs.com/guides/cli/client#usage
import app from "@b3dotfun/sdk/global-account/app";
import { Paginated } from "@feathersjs/feathers";

// Extract the callable methods from a service
export type ServiceMethods<T extends keyof ServiceTypes> = {
  [M in keyof ServiceTypes[T]]: ServiceTypes[T][M] extends (...args: any[]) => any ? M : never;
}[keyof ServiceTypes[T]];

// Infer the type of params for a method in a service
export type ParamsType<T extends keyof ServiceTypes, M extends ServiceMethods<T>> = ServiceTypes[T][M] extends (
  ...args: infer P
) => any
  ? P[0]
  : never;

type UnwrapArray<T> = T extends (infer U)[] ? U : T;
type UnpaginatedData<T> = T extends Paginated<infer U> ? U : T;

// Infer the resolved return type of a method (unwraps Promise)
export type DataType<T extends keyof ServiceTypes, M extends ServiceMethods<T>> = ServiceTypes[T][M] extends (
  ...args: any[]
) => infer R
  ? M extends "find"
    ? {
        data: UnpaginatedData<UnwrapArray<Awaited<R>>>[];
        total: number;
        limit: number;
        skip: number;
      }
    : Awaited<R>
  : never;

export function useQueryB3<
  T extends keyof ServiceTypes, // Service name (key of ServiceTypes)
  M extends ServiceMethods<T>, // Method name within the service
>(
  service: T, // Service as string
  method: M, // Method as string
  params: ParamsType<T, M>, // Params type inferred dynamically
  fetchInitially = true,
) {
  // Use DataType to infer the type of data and unwrap the Promise
  const [data, setData] = useState<DataType<T, M> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runQuery = useCallback(async (queryParams: ParamsType<T, M>) => {
    setIsLoading(true);
    try {
      // Cast the service to avoid TypeScript issues with dynamic services
      const serviceInstance = app.service(service) as any;
      const result = await serviceInstance[method](queryParams);
      setData(result); // Now `data` is correctly typed!
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [service, method]);

  useEffect(() => {
    if (fetchInitially) {
      runQuery(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runQuery, fetchInitially, params]);

  return { data, error, isLoading, runQuery };
}
