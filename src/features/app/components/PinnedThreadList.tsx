import type { CSSProperties, MouseEvent } from "react";

import type { ThreadSummary } from "../../../types";

type ThreadStatusMap = Record<
  string,
  { isProcessing: boolean; hasUnread: boolean; isReviewing: boolean }
>;

type PinnedThreadRow = {
  thread: ThreadSummary;
  depth: number;
  workspaceId: string;
};

type PinnedThreadListProps = {
  rows: PinnedThreadRow[];
  activeWorkspaceId: string | null;
  activeThreadId: string | null;
  threadStatusById: ThreadStatusMap;
  getThreadTime: (thread: ThreadSummary) => string | null;
  isThreadPinned: (workspaceId: string, threadId: string) => boolean;
  onSelectThread: (workspaceId: string, threadId: string) => void;
  onShowThreadMenu: (
    event: MouseEvent,
    workspaceId: string,
    threadId: string,
    canPin: boolean,
  ) => void;
};

export function PinnedThreadList({
  rows,
  activeWorkspaceId,
  activeThreadId,
  threadStatusById,
  getThreadTime,
  isThreadPinned,
  onSelectThread,
  onShowThreadMenu,
}: PinnedThreadListProps) {
  return (
    <div className="thread-list pinned-thread-list">
      {rows.map(({ thread, depth, workspaceId }) => {
        const relativeTime = getThreadTime(thread);
        const indentStyle =
          depth > 0
            ? ({ "--thread-indent": `${depth * 14}px` } as CSSProperties)
            : undefined;
        const status = threadStatusById[thread.id];
        const statusClass = status?.isReviewing
          ? "reviewing"
          : status?.isProcessing
            ? "processing"
            : status?.hasUnread
              ? "unread"
              : "ready";
        const canPin = depth === 0;
        const isPinned = canPin && isThreadPinned(workspaceId, thread.id);
        const isProcessing = status?.isProcessing ?? false;

        return (
          <div
            key={`${workspaceId}:${thread.id}`}
            className={`thread-row ${
              workspaceId === activeWorkspaceId && thread.id === activeThreadId
                ? "active"
                : ""
            }`}
            data-thread-status={statusClass}
            style={indentStyle}
            onClick={() => onSelectThread(workspaceId, thread.id)}
            onContextMenu={(event) =>
              onShowThreadMenu(event, workspaceId, thread.id, canPin)
            }
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectThread(workspaceId, thread.id);
              }
            }}
          >
            {isProcessing && (
              <span
                className="thread-processing-spinner"
                aria-label="Reply in progress"
              />
            )}
            {isPinned && (
              <span className="thread-pin-icon" aria-label="Pinned">
                📌
              </span>
            )}
            <span className="thread-name">{thread.name}</span>
            <div className="thread-meta">
              {thread.diffStats && (
                <span className="thread-diff-stats">
                  <span className="thread-diff-add">+{thread.diffStats.additions}</span>
                  <span className="thread-diff-del">-{thread.diffStats.deletions}</span>
                </span>
              )}
              {relativeTime && <span className="thread-time">{relativeTime}</span>}
              <div className="thread-menu">
                <div className="thread-menu-trigger" aria-hidden="true" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
