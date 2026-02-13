import { useCallback, useEffect } from "react";
import type { DebugEntry } from "@/types";
import { getAccountRateLimits } from "@services/tauri";
import { normalizeRateLimits } from "@threads/utils/threadNormalize";
import type { ThreadAction } from "./useThreadsReducer";

type UseThreadRateLimitsOptions = {
  activeWorkspaceId: string | null;
  activeWorkspaceConnected?: boolean;
  dispatch: React.Dispatch<ThreadAction>;
  onDebug?: (entry: DebugEntry) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function looksLikeRateLimits(value: Record<string, unknown> | null): boolean {
  if (!value) {
    return false;
  }
  return (
    value.primary !== undefined ||
    value.secondary !== undefined ||
    value.credits !== undefined ||
    value.planType !== undefined ||
    value.plan_type !== undefined
  );
}

function extractRateLimitsPayload(response: unknown): Record<string, unknown> | null {
  const responseRecord = asRecord(response);
  const resultRecord = asRecord(responseRecord?.result);

  const wrappedRateLimits =
    asRecord(resultRecord?.rateLimits) ??
    asRecord(resultRecord?.rate_limits) ??
    asRecord(responseRecord?.rateLimits) ??
    asRecord(responseRecord?.rate_limits);
  if (wrappedRateLimits) {
    return wrappedRateLimits;
  }

  if (looksLikeRateLimits(resultRecord)) {
    return resultRecord;
  }
  if (looksLikeRateLimits(responseRecord)) {
    return responseRecord;
  }
  return null;
}

export function useThreadRateLimits({
  activeWorkspaceId,
  activeWorkspaceConnected,
  dispatch,
  onDebug,
}: UseThreadRateLimitsOptions) {
  const refreshAccountRateLimits = useCallback(
    async (workspaceId?: string) => {
      const targetId = workspaceId ?? activeWorkspaceId;
      if (!targetId) {
        return;
      }
      onDebug?.({
        id: `${Date.now()}-client-account-rate-limits`,
        timestamp: Date.now(),
        source: "client",
        label: "account/rateLimits/read",
        payload: { workspaceId: targetId },
      });
      try {
        const response = await getAccountRateLimits(targetId);
        onDebug?.({
          id: `${Date.now()}-server-account-rate-limits`,
          timestamp: Date.now(),
          source: "server",
          label: "account/rateLimits/read response",
          payload: response,
        });
        const rateLimits = extractRateLimitsPayload(response);
        if (rateLimits) {
          dispatch({
            type: "setRateLimits",
            workspaceId: targetId,
            rateLimits: normalizeRateLimits(rateLimits),
          });
        }
      } catch (error) {
        onDebug?.({
          id: `${Date.now()}-client-account-rate-limits-error`,
          timestamp: Date.now(),
          source: "error",
          label: "account/rateLimits/read error",
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [activeWorkspaceId, dispatch, onDebug],
  );

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }
    // Always attempt a direct refresh for the selected workspace so limits are not gated on
    // thread/session selection timing.
    void refreshAccountRateLimits(activeWorkspaceId);
  }, [activeWorkspaceConnected, activeWorkspaceId, refreshAccountRateLimits]);

  return { refreshAccountRateLimits };
}
