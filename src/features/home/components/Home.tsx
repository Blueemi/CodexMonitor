import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useEffect, useRef } from "react";
import type { LocalUsageSnapshot } from "../../../types";
import { formatRelativeTime } from "../../../utils/time";

type LatestAgentRun = {
  message: string;
  timestamp: number;
  projectName: string;
  groupName?: string | null;
  workspaceId: string;
  threadId: string;
  isProcessing: boolean;
};

type UsageMetric = "tokens" | "time";

type UsageWorkspaceOption = {
  id: string;
  label: string;
};

type HomeProps = {
  onOpenProject: () => void;
  onAddWorkspace: () => void;
  latestAgentRuns: LatestAgentRun[];
  isLoadingLatestAgents: boolean;
  localUsageSnapshot: LocalUsageSnapshot | null;
  isLoadingLocalUsage: boolean;
  localUsageError: string | null;
  onRefreshLocalUsage: () => void;
  usageMetric: UsageMetric;
  onUsageMetricChange: (metric: UsageMetric) => void;
  usageWorkspaceId: string | null;
  usageWorkspaceOptions: UsageWorkspaceOption[];
  onUsageWorkspaceChange: (workspaceId: string | null) => void;
  onSelectThread: (workspaceId: string, threadId: string) => void;
  accountPlanType?: string | null;
};

type ModelApiPricing = {
  input: number;
  cachedInput: number;
  output: number;
  assumedFrom?: string;
};

type ModelCostPreviewRow = {
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  pricing: ModelApiPricing | null;
  estimatedCostUsd: number | null;
};

type ModelCostPreviewData = {
  rows: ModelCostPreviewRow[];
  pricedModelCount: number;
  unpricedModelCount: number;
  estimatedTotalUsd: number | null;
};

const MODEL_API_PRICING_PER_1M: Record<string, ModelApiPricing> = {
  "gpt-5.3-codex": {
    input: 1.75,
    cachedInput: 0.175,
    output: 14.0,
    assumedFrom: "gpt-5.2-codex",
  },
  "gpt-5.2-codex": { input: 1.75, cachedInput: 0.175, output: 14.0 },
  "gpt-5.1-codex-mini": { input: 0.25, cachedInput: 0.025, output: 2.0 },
  "gpt-5-codex-mini": {
    input: 0.25,
    cachedInput: 0.025,
    output: 2.0,
    assumedFrom: "gpt-5.1-codex-mini",
  },
  "gpt-5.1-codex-max": { input: 1.25, cachedInput: 0.125, output: 10.0 },
  "gpt-5.1-codex": { input: 1.25, cachedInput: 0.125, output: 10.0 },
  "gpt-5-codex": { input: 1.25, cachedInput: 0.125, output: 10.0 },
  "gpt-5.2": { input: 1.75, cachedInput: 0.175, output: 14.0 },
  "gpt-5.1": { input: 1.25, cachedInput: 0.125, output: 10.0 },
  "gpt-5": { input: 1.25, cachedInput: 0.125, output: 10.0 },
};

const normalizeModelKey = (model: string) => model.trim().toLowerCase();

export function Home({
  onOpenProject,
  onAddWorkspace,
  latestAgentRuns,
  isLoadingLatestAgents,
  localUsageSnapshot,
  isLoadingLocalUsage,
  localUsageError,
  onRefreshLocalUsage,
  usageMetric,
  onUsageMetricChange,
  usageWorkspaceId,
  usageWorkspaceOptions,
  onUsageWorkspaceChange,
  onSelectThread,
  accountPlanType,
}: HomeProps) {
  const formatCompactNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }
    if (value >= 1_000_000_000) {
      const scaled = value / 1_000_000_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}b`;
    }
    if (value >= 1_000_000) {
      const scaled = value / 1_000_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}m`;
    }
    if (value >= 1_000) {
      const scaled = value / 1_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}k`;
    }
    return String(value);
  };

  const formatCount = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }
    return new Intl.NumberFormat().format(value);
  };

  const formatDuration = (valueMs: number | null | undefined) => {
    if (valueMs === null || valueMs === undefined) {
      return "--";
    }
    const totalSeconds = Math.max(0, Math.round(valueMs / 1000));
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (totalMinutes > 0) {
      return `${totalMinutes}m`;
    }
    return `${totalSeconds}s`;
  };

  const formatDurationCompact = (valueMs: number | null | undefined) => {
    if (valueMs === null || valueMs === undefined) {
      return "--";
    }
    const totalMinutes = Math.max(0, Math.round(valueMs / 60000));
    if (totalMinutes >= 60) {
      const hours = totalMinutes / 60;
      return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
    }
    if (totalMinutes > 0) {
      return `${totalMinutes}m`;
    }
    const seconds = Math.max(0, Math.round(valueMs / 1000));
    return `${seconds}s`;
  };

  const formatDayLabel = (value: string | null | undefined) => {
    if (!value) {
      return "--";
    }
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
      return value;
    }
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatUsd = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }
    const maxFractionDigits = value < 0.01 ? 4 : 2;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: maxFractionDigits,
    }).format(value);
  };

  const usageTotals = localUsageSnapshot?.totals ?? null;
  const usageDays = localUsageSnapshot?.days ?? [];
  const usageChartDays = usageDays;
  const usageChartScrollRef = useRef<HTMLDivElement | null>(null);
  const last7Days = usageDays.slice(-7);

  useEffect(() => {
    const chartScrollElement = usageChartScrollRef.current;
    if (!chartScrollElement) {
      return;
    }
    chartScrollElement.scrollLeft = chartScrollElement.scrollWidth;
  }, [usageChartDays.length]);

  const last7AgentMs = last7Days.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const last30AgentMs = usageDays.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const averageDailyAgentMs =
    last7Days.length > 0 ? Math.round(last7AgentMs / last7Days.length) : 0;
  const last7AgentRuns = last7Days.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const peakAgentDay = usageDays.reduce<
    | { day: string; agentTimeMs: number }
    | null
  >((best, day) => {
    const value = day.agentTimeMs ?? 0;
    if (value <= 0) {
      return best;
    }
    if (!best || value > best.agentTimeMs) {
      return { day: day.day, agentTimeMs: value };
    }
    return best;
  }, null);
  const peakAgentDayLabel = peakAgentDay?.day ?? null;
  const peakAgentTimeMs = peakAgentDay?.agentTimeMs ?? 0;
  const maxUsageValue = Math.max(
    1,
    ...usageChartDays.map((day) =>
      usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0,
    ),
  );
  const updatedLabel = localUsageSnapshot
    ? `Updated ${formatRelativeTime(localUsageSnapshot.updatedAt)}`
    : null;
  const showUsageSkeleton = isLoadingLocalUsage && !localUsageSnapshot;
  const showUsageEmpty = !isLoadingLocalUsage && !localUsageSnapshot;
  const buildModelCostPreview = (
    modelUsage: Array<{
      model: string;
      inputTokens: number;
      cachedInputTokens: number;
      outputTokens: number;
    }>,
  ): ModelCostPreviewData => {
    const rows = modelUsage
      .map((entry) => {
        const inputTokens = Math.max(0, entry.inputTokens ?? 0);
        const cachedInputTokens = Math.max(
          0,
          Math.min(entry.cachedInputTokens ?? 0, inputTokens),
        );
        const outputTokens = Math.max(0, entry.outputTokens ?? 0);
        const totalTokens = Math.max(0, inputTokens + outputTokens);
        const pricing = MODEL_API_PRICING_PER_1M[normalizeModelKey(entry.model)] ?? null;
        const uncachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
        const estimatedCostUsd = pricing
          ? (uncachedInputTokens / 1_000_000) * pricing.input +
            (cachedInputTokens / 1_000_000) * pricing.cachedInput +
            (outputTokens / 1_000_000) * pricing.output
          : null;
        return {
          model: entry.model,
          inputTokens,
          cachedInputTokens,
          outputTokens,
          totalTokens,
          pricing,
          estimatedCostUsd,
        };
      })
      .sort((left, right) => right.totalTokens - left.totalTokens);
    const pricedRows = rows.filter((row) => row.estimatedCostUsd !== null);
    return {
      rows,
      pricedModelCount: pricedRows.length,
      unpricedModelCount: rows.length - pricedRows.length,
      estimatedTotalUsd:
        pricedRows.length > 0
          ? pricedRows.reduce((sum, row) => sum + (row.estimatedCostUsd ?? 0), 0)
          : null,
    };
  };

  const allTimeModelUsage = localUsageSnapshot?.modelUsage?.allTime ?? localUsageSnapshot?.topModels ?? [];
  const last30ModelUsage = localUsageSnapshot?.modelUsage?.last30Days ?? [];
  const last7ModelUsage = localUsageSnapshot?.modelUsage?.last7Days ?? [];

  const allTimeCostPreview = buildModelCostPreview(allTimeModelUsage);
  const last30CostPreview = buildModelCostPreview(last30ModelUsage);
  const last7CostPreview = buildModelCostPreview(last7ModelUsage);
  const normalizedPlanType = (accountPlanType ?? "").trim().toLowerCase();
  const matchedPlan = normalizedPlanType.includes("pro")
    ? { label: "ChatGPT Pro", monthlyCostUsd: 200 }
    : normalizedPlanType.includes("plus")
      ? { label: "ChatGPT Plus", monthlyCostUsd: 20 }
      : null;
  const savingsApiEquivalent30dUsd = last30CostPreview.estimatedTotalUsd;
  const savingsPlanCostUsd = matchedPlan?.monthlyCostUsd ?? null;
  const savingsDelta30dUsd =
    savingsApiEquivalent30dUsd !== null && savingsPlanCostUsd !== null
      ? savingsApiEquivalent30dUsd - savingsPlanCostUsd
      : null;

  const modelUsageChipRows = [...allTimeModelUsage]
    .sort((left, right) => right.tokens - left.tokens)
    .filter((model) => normalizeModelKey(model.model) !== "unknown")
    .slice(0, 4);

  const renderCostPreview = (label: string, preview: ModelCostPreviewData) => (
    <div className="home-usage-cost-preview" role="tooltip">
      <div className="home-usage-cost-preview-title">
        API price preview ({label})
      </div>
      <div className="home-usage-cost-preview-total">
        Estimated total: {formatUsd(preview.estimatedTotalUsd)}
      </div>
      <div className="home-usage-cost-preview-meta">
        Based on {preview.pricedModelCount} priced model
        {preview.pricedModelCount === 1 ? "" : "s"}
        {preview.unpricedModelCount > 0
          ? ` · ${preview.unpricedModelCount} model${preview.unpricedModelCount === 1 ? "" : "s"} without mapped API pricing`
          : ""}
      </div>
      <div className="home-usage-cost-preview-list">
        {preview.rows.length > 0 ? (
          preview.rows.map((model) => (
            <div className="home-usage-cost-preview-row" key={`${label}-${model.model}`}>
              <div className="home-usage-cost-preview-model">
                {model.model}
                {model.pricing?.assumedFrom ? (
                  <span className="home-usage-cost-preview-note">
                    (assumed as {model.pricing.assumedFrom})
                  </span>
                ) : null}
              </div>
              <div className="home-usage-cost-preview-tokens">
                in {formatCount(model.inputTokens)} · cached{" "}
                {formatCount(model.cachedInputTokens)} · out {formatCount(model.outputTokens)}
              </div>
              <div className="home-usage-cost-preview-price">
                {model.estimatedCostUsd !== null
                  ? formatUsd(model.estimatedCostUsd)
                  : "No price mapping"}
              </div>
            </div>
          ))
        ) : (
          <div className="home-usage-cost-preview-empty">
            No model usage data yet.
          </div>
        )}
      </div>
      <div className="home-usage-cost-preview-footnote">
        Rates are USD per 1M tokens.
      </div>
    </div>
  );

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-title">Codex Monitor</div>
        <div className="home-subtitle">
          Orchestrate agents across your local projects.
        </div>
      </div>
      <div className="home-latest">
        <div className="home-latest-header">
          <div className="home-latest-label">Latest agents</div>
        </div>
        {latestAgentRuns.length > 0 ? (
          <div className="home-latest-grid">
            {latestAgentRuns.map((run) => (
              <button
                className="home-latest-card home-latest-card-button"
                key={run.threadId}
                onClick={() => onSelectThread(run.workspaceId, run.threadId)}
                type="button"
              >
                <div className="home-latest-card-header">
                  <div className="home-latest-project">
                    <span className="home-latest-project-name">{run.projectName}</span>
                    {run.groupName && (
                      <span className="home-latest-group">{run.groupName}</span>
                    )}
                  </div>
                  <div className="home-latest-time">
                    {formatRelativeTime(run.timestamp)}
                  </div>
                </div>
                <div className="home-latest-message">
                  {run.message.trim() || "Agent replied."}
                </div>
                {run.isProcessing && (
                  <div className="home-latest-status">Running</div>
                )}
              </button>
            ))}
          </div>
        ) : isLoadingLatestAgents ? (
          <div className="home-latest-grid home-latest-grid-loading" aria-label="Loading agents">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="home-latest-card home-latest-card-skeleton" key={index}>
                <div className="home-latest-card-header">
                  <span className="home-latest-skeleton home-latest-skeleton-title" />
                  <span className="home-latest-skeleton home-latest-skeleton-time" />
                </div>
                <span className="home-latest-skeleton home-latest-skeleton-line" />
                <span className="home-latest-skeleton home-latest-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-latest-empty">
            <div className="home-latest-empty-title">No agent activity yet</div>
            <div className="home-latest-empty-subtitle">
              Start a thread to see the latest responses here.
            </div>
          </div>
        )}
      </div>
      <div className="home-actions">
        <button
          className="home-button primary"
          onClick={onOpenProject}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            <FolderOpen size={18} />
          </span>
          Open Project
        </button>
        <button
          className="home-button secondary"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            +
          </span>
          Add Workspace
        </button>
      </div>
      <div className="home-usage">
        <div className="home-section-header">
          <div className="home-section-title">Usage snapshot</div>
          <div className="home-section-meta-row">
            {updatedLabel && <div className="home-section-meta">{updatedLabel}</div>}
            <button
              type="button"
              className={
                isLoadingLocalUsage
                  ? "home-usage-refresh is-loading"
                  : "home-usage-refresh"
              }
              onClick={onRefreshLocalUsage}
              disabled={isLoadingLocalUsage}
              aria-label="Refresh usage"
              title="Refresh usage"
            >
              <RefreshCw
                className={
                  isLoadingLocalUsage
                    ? "home-usage-refresh-icon spinning"
                    : "home-usage-refresh-icon"
                }
                aria-hidden
              />
            </button>
          </div>
        </div>
        <div className="home-usage-controls">
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">Workspace</span>
            <div className="home-usage-select-wrap">
              <select
                className="home-usage-select"
                value={usageWorkspaceId ?? ""}
                onChange={(event) =>
                  onUsageWorkspaceChange(event.target.value || null)
                }
                disabled={usageWorkspaceOptions.length === 0}
              >
                <option value="">All workspaces</option>
                {usageWorkspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">View</span>
            <div className="home-usage-toggle" role="group" aria-label="Usage view">
              <button
                type="button"
                className={
                  usageMetric === "tokens"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("tokens")}
                aria-pressed={usageMetric === "tokens"}
              >
                Tokens
              </button>
              <button
                type="button"
                className={
                  usageMetric === "time"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("time")}
                aria-pressed={usageMetric === "time"}
              >
                Time
              </button>
            </div>
          </div>
        </div>
        {showUsageSkeleton ? (
          <div className="home-usage-skeleton">
            <div className="home-usage-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="home-usage-card" key={index}>
                  <span className="home-latest-skeleton home-usage-skeleton-label" />
                  <span className="home-latest-skeleton home-usage-skeleton-value" />
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <span className="home-latest-skeleton home-usage-skeleton-chart" />
            </div>
          </div>
        ) : showUsageEmpty ? (
          <div className="home-usage-empty">
            <div className="home-usage-empty-title">No usage data yet</div>
            <div className="home-usage-empty-subtitle">
              Run a Codex session to start tracking local usage.
            </div>
            {localUsageError && (
              <div className="home-usage-error">{localUsageError}</div>
            )}
          </div>
        ) : (
          <>
            <div className="home-usage-grid">
              {usageMetric === "tokens" ? (
                <>
                  <div className="home-usage-card home-usage-card-with-preview" tabIndex={0}>
                    <div className="home-usage-label">Last 7 days</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatCompactNumber(usageTotals?.last7DaysTokens)}
                      </span>
                      <span className="home-usage-suffix">tokens</span>
                    </div>
                    <div className="home-usage-caption">
                      Avg {formatCompactNumber(usageTotals?.averageDailyTokens)} / day
                    </div>
                    {renderCostPreview("last 7 days", last7CostPreview)}
                  </div>
                  <div className="home-usage-card home-usage-card-with-preview" tabIndex={0}>
                    <div className="home-usage-label">Last 30 days</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatCompactNumber(usageTotals?.last30DaysTokens)}
                      </span>
                      <span className="home-usage-suffix">tokens</span>
                    </div>
                    <div className="home-usage-caption">
                      Total {formatCount(usageTotals?.last30DaysTokens)}
                    </div>
                    {renderCostPreview("last 30 days", last30CostPreview)}
                  </div>
                  <div
                    className="home-usage-card home-usage-card-with-preview home-usage-card-with-right-preview"
                    tabIndex={0}
                  >
                    <div className="home-usage-label">All time</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatCompactNumber(usageTotals?.allTimeTokens)}
                      </span>
                      <span className="home-usage-suffix">tokens</span>
                    </div>
                    <div className="home-usage-caption">
                      Total {formatCount(usageTotals?.allTimeTokens)}
                    </div>
                    {renderCostPreview("all time", allTimeCostPreview)}
                  </div>
                  <div className="home-usage-card">
                    <div className="home-usage-label">Peak day</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatDayLabel(usageTotals?.peakDay)}
                      </span>
                    </div>
                    <div className="home-usage-caption">
                      {formatCompactNumber(usageTotals?.peakDayTokens)} tokens
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="home-usage-card">
                    <div className="home-usage-label">Last 7 days</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatDurationCompact(last7AgentMs)}
                      </span>
                      <span className="home-usage-suffix">agent time</span>
                    </div>
                    <div className="home-usage-caption">
                      Avg {formatDurationCompact(averageDailyAgentMs)} / day
                    </div>
                  </div>
                  <div className="home-usage-card">
                    <div className="home-usage-label">Last 30 days</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatDurationCompact(last30AgentMs)}
                      </span>
                      <span className="home-usage-suffix">agent time</span>
                    </div>
                    <div className="home-usage-caption">
                      Total {formatDuration(last30AgentMs)}
                    </div>
                  </div>
                  <div className="home-usage-card">
                    <div className="home-usage-label">Runs</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatCount(last7AgentRuns)}
                      </span>
                      <span className="home-usage-suffix">runs</span>
                    </div>
                    <div className="home-usage-caption">Last 7 days</div>
                  </div>
                  <div className="home-usage-card">
                    <div className="home-usage-label">Peak day</div>
                    <div className="home-usage-value">
                      <span className="home-usage-number">
                        {formatDayLabel(peakAgentDayLabel)}
                      </span>
                    </div>
                    <div className="home-usage-caption">
                      {formatDurationCompact(peakAgentTimeMs)} agent time
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="home-usage-chart-card">
              <div className="home-usage-chart-scroll" ref={usageChartScrollRef}>
                <div
                  className="home-usage-chart"
                  style={{
                    width: `max(100%, ${Math.max(usageChartDays.length, 7) * 52}px)`,
                  }}
                >
                  {usageChartDays.map((day) => {
                    const value =
                      usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0;
                    const height = Math.max(
                      6,
                      Math.round((value / maxUsageValue) * 100),
                    );
                    const tooltip =
                      usageMetric === "tokens"
                        ? `${formatDayLabel(day.day)} · ${formatCount(day.totalTokens)} tokens`
                        : `${formatDayLabel(day.day)} · ${formatDuration(day.agentTimeMs ?? 0)} agent time`;
                    return (
                      <div
                        className="home-usage-bar"
                        key={day.day}
                        data-value={tooltip}
                      >
                        <span
                          className="home-usage-bar-fill"
                          style={{ height: `${height}%` }}
                        />
                        <span className="home-usage-bar-label">
                          {formatDayLabel(day.day)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="home-usage-models">
              <div className="home-usage-models-label">
                Top models
                {usageMetric === "time" && (
                  <span className="home-usage-models-hint">Tokens</span>
                )}
              </div>
              <div className="home-usage-models-list">
                {modelUsageChipRows.length ? (
                  modelUsageChipRows.map((model) => (
                    <span
                      className="home-usage-model-chip"
                      key={model.model}
                      title={`${model.model}: ${formatCount(model.tokens)} tokens`}
                    >
                      {model.model}
                      <span className="home-usage-model-share">
                        {model.sharePercent.toFixed(1)}%
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="home-usage-model-empty">No models yet</span>
                )}
              </div>
              {localUsageError && (
                <div className="home-usage-error">{localUsageError}</div>
              )}
            </div>
            <div className="home-usage-savings">
              <div className="home-usage-savings-label">Estimated 30-day savings</div>
              <div className="home-usage-savings-value">
                {formatUsd(savingsDelta30dUsd)}
              </div>
              <div className="home-usage-savings-caption">
                API equivalent {formatUsd(savingsApiEquivalent30dUsd)} vs{" "}
                {matchedPlan
                  ? `${matchedPlan.label} (${formatUsd(matchedPlan.monthlyCostUsd)} / month)`
                  : "recognized plan pricing"}
              </div>
              <div className="home-usage-savings-note">
                {matchedPlan
                  ? "Positive means subscription is cheaper than equivalent API usage."
                  : "Plan pricing not detected from current Codex account data yet. Uses priced models only."}
              </div>
            </div>
            <div className="home-usage-footer">
              <span className="home-usage-footer-label">Cache hit rate</span>
              <span className="home-usage-footer-value">
                {usageTotals ? `${usageTotals.cacheHitRatePercent.toFixed(1)}%` : "--"}
              </span>
              <span className="home-usage-footer-caption">Last 7 days</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
