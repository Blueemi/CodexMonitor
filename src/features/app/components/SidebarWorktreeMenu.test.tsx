// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

afterEach(() => {
  cleanup();
});

const baseProps = {
  workspaces: [
    {
      id: "ws-1",
      name: "Workspace",
      path: "/tmp/workspace",
      connected: true,
      settings: { sidebarCollapsed: false },
    },
    {
      id: "wt-1",
      parentId: "ws-1",
      name: "Worktree One",
      path: "/tmp/worktree",
      connected: true,
      kind: "worktree" as const,
      worktree: { branch: "feature/test" },
      settings: { sidebarCollapsed: false },
    },
  ],
  groupedWorkspaces: [
    {
      id: null,
      name: "Workspaces",
      workspaces: [
        {
          id: "ws-1",
          name: "Workspace",
          path: "/tmp/workspace",
          connected: true,
          settings: { sidebarCollapsed: false },
        },
      ],
    },
  ],
  hasWorkspaceGroups: false,
  deletingWorktreeIds: new Set<string>(),
  newAgentDraftWorkspaceId: null,
  startingDraftThreadWorkspaceId: null,
  threadsByWorkspace: { "ws-1": [], "wt-1": [] },
  threadParentById: {},
  threadStatusById: {},
  threadListLoadingByWorkspace: {},
  threadListPagingByWorkspace: {},
  threadListCursorByWorkspace: {},
  threadListSortKey: "updated_at" as const,
  onSetThreadListSortKey: vi.fn(),
  onRefreshAllThreads: vi.fn(),
  activeWorkspaceId: "ws-1",
  activeThreadId: null,
  accountRateLimits: null,
  usageShowRemaining: false,
  accountInfo: null,
  onSwitchAccount: vi.fn(),
  onCancelSwitchAccount: vi.fn(),
  accountSwitching: false,
  onOpenSettings: vi.fn(),
  onOpenDebug: vi.fn(),
  showDebugButton: false,
  onAddWorkspace: vi.fn(),
  onSelectHome: vi.fn(),
  onSelectWorkspace: vi.fn(),
  onConnectWorkspace: vi.fn(),
  onAddAgent: vi.fn(),
  onToggleWorkspaceCollapse: vi.fn(),
  onSelectThread: vi.fn(),
  onDeleteThread: vi.fn(),
  onSyncThread: vi.fn(),
  pinThread: vi.fn(() => false),
  unpinThread: vi.fn(),
  isThreadPinned: vi.fn(() => false),
  getPinTimestamp: vi.fn(() => null),
  onRenameThread: vi.fn(),
  onDeleteWorkspace: vi.fn(),
  onDeleteWorktree: vi.fn(),
  onLoadOlderThreads: vi.fn(),
  onReloadWorkspaceThreads: vi.fn(),
  workspaceDropTargetRef: createRef<HTMLElement>(),
  isWorkspaceDropActive: false,
  workspaceDropText: "Drop Project Here",
  onWorkspaceDragOver: vi.fn(),
  onWorkspaceDragEnter: vi.fn(),
  onWorkspaceDragLeave: vi.fn(),
  onWorkspaceDrop: vi.fn(),
};

describe("Sidebar worktree menu", () => {
  it("opens the custom context menu and triggers delete", () => {
    const onDeleteWorktree = vi.fn();
    render(<Sidebar {...baseProps} onDeleteWorktree={onDeleteWorktree} />);

    const worktreeLabel = screen.getByText("Worktree One");
    const worktreeRow = worktreeLabel.closest(".worktree-row");
    expect(worktreeRow).toBeTruthy();
    fireEvent.contextMenu(worktreeRow as Element, { clientX: 100, clientY: 120 });

    fireEvent.click(screen.getByRole("button", { name: "Delete branch" }));
    expect(onDeleteWorktree).toHaveBeenCalledWith("wt-1");
  });
});
