import type { ReactNode } from "react";
import { MainTopbar } from "../../app/components/MainTopbar";

type PhoneLayoutProps = {
  approvalToastsNode: ReactNode;
  updateToastNode: ReactNode;
  errorToastsNode: ReactNode;
  tabBarNode: ReactNode;
  homeNode: ReactNode;
  sidebarNode: ReactNode;
  activeTab: "home" | "projects" | "codex" | "git" | "log";
  activeWorkspace: boolean;
  showGitDetail: boolean;
  compactEmptyCodexNode: ReactNode;
  compactEmptyGitNode: ReactNode;
  compactGitBackNode: ReactNode;
  topbarLeftNode: ReactNode;
  messagesNode: ReactNode;
  composerNode: ReactNode;
  gitDiffPanelNode: ReactNode;
  gitDiffViewerNode: ReactNode;
  debugPanelNode: ReactNode;
};

export function PhoneLayout({
  approvalToastsNode,
  updateToastNode,
  errorToastsNode,
  tabBarNode,
  homeNode,
  sidebarNode,
  activeTab,
  activeWorkspace,
  showGitDetail,
  compactEmptyCodexNode,
  compactEmptyGitNode,
  compactGitBackNode,
  topbarLeftNode,
  messagesNode,
  composerNode,
  gitDiffPanelNode,
  gitDiffViewerNode,
  debugPanelNode,
}: PhoneLayoutProps) {
  return (
    <div className="compact-shell" data-active-tab={activeTab}>
      {approvalToastsNode}
      {updateToastNode}
      {errorToastsNode}
      {activeTab === "home" && <div className="compact-panel compact-panel-home">{homeNode}</div>}
      {activeTab === "projects" && (
        <div className="compact-panel compact-panel-projects">{sidebarNode}</div>
      )}
      {activeTab === "codex" && (
        <div className="compact-panel compact-panel-codex">
          {activeWorkspace ? (
            <>
              <MainTopbar leftNode={topbarLeftNode} className="compact-topbar" />
              <div className="content compact-content">{messagesNode}</div>
              {composerNode}
            </>
          ) : (
            compactEmptyCodexNode
          )}
        </div>
      )}
      {activeTab === "git" && (
        <div className="compact-panel compact-panel-git">
          {!activeWorkspace && compactEmptyGitNode}
          {activeWorkspace && showGitDetail && (
            <>
              {compactGitBackNode}
              <div className="compact-git-viewer">{gitDiffViewerNode}</div>
            </>
          )}
          {activeWorkspace && !showGitDetail && (
            <>
              <MainTopbar leftNode={topbarLeftNode} className="compact-topbar" />
              {compactGitBackNode}
              <div className="compact-git">
                <div className="compact-git-list">{gitDiffPanelNode}</div>
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === "log" && (
        <div className="compact-panel compact-panel-log">{debugPanelNode}</div>
      )}
      {tabBarNode}
    </div>
  );
}
