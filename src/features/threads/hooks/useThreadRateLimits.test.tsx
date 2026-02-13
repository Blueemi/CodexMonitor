// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccountRateLimits } from "../../../services/tauri";
import { normalizeRateLimits } from "../utils/threadNormalize";
import { useThreadRateLimits } from "./useThreadRateLimits";

vi.mock("../../../services/tauri", () => ({
  getAccountRateLimits: vi.fn(),
}));

describe("useThreadRateLimits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes rate limits on connect and dispatches normalized data", async () => {
    const dispatch = vi.fn();
    const onDebug = vi.fn();
    const rawRateLimits = {
      primary: {
        used_percent: "25",
        window_duration_mins: 60,
        resets_at: 12345,
      },
    };

    vi.mocked(getAccountRateLimits).mockResolvedValue({
      result: { rate_limits: rawRateLimits },
    });

    renderHook(() =>
      useThreadRateLimits({
        activeWorkspaceId: "ws-1",
        activeWorkspaceConnected: true,
        dispatch,
        onDebug,
      }),
    );

    await waitFor(() => {
      expect(getAccountRateLimits).toHaveBeenCalledWith("ws-1");
    });

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: "setRateLimits",
        workspaceId: "ws-1",
        rateLimits: normalizeRateLimits(rawRateLimits),
      });
    });

    expect(onDebug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "client",
        label: "account/rateLimits/read",
        payload: { workspaceId: "ws-1" },
      }),
    );
    expect(onDebug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "server",
        label: "account/rateLimits/read response",
        payload: { result: { rate_limits: rawRateLimits } },
      }),
    );
  });

  it("allows manual refresh with an explicit workspace id", async () => {
    const dispatch = vi.fn();
    const rawRateLimits = {
      primary: { usedPercent: 10, windowDurationMins: 30, resetsAt: 777 },
    };

    vi.mocked(getAccountRateLimits).mockResolvedValue({
      rateLimits: rawRateLimits,
    });

    const { result } = renderHook(() =>
      useThreadRateLimits({
        activeWorkspaceId: null,
        activeWorkspaceConnected: false,
        dispatch,
      }),
    );

    await act(async () => {
      await result.current.refreshAccountRateLimits("ws-2");
    });

    expect(getAccountRateLimits).toHaveBeenCalledWith("ws-2");
    expect(dispatch).toHaveBeenCalledWith({
      type: "setRateLimits",
      workspaceId: "ws-2",
      rateLimits: normalizeRateLimits(rawRateLimits),
    });
  });

  it("auto-refreshes active workspace even when connected flag is false", async () => {
    const dispatch = vi.fn();
    const rawRateLimits = {
      primary: { used_percent: 21, window_minutes: 300, resets_at: 1700000000 },
      secondary: { used_percent: 48, window_minutes: 10080, resets_at: 1700003600 },
    };

    vi.mocked(getAccountRateLimits).mockResolvedValue({
      result: { rate_limits: rawRateLimits },
    });

    renderHook(() =>
      useThreadRateLimits({
        activeWorkspaceId: "ws-1",
        activeWorkspaceConnected: false,
        dispatch,
      }),
    );

    await waitFor(() => {
      expect(getAccountRateLimits).toHaveBeenCalledWith("ws-1");
    });

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: "setRateLimits",
        workspaceId: "ws-1",
        rateLimits: normalizeRateLimits(rawRateLimits),
      });
    });
  });

  it("handles direct result payloads from account/rateLimits/read", async () => {
    const dispatch = vi.fn();
    const rawRateLimits = {
      primary: { usedPercent: 12, windowDurationMins: 300, resetsAt: 123456 },
      secondary: { usedPercent: 40, windowDurationMins: 10080, resetsAt: 234567 },
    };

    vi.mocked(getAccountRateLimits).mockResolvedValue({
      result: rawRateLimits,
    });

    const { result } = renderHook(() =>
      useThreadRateLimits({
        activeWorkspaceId: "ws-1",
        activeWorkspaceConnected: false,
        dispatch,
      }),
    );

    await act(async () => {
      await result.current.refreshAccountRateLimits();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "setRateLimits",
      workspaceId: "ws-1",
      rateLimits: normalizeRateLimits(rawRateLimits),
    });
  });

  it("reports errors via debug callback without dispatching", async () => {
    const dispatch = vi.fn();
    const onDebug = vi.fn();

    vi.mocked(getAccountRateLimits).mockRejectedValue(new Error("Nope"));

    const { result } = renderHook(() =>
      useThreadRateLimits({
        activeWorkspaceId: "ws-1",
        dispatch,
        onDebug,
      }),
    );

    await act(async () => {
      await result.current.refreshAccountRateLimits();
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(onDebug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "error",
        label: "account/rateLimits/read error",
        payload: "Nope",
      }),
    );
  });
});
