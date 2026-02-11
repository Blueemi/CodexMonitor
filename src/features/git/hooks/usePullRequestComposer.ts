import { useCallback, useMemo } from "react";
import type {
  AppMention,
  PullRequestReviewAction,
  PullRequestReviewIntent,
  GitHubPullRequest,
  GitHubPullRequestDiff,
  WorkspaceInfo,
} from "../../../types";
import {
  buildPullRequestDraft,
  buildPullRequestPrompt,
} from "../../../utils/pullRequestPrompt";
import { parsePullRequestReviewCommand } from "../utils/pullRequestReviewCommands";

const KNOWN_SLASH_COMMAND_REGEX = /^\/(?:apps|fork|mcp|new|resume|review|status)\b/i;

type ComposerContextAction = {
  id: string;
  label: string;
  title?: string;
  disabled?: boolean;
  onSelect: () => void | Promise<void>;
};

type UsePullRequestComposerOptions = {
  activeWorkspace: WorkspaceInfo | null;
  selectedPullRequest: GitHubPullRequest | null;
  filePanelMode: "git" | "files" | "prompts";
  gitPanelMode: "diff" | "log" | "issues" | "prs";
  centerMode: "chat" | "diff";
  isCompact: boolean;
  setSelectedPullRequest: (pullRequest: GitHubPullRequest | null) => void;
  setDiffSource: (source: "local" | "pr" | "commit") => void;
  setSelectedDiffPath: (path: string | null) => void;
  setCenterMode: (mode: "chat" | "diff") => void;
  setGitPanelMode: (mode: "diff" | "log" | "issues" | "prs") => void;
  setPrefillDraft: (draft: { id: string; text: string; createdAt: number }) => void;
  setActiveTab: (tab: "home" | "projects" | "codex" | "git" | "log") => void;
  pullRequestReviewActions?: PullRequestReviewAction[];
  pullRequestReviewLaunching?: boolean;
  runPullRequestReview?: (options: {
    intent: PullRequestReviewIntent;
    question?: string;
    images?: string[];
    activateThread?: boolean;
  }) => Promise<string | null>;
  gitPullRequestDiffs?: GitHubPullRequestDiff[];
  connectWorkspace?: (workspace: WorkspaceInfo) => Promise<void>;
  startThreadForWorkspace?: (
    workspaceId: string,
    options?: { activate?: boolean },
  ) => Promise<string | null>;
  sendUserMessageToThread?: (
    workspace: WorkspaceInfo,
    threadId: string,
    text: string,
    images?: string[],
    options?: { model?: string | null; effort?: string | null },
    appMentions?: AppMention[],
  ) => Promise<void>;
  clearActiveImages: () => void;
  handleSend: (
    text: string,
    images: string[],
    appMentions?: AppMention[],
  ) => Promise<void>;
  queueMessage: (
    text: string,
    images: string[],
    appMentions?: AppMention[],
  ) => Promise<void>;
};

export function usePullRequestComposer({
  activeWorkspace,
  selectedPullRequest,
  filePanelMode,
  gitPanelMode,
  centerMode,
  isCompact,
  setSelectedPullRequest,
  setDiffSource,
  setSelectedDiffPath,
  setCenterMode,
  setGitPanelMode,
  setPrefillDraft,
  setActiveTab,
  pullRequestReviewActions = [],
  pullRequestReviewLaunching = false,
  runPullRequestReview,
  gitPullRequestDiffs = [],
  connectWorkspace,
  startThreadForWorkspace,
  sendUserMessageToThread,
  clearActiveImages,
  handleSend,
  queueMessage,
}: UsePullRequestComposerOptions) {
  const isPullRequestComposer = useMemo(
    () =>
      Boolean(selectedPullRequest) &&
      filePanelMode === "git" &&
      gitPanelMode === "prs" &&
      centerMode === "diff",
    [centerMode, filePanelMode, gitPanelMode, selectedPullRequest],
  );

  const handleSelectPullRequest = useCallback(
    (pullRequest: GitHubPullRequest) => {
      setSelectedPullRequest(pullRequest);
      setDiffSource("pr");
      setSelectedDiffPath(null);
      setCenterMode("diff");
      setGitPanelMode("prs");
      setPrefillDraft({
        id: `pr-prefill-${pullRequest.number}-${Date.now()}`,
        text: buildPullRequestDraft(pullRequest),
        createdAt: Date.now(),
      });
      if (isCompact) {
        setActiveTab("git");
      }
    },
    [
      isCompact,
      setActiveTab,
      setCenterMode,
      setDiffSource,
      setGitPanelMode,
      setPrefillDraft,
      setSelectedDiffPath,
      setSelectedPullRequest,
    ],
  );

  const resetPullRequestSelection = useCallback(() => {
    setDiffSource("local");
    setSelectedPullRequest(null);
  }, [setDiffSource, setSelectedPullRequest]);

  const runDetachedReview = useCallback(
    async (options: {
      intent: PullRequestReviewIntent;
      question?: string;
      images?: string[];
      activateThread?: boolean;
    }) => {
      if (runPullRequestReview) {
        return runPullRequestReview(options);
      }

      // Backward compatibility path for older UI wiring that still sends a single PR question prompt.
      if (
        options.intent !== "question" ||
        !activeWorkspace ||
        !selectedPullRequest ||
        !connectWorkspace ||
        !startThreadForWorkspace ||
        !sendUserMessageToThread
      ) {
        return null;
      }

      if (!activeWorkspace.connected) {
        await connectWorkspace(activeWorkspace);
      }

      const prompt = buildPullRequestPrompt(
        selectedPullRequest,
        gitPullRequestDiffs,
        options.question?.trim() ?? "",
      );
      const threadId = await startThreadForWorkspace(activeWorkspace.id, {
        activate: false,
      });
      if (!threadId) {
        return null;
      }
      await sendUserMessageToThread(activeWorkspace, threadId, prompt, options.images);
      return threadId;
    },
    [
      activeWorkspace,
      connectWorkspace,
      gitPullRequestDiffs,
      runPullRequestReview,
      selectedPullRequest,
      sendUserMessageToThread,
      startThreadForWorkspace,
    ],
  );

  const handleSendPullRequestQuestion = useCallback(
    async (
      text: string,
      images: string[] = [],
      appMentions: AppMention[] = [],
    ) => {
      if (pullRequestReviewLaunching) {
        return;
      }
      const trimmed = text.trim();
      const reviewCommand = parsePullRequestReviewCommand(trimmed);
      if (reviewCommand && runPullRequestReview) {
        const reviewThreadId = await runDetachedReview({
          intent: reviewCommand.intent,
          question: reviewCommand.question,
          images,
          activateThread: true,
        });
        if (reviewThreadId) {
          clearActiveImages();
        }
        return;
      }
      if (KNOWN_SLASH_COMMAND_REGEX.test(trimmed)) {
        if (appMentions.length > 0) {
          await handleSend(trimmed, images, appMentions);
        } else {
          await handleSend(trimmed, images);
        }
        return;
      }
      if (!activeWorkspace || !selectedPullRequest) {
        return;
      }
      if (!trimmed && images.length === 0) {
        return;
      }
      const reviewThreadId = await runDetachedReview({
        intent: "question",
        question: trimmed,
        images,
        activateThread: true,
      });
      if (reviewThreadId) {
        clearActiveImages();
      }
    },
    [
      activeWorkspace,
      clearActiveImages,
      handleSend,
      selectedPullRequest,
      pullRequestReviewLaunching,
      runDetachedReview,
      runPullRequestReview,
    ],
  );

  const composerContextActions = useMemo<ComposerContextAction[]>(() => {
    if (
      !isPullRequestComposer ||
      !activeWorkspace ||
      !selectedPullRequest ||
      !runPullRequestReview
    ) {
      return [];
    }
    return pullRequestReviewActions.map((action) => ({
      id: action.id,
      label: action.label,
      title: `${action.label} for PR #${selectedPullRequest.number}`,
      disabled: pullRequestReviewLaunching,
      onSelect: async () => {
        const reviewThreadId = await runPullRequestReview({
          intent: action.intent,
          activateThread: true,
        });
        if (reviewThreadId) {
          clearActiveImages();
        }
      },
    }));
  }, [
    activeWorkspace,
    clearActiveImages,
    isPullRequestComposer,
    pullRequestReviewLaunching,
    pullRequestReviewActions,
    runPullRequestReview,
    selectedPullRequest,
  ]);

  const composerSendLabel = isPullRequestComposer ? "Ask PR" : undefined;
  const handleComposerSend = isPullRequestComposer
    ? handleSendPullRequestQuestion
    : handleSend;
  const handleComposerQueue = isPullRequestComposer
    ? handleSendPullRequestQuestion
    : queueMessage;

  return {
    handleSelectPullRequest,
    resetPullRequestSelection,
    isPullRequestComposer,
    composerContextActions,
    composerSendLabel,
    handleComposerSend,
    handleComposerQueue,
  };
}
