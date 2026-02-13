import { useCallback, useEffect, useRef, useState } from "react";
import type { GitFileStatus, WorkspaceInfo } from "../../../types";
import { getGitStatus } from "../../../services/tauri";

type GitStatusState = {
  branchName: string;
  files: GitFileStatus[];
  stagedFiles: GitFileStatus[];
  unstagedFiles: GitFileStatus[];
  totalAdditions: number;
  totalDeletions: number;
  error: string | null;
};

const emptyStatus: GitStatusState = {
  branchName: "",
  files: [],
  stagedFiles: [],
  unstagedFiles: [],
  totalAdditions: 0,
  totalDeletions: 0,
  error: null,
};

const DEFAULT_REFRESH_INTERVAL_MS = 8000;

type UseGitStatusOptions = {
  includeLineStats?: boolean;
  refreshIntervalMs?: number;
  pauseWhenInactive?: boolean;
};

function readWindowActiveState() {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState !== "hidden";
}

export function useGitStatus(
  activeWorkspace: WorkspaceInfo | null,
  options: UseGitStatusOptions = {},
) {
  const [status, setStatus] = useState<GitStatusState>(emptyStatus);
  const [isWindowActive, setIsWindowActive] = useState(readWindowActiveState);
  const requestIdRef = useRef(0);
  const requestScopeRef = useRef<string | null>(null);
  const cachedStatusRef = useRef<Map<string, GitStatusState>>(new Map());
  const workspaceId = activeWorkspace?.id ?? null;
  const includeLineStats = options.includeLineStats ?? true;
  const refreshIntervalMs = options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const pauseWhenInactive = options.pauseWhenInactive ?? true;
  const requestScope = workspaceId
    ? `${workspaceId}|lineStats:${includeLineStats ? "1" : "0"}`
    : null;

  const resolveBranchName = useCallback(
    (incoming: string | undefined, cached: GitStatusState | undefined) => {
      const trimmed = incoming?.trim();
      if (trimmed && trimmed !== "unknown") {
        return trimmed;
      }
      const cachedBranch = cached?.branchName?.trim();
      return cachedBranch && cachedBranch !== "unknown"
        ? cachedBranch
        : trimmed ?? "";
    },
    [],
  );

  const refresh = useCallback(() => {
    if (!workspaceId || !requestScope) {
      setStatus(emptyStatus);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    return getGitStatus(workspaceId, { includeLineStats })
      .then((data) => {
        if (
          requestIdRef.current !== requestId ||
          requestScopeRef.current !== requestScope
        ) {
          return;
        }
        const cached = cachedStatusRef.current.get(requestScope);
        const resolvedBranchName = resolveBranchName(data.branchName, cached);
        const nextStatus = {
          ...data,
          branchName: resolvedBranchName,
          error: null,
        };
        setStatus(nextStatus);
        cachedStatusRef.current.set(requestScope, nextStatus);
      })
      .catch((err) => {
        console.error("Failed to load git status", err);
        if (
          requestIdRef.current !== requestId ||
          requestScopeRef.current !== requestScope
        ) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        const cached = cachedStatusRef.current.get(requestScope);
        const nextStatus = cached
          ? { ...cached, error: message }
          : { ...emptyStatus, branchName: "unknown", error: message };
        setStatus(nextStatus);
      });
  }, [includeLineStats, requestScope, resolveBranchName, workspaceId]);

  useEffect(() => {
    if (requestScopeRef.current !== requestScope) {
      requestScopeRef.current = requestScope;
      requestIdRef.current += 1;
      if (!requestScope) {
        setStatus(emptyStatus);
        return;
      }
      const cached = cachedStatusRef.current.get(requestScope);
      setStatus(cached ?? emptyStatus);
    }
  }, [requestScope]);

  useEffect(() => {
    const handleFocus = () => setIsWindowActive(true);
    const handleBlur = () => setIsWindowActive(false);
    const handleVisibilityChange = () =>
      setIsWindowActive(document.visibilityState !== "hidden");

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setStatus(emptyStatus);
      return;
    }
    if (pauseWhenInactive && !isWindowActive) {
      return;
    }

    const fetchStatus = () => {
      refresh()?.catch(() => {});
    };

    fetchStatus();
    if (refreshIntervalMs <= 0) {
      return;
    }
    const interval = window.setInterval(fetchStatus, refreshIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [isWindowActive, pauseWhenInactive, refresh, refreshIntervalMs, workspaceId]);

  return { status, refresh };
}
