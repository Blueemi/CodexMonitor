// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceInfo } from "../../../types";
import { WorktreeCard } from "./WorktreeCard";

const worktree: WorkspaceInfo = {
  id: "wt-1",
  name: "Worktree One",
  path: "/tmp/worktree",
  connected: true,
  kind: "worktree",
  worktree: { branch: "feature/test" },
  settings: { sidebarCollapsed: true },
};

describe("WorktreeCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles collapse when clicking the worktree row", () => {
    const onSelectWorkspace = vi.fn();
    const onToggleWorkspaceCollapse = vi.fn();
    render(
      <WorktreeCard
        worktree={worktree}
        isActive={false}
        onSelectWorkspace={onSelectWorkspace}
        onShowWorktreeMenu={vi.fn()}
        onToggleWorkspaceCollapse={onToggleWorkspaceCollapse}
        onConnectWorkspace={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /worktree one/i }));

    expect(onSelectWorkspace).toHaveBeenCalledWith("wt-1");
    expect(onToggleWorkspaceCollapse).toHaveBeenCalledWith("wt-1", false);
  });

  it("does not toggle on click when deleting", () => {
    const onSelectWorkspace = vi.fn();
    const onToggleWorkspaceCollapse = vi.fn();
    render(
      <WorktreeCard
        worktree={worktree}
        isActive={false}
        isDeleting
        onSelectWorkspace={onSelectWorkspace}
        onShowWorktreeMenu={vi.fn()}
        onToggleWorkspaceCollapse={onToggleWorkspaceCollapse}
        onConnectWorkspace={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /worktree one/i }));

    expect(onSelectWorkspace).not.toHaveBeenCalled();
    expect(onToggleWorkspaceCollapse).not.toHaveBeenCalled();
  });
});
