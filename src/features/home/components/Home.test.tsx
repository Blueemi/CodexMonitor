// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home } from "./Home";

const baseProps = {
  onOpenProject: vi.fn(),
  onAddWorkspace: vi.fn(),
  latestAgentRuns: [],
  isLoadingLatestAgents: false,
  localUsageSnapshot: null,
  isLoadingLocalUsage: false,
  localUsageError: null,
  onRefreshLocalUsage: vi.fn(),
  usageMetric: "tokens" as const,
  onUsageMetricChange: vi.fn(),
  usageWorkspaceId: null,
  usageWorkspaceOptions: [],
  onUsageWorkspaceChange: vi.fn(),
  onSelectThread: vi.fn(),
};

describe("Home", () => {
  it("renders latest agent runs and lets you open a thread", () => {
    const onSelectThread = vi.fn();
    render(
      <Home
        {...baseProps}
        latestAgentRuns={[
          {
            message: "Ship the dashboard refresh",
            timestamp: Date.now(),
            projectName: "CodexMonitor",
            groupName: "Frontend",
            workspaceId: "workspace-1",
            threadId: "thread-1",
            isProcessing: true,
          },
        ]}
        onSelectThread={onSelectThread}
      />,
    );

    expect(screen.getByText("Latest agents")).toBeTruthy();
    expect(screen.getByText("CodexMonitor")).toBeTruthy();
    expect(screen.getByText("Frontend")).toBeTruthy();
    const message = screen.getByText("Ship the dashboard refresh");
    const card = message.closest("button");
    expect(card).toBeTruthy();
    if (!card) {
      throw new Error("Expected latest agent card button");
    }
    fireEvent.click(card);
    expect(onSelectThread).toHaveBeenCalledWith("workspace-1", "thread-1");
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("shows the empty state when there are no latest runs", () => {
    render(<Home {...baseProps} />);

    expect(screen.getByText("No agent activity yet")).toBeTruthy();
    expect(
      screen.getByText("Start a thread to see the latest responses here."),
    ).toBeTruthy();
  });

  it("renders usage cards in time mode", () => {
    render(
      <Home
        {...baseProps}
        usageMetric="time"
        localUsageSnapshot={{
          updatedAt: Date.now(),
          days: [
            {
              day: "2026-01-20",
              inputTokens: 10,
              cachedInputTokens: 0,
              outputTokens: 5,
              totalTokens: 15,
              agentTimeMs: 120000,
              agentRuns: 2,
            },
          ],
          totals: {
            last7DaysTokens: 15,
            last30DaysTokens: 15,
            allTimeTokens: 15,
            averageDailyTokens: 15,
            cacheHitRatePercent: 0,
            peakDay: "2026-01-20",
            peakDayTokens: 15,
          },
          modelUsage: {
            last7Days: [],
            last30Days: [],
            allTime: [],
          },
          topModels: [],
        }}
      />,
    );

    expect(screen.getAllByText("agent time").length).toBeGreaterThan(0);
    expect(screen.getByText("Runs")).toBeTruthy();
    expect(screen.getByText("Peak day")).toBeTruthy();
  });

  it("renders all-time API price preview details", () => {
    render(
      <Home
        {...baseProps}
        accountPlanType="pro"
        localUsageSnapshot={{
          updatedAt: Date.now(),
          days: [
            {
              day: "2026-01-20",
              inputTokens: 1200000,
              cachedInputTokens: 200000,
              outputTokens: 100000,
              totalTokens: 1300000,
              agentTimeMs: 120000,
              agentRuns: 2,
            },
          ],
          totals: {
            last7DaysTokens: 1300000,
            last30DaysTokens: 1300000,
            allTimeTokens: 1300000,
            averageDailyTokens: 1300000,
            cacheHitRatePercent: 16.7,
            peakDay: "2026-01-20",
            peakDayTokens: 1300000,
          },
          modelUsage: {
            last7Days: [
              {
                model: "gpt-5.2-codex",
                tokens: 300000,
                inputTokens: 250000,
                cachedInputTokens: 50000,
                outputTokens: 50000,
                sharePercent: 85.7,
              },
            ],
            last30Days: [
              {
                model: "gpt-5.2-codex",
                tokens: 1100000,
                inputTokens: 1000000,
                cachedInputTokens: 200000,
                outputTokens: 100000,
                sharePercent: 84.6,
              },
              {
                model: "gpt-5.3-codex",
                tokens: 200000,
                inputTokens: 150000,
                cachedInputTokens: 50000,
                outputTokens: 50000,
                sharePercent: 15.4,
              },
            ],
            allTime: [
              {
                model: "gpt-5.2-codex",
                tokens: 1100000,
                inputTokens: 1000000,
                cachedInputTokens: 200000,
                outputTokens: 100000,
                sharePercent: 84.6,
              },
              {
                model: "gpt-5.3-codex",
                tokens: 200000,
                inputTokens: 150000,
                cachedInputTokens: 50000,
                outputTokens: 50000,
                sharePercent: 15.4,
              },
            ],
          },
          topModels: [
            {
              model: "gpt-5.2-codex",
              tokens: 1100000,
              inputTokens: 1000000,
              cachedInputTokens: 200000,
              outputTokens: 100000,
              sharePercent: 84.6,
            },
            {
              model: "gpt-5.3-codex",
              tokens: 200000,
              inputTokens: 150000,
              cachedInputTokens: 50000,
              outputTokens: 50000,
              sharePercent: 15.4,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("API price preview (all time)")).toBeTruthy();
    expect(screen.getByText("API price preview (last 7 days)")).toBeTruthy();
    expect(screen.getByText("API price preview (last 30 days)")).toBeTruthy();
    expect(screen.getAllByText(/Estimated total:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimated 30-day savings").length).toBeGreaterThan(0);
    expect(screen.getByText(/ChatGPT Pro/)).toBeTruthy();
    expect(screen.getAllByText("gpt-5.2-codex").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/assumed as gpt-5.2-codex/).length).toBeGreaterThan(0);
  });

  it("renders usage bars for all available days", () => {
    const { container } = render(
      <Home
        {...baseProps}
        localUsageSnapshot={{
          updatedAt: Date.now(),
          days: Array.from({ length: 10 }, (_, index) => ({
            day: `2026-01-${String(index + 1).padStart(2, "0")}`,
            inputTokens: 100 + index,
            cachedInputTokens: 0,
            outputTokens: 50 + index,
            totalTokens: 150 + index,
            agentTimeMs: 1000 * (index + 1),
            agentRuns: index + 1,
          })),
          totals: {
            last7DaysTokens: 0,
            last30DaysTokens: 0,
            allTimeTokens: 0,
            averageDailyTokens: 0,
            cacheHitRatePercent: 0,
            peakDay: "2026-01-10",
            peakDayTokens: 159,
          },
          modelUsage: {
            last7Days: [],
            last30Days: [],
            allTime: [],
          },
          topModels: [],
        }}
      />,
    );

    expect(container.querySelectorAll(".home-usage-bar")).toHaveLength(10);
  });
});
