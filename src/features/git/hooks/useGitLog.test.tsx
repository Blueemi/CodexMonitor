// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceInfo } from "../../../types";
import { getGitLog } from "../../../services/tauri";
import { useGitLog } from "./useGitLog";

vi.mock("../../../services/tauri", () => ({
  getGitLog: vi.fn(),
}));

const workspace: WorkspaceInfo = {
  id: "workspace-1",
  name: "CodexMonitor",
  path: "/tmp/codex",
  connected: true,
  settings: { sidebarCollapsed: false },
};

const makeGitLogResponse = (total: number) => ({
  entries: [],
  total,
  ahead: 0,
  behind: 0,
  aheadEntries: [],
  behindEntries: [],
  upstream: "origin/main",
});

describe("useGitLog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("polls on interval while enabled", async () => {
    const getGitLogMock = vi.mocked(getGitLog);
    getGitLogMock
      .mockResolvedValueOnce(makeGitLogResponse(1))
      .mockResolvedValueOnce(makeGitLogResponse(2));

    const { result, unmount } = renderHook(
      ({ active, enabled }: { active: WorkspaceInfo | null; enabled: boolean }) =>
        useGitLog(active, enabled),
      { initialProps: { active: workspace, enabled: true } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getGitLogMock).toHaveBeenCalledTimes(1);
    expect(result.current.total).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(getGitLogMock).toHaveBeenCalledTimes(2);
    expect(result.current.total).toBe(2);

    unmount();
  });

  it("can fetch once without polling when polling is disabled", async () => {
    const getGitLogMock = vi.mocked(getGitLog);
    getGitLogMock.mockResolvedValueOnce(makeGitLogResponse(3));

    const { result, unmount } = renderHook(
      ({ active, enabled }: { active: WorkspaceInfo | null; enabled: boolean }) =>
        useGitLog(active, enabled, { pollingEnabled: false }),
      { initialProps: { active: workspace, enabled: true } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getGitLogMock).toHaveBeenCalledTimes(1);
    expect(result.current.total).toBe(3);

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(getGitLogMock).toHaveBeenCalledTimes(1);
    unmount();
  });
});
