import { useCallback, useEffect, useRef, useState } from "react";
import type { GitLogEntry, WorkspaceInfo } from "../../../types";
import { getGitLog } from "../../../services/tauri";

type GitLogState = {
  entries: GitLogEntry[];
  total: number;
  ahead: number;
  behind: number;
  aheadEntries: GitLogEntry[];
  behindEntries: GitLogEntry[];
  upstream: string | null;
  isLoading: boolean;
  error: string | null;
};

const emptyState: GitLogState = {
  entries: [],
  total: 0,
  ahead: 0,
  behind: 0,
  aheadEntries: [],
  behindEntries: [],
  upstream: null,
  isLoading: false,
  error: null,
};

const DEFAULT_REFRESH_INTERVAL_MS = 30000;

type UseGitLogOptions = {
  pollingEnabled?: boolean;
  refreshIntervalMs?: number;
  pauseWhenInactive?: boolean;
};

function readWindowActiveState() {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState !== "hidden";
}

export function useGitLog(
  activeWorkspace: WorkspaceInfo | null,
  enabled: boolean,
  options: UseGitLogOptions = {},
) {
  const [state, setState] = useState<GitLogState>(emptyState);
  const [isWindowActive, setIsWindowActive] = useState(readWindowActiveState);
  const requestIdRef = useRef(0);
  const workspaceIdRef = useRef<string | null>(activeWorkspace?.id ?? null);
  const pollingEnabled = options.pollingEnabled ?? true;
  const refreshIntervalMs = options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const pauseWhenInactive = options.pauseWhenInactive ?? true;

  const refresh = useCallback(async () => {
    if (!activeWorkspace) {
      setState(emptyState);
      return;
    }
    const workspaceId = activeWorkspace.id;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getGitLog(workspaceId);
      if (
        requestIdRef.current !== requestId ||
        workspaceIdRef.current !== workspaceId
      ) {
        return;
      }
      setState({
        entries: response.entries,
        total: response.total,
        ahead: response.ahead,
        behind: response.behind,
        aheadEntries: response.aheadEntries,
        behindEntries: response.behindEntries,
        upstream: response.upstream,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load git log", error);
      if (
        requestIdRef.current !== requestId ||
        workspaceIdRef.current !== workspaceId
      ) {
        return;
      }
      setState({
        entries: [],
        total: 0,
        ahead: 0,
        behind: 0,
        aheadEntries: [],
        behindEntries: [],
        upstream: null,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const workspaceId = activeWorkspace?.id ?? null;
    if (workspaceIdRef.current !== workspaceId) {
      workspaceIdRef.current = workspaceId;
      requestIdRef.current += 1;
      setState(emptyState);
    }
  }, [activeWorkspace?.id]);

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
    if (!enabled || !activeWorkspace || (pauseWhenInactive && !isWindowActive)) {
      return;
    }
    void refresh();
    if (!pollingEnabled || refreshIntervalMs <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      refresh().catch(() => {});
    }, refreshIntervalMs);
    return () => {
      window.clearInterval(interval);
    };
  }, [
    activeWorkspace,
    enabled,
    isWindowActive,
    pauseWhenInactive,
    pollingEnabled,
    refresh,
    refreshIntervalMs,
  ]);

  return {
    entries: state.entries,
    total: state.total,
    ahead: state.ahead,
    behind: state.behind,
    aheadEntries: state.aheadEntries,
    behindEntries: state.behindEntries,
    upstream: state.upstream,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}
