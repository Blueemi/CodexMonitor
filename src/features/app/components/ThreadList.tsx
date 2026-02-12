import type { CSSProperties, MouseEvent } from "react";

import type { ThreadSummary } from "../../../types";

type ThreadStatusMap = Record<
  string,
  { isProcessing: boolean; hasUnread: boolean; isReviewing: boolean }
>;

type ThreadRow = {
  thread: ThreadSummary;
  depth: number;
};

type ThreadListProps = {
  workspaceId: string;
  pinnedRows: ThreadRow[];
  unpinnedRows: ThreadRow[];
  totalThreadRoots: number;
  isExpanded: boolean;
  nextCursor: string | null;
  isPaging: boolean;
  nested?: boolean;
  showLoadOlder?: boolean;
  activeWorkspaceId: string | null;
  activeThreadId: string | null;
  threadStatusById: ThreadStatusMap;
  getThreadTime: (thread: ThreadSummary) => string | null;
  isThreadPinned: (workspaceId: string, threadId: string) => boolean;
  onToggleExpanded: (workspaceId: string) => void;
  onLoadOlderThreads: (workspaceId: string) => void;
  onSelectThread: (workspaceId: string, threadId: string) => void;
  onShowThreadMenu: (
    event: MouseEvent,
    workspaceId: string,
    threadId: string,
    canPin: boolean,
  ) => void;
};

export function ThreadList({
  workspaceId,
  pinnedRows,
  unpinnedRows,
  totalThreadRoots,
  isExpanded,
  nextCursor,
  isPaging,
  nested,
  showLoadOlder = true,
  activeWorkspaceId,
  activeThreadId,
  threadStatusById,
  getThreadTime,
  isThreadPinned,
  onToggleExpanded,
  onLoadOlderThreads,
  onSelectThread,
  onShowThreadMenu,
}: ThreadListProps) {
  const indentUnit = nested ? 10 : 14;
  const renderThreadRow = ({ thread, depth }: ThreadRow) => {
    const relativeTime = getThreadTime(thread);
    const indentStyle =
      depth > 0
        ? ({ "--thread-indent": `${depth * indentUnit}px` } as CSSProperties)
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
        key={thread.id}
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
        {isPinned && <span className="thread-pin-icon" aria-label="Pinned">📌</span>}
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
  };

  return (
    <div className={`thread-list${nested ? " thread-list-nested" : ""}`}>
      {pinnedRows.map((row) => renderThreadRow(row))}
      {pinnedRows.length > 0 && unpinnedRows.length > 0 && (
        <div className="thread-list-separator" aria-hidden="true" />
      )}
      {unpinnedRows.map((row) => renderThreadRow(row))}
      {totalThreadRoots > 3 && (
        <button
          className="thread-more"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpanded(workspaceId);
          }}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
      {showLoadOlder && nextCursor && (isExpanded || totalThreadRoots <= 3) && (
        <button
          className="thread-more"
          onClick={(event) => {
            event.stopPropagation();
            onLoadOlderThreads(workspaceId);
          }}
          disabled={isPaging}
        >
          {isPaging
            ? "Loading..."
            : totalThreadRoots === 0
              ? "Search older..."
              : "Load older..."}
        </button>
      )}
    </div>
  );
}
