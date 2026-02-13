// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceInfo } from "../../../types";
import { WorkspaceCard } from "./WorkspaceCard";

const workspace: WorkspaceInfo = {
  id: "ws-1",
  name: "Workspace One",
  path: "/tmp/workspace",
  connected: true,
  settings: { sidebarCollapsed: true },
};

describe("WorkspaceCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles collapse when clicking the workspace row", () => {
    const onSelectWorkspace = vi.fn();
    const onToggleWorkspaceCollapse = vi.fn();
    render(
      <WorkspaceCard
        workspace={workspace}
        isActive={false}
        isCollapsed
        onSelectWorkspace={onSelectWorkspace}
        onShowWorkspaceMenu={vi.fn()}
        onToggleWorkspaceCollapse={onToggleWorkspaceCollapse}
        onConnectWorkspace={vi.fn()}
        onAddAgent={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /workspace one/i }));

    expect(onSelectWorkspace).toHaveBeenCalledWith("ws-1");
    expect(onToggleWorkspaceCollapse).toHaveBeenCalledWith("ws-1", false);
  });

  it("keeps icon toggle from bubbling to row click", () => {
    const onSelectWorkspace = vi.fn();
    const onToggleWorkspaceCollapse = vi.fn();
    render(
      <WorkspaceCard
        workspace={{ ...workspace, settings: { sidebarCollapsed: false } }}
        isActive={false}
        isCollapsed={false}
        onSelectWorkspace={onSelectWorkspace}
        onShowWorkspaceMenu={vi.fn()}
        onToggleWorkspaceCollapse={onToggleWorkspaceCollapse}
        onConnectWorkspace={vi.fn()}
        onAddAgent={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide agents" }));

    expect(onSelectWorkspace).not.toHaveBeenCalled();
    expect(onToggleWorkspaceCollapse).toHaveBeenCalledTimes(1);
    expect(onToggleWorkspaceCollapse).toHaveBeenCalledWith("ws-1", true);
  });
});
