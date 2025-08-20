"use client";

import { useQueryBSMNT } from "@b3dotfun/sdk/global-account/react/hooks/useQueryBSMNT";

export function useRPMToken() {
  const {
    data,
    runQuery: refetch,
    isLoading,
    error: isError,
  } = useQueryBSMNT("profiles", "getReadyPlayerMeToken", undefined, true);

  const token = data?.token || "";
  const accountId = data?.accountId || "";

  return { token, accountId, refetch, isLoading, isError };
}
