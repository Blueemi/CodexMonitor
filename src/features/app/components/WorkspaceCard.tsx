import type { MouseEvent } from "react";

import Folder from "lucide-react/dist/esm/icons/folder";
import type { WorkspaceInfo } from "../../../types";

type WorkspaceCardProps = {
  workspace: WorkspaceInfo;
  workspaceName?: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onSelectWorkspace: (id: string) => void;
  onShowWorkspaceMenu: (event: MouseEvent, workspaceId: string) => void;
  onToggleWorkspaceCollapse: (workspaceId: string, collapsed: boolean) => void;
  onConnectWorkspace: (workspace: WorkspaceInfo) => void;
  onAddAgent: (workspace: WorkspaceInfo) => void;
  children?: React.ReactNode;
};

export function WorkspaceCard({
  workspace,
  workspaceName,
  isActive,
  isCollapsed,
  onSelectWorkspace,
  onShowWorkspaceMenu,
  onToggleWorkspaceCollapse,
  onConnectWorkspace,
  onAddAgent,
  children,
}: WorkspaceCardProps) {
  const contentCollapsedClass = isCollapsed ? " collapsed" : "";
  const handleToggleRow = () => {
    onSelectWorkspace(workspace.id);
    onToggleWorkspaceCollapse(workspace.id, !isCollapsed);
  };

  return (
    <div className="workspace-card">
      <div
        className={`workspace-row ${isActive ? "active" : ""}`}
        role="button"
        tabIndex={0}
        onClick={handleToggleRow}
        onContextMenu={(event) => onShowWorkspaceMenu(event, workspace.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggleRow();
          }
        }}
      >
        <div>
          <div className="workspace-name-row">
            <div className="workspace-title">
              <Folder className="workspace-folder-icon" aria-hidden />
              <span className="workspace-name">{workspaceName ?? workspace.name}</span>
              <button
                className={`workspace-toggle ${isCollapsed ? "" : "expanded"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleWorkspaceCollapse(workspace.id, !isCollapsed);
                }}
                data-tauri-drag-region="false"
                aria-label={isCollapsed ? "Show agents" : "Hide agents"}
                aria-expanded={!isCollapsed}
              >
                <span className="workspace-toggle-icon">›</span>
              </button>
            </div>
            <button
              className="ghost workspace-add"
              onClick={(event) => {
                event.stopPropagation();
                onAddAgent(workspace);
              }}
              data-tauri-drag-region="false"
              aria-label="New chat"
              title="New chat"
            >
              +
            </button>
          </div>
        </div>
        {!workspace.connected && (
          <span
            className="connect"
            onClick={(event) => {
              event.stopPropagation();
              onConnectWorkspace(workspace);
            }}
          >
            connect
          </span>
        )}
      </div>
      <div
        className={`workspace-card-content${contentCollapsedClass}`}
        aria-hidden={isCollapsed}
        inert={isCollapsed ? true : undefined}
      >
        <div className="workspace-card-content-inner">{children}</div>
      </div>
    </div>
  );
}
