import type { Dispatch, SetStateAction } from "react";
import type { LaunchScriptEntry, LaunchScriptIconId, WorkspaceInfo } from "../../../../types";
import { pushErrorToast } from "../../../../services/toasts";
import { LaunchScriptIconPicker } from "../../../app/components/LaunchScriptIconPicker";
import { SettingsMenuSelect } from "../SettingsMenuSelect";

type SettingsEnvironmentsSectionProps = {
  mainWorkspaces: WorkspaceInfo[];
  environmentWorkspace: WorkspaceInfo | null;
  environmentSaving: boolean;
  environmentError: string | null;
  environmentDraftScript: string;
  environmentSavedScript: string | null;
  environmentDirty: boolean;
  environmentActionsDraft: LaunchScriptEntry[];
  environmentActionsDirty: boolean;
  environmentActionsSaving: boolean;
  environmentActionsError: string | null;
  onSetEnvironmentWorkspaceId: Dispatch<SetStateAction<string | null>>;
  onSetEnvironmentDraftScript: Dispatch<SetStateAction<string>>;
  onSaveEnvironmentSetup: () => Promise<void>;
  onAddEnvironmentAction: () => void;
  onRemoveEnvironmentAction: (id: string) => void;
  onUpdateEnvironmentActionLabel: (id: string, value: string) => void;
  onUpdateEnvironmentActionIcon: (id: string, value: LaunchScriptIconId) => void;
  onUpdateEnvironmentActionScript: (id: string, value: string) => void;
  onResetEnvironmentActions: () => void;
  onSaveEnvironmentActions: () => Promise<void>;
};

export function SettingsEnvironmentsSection({
  mainWorkspaces,
  environmentWorkspace,
  environmentSaving,
  environmentError,
  environmentDraftScript,
  environmentSavedScript,
  environmentDirty,
  environmentActionsDraft,
  environmentActionsDirty,
  environmentActionsSaving,
  environmentActionsError,
  onSetEnvironmentWorkspaceId,
  onSetEnvironmentDraftScript,
  onSaveEnvironmentSetup,
  onAddEnvironmentAction,
  onRemoveEnvironmentAction,
  onUpdateEnvironmentActionLabel,
  onUpdateEnvironmentActionIcon,
  onUpdateEnvironmentActionScript,
  onResetEnvironmentActions,
  onSaveEnvironmentActions,
}: SettingsEnvironmentsSectionProps) {
  return (
    <section className="settings-section">
      <div className="settings-section-title">Environments</div>
      <div className="settings-section-subtitle">
        Configure per-project setup scripts that run after worktree creation.
      </div>
      {mainWorkspaces.length === 0 ? (
        <div className="settings-empty">No projects yet.</div>
      ) : (
        <>
          <div className="settings-field">
            <label className="settings-field-label" htmlFor="settings-environment-project">
              Project
            </label>
            <SettingsMenuSelect
              id="settings-environment-project"
              className="settings-select"
              value={environmentWorkspace?.id ?? ""}
              onChange={(workspaceId) => onSetEnvironmentWorkspaceId(workspaceId)}
              disabled={environmentSaving}
              options={mainWorkspaces.map((workspace) => ({
                value: workspace.id,
                label: workspace.name,
              }))}
            />
            {environmentWorkspace ? (
              <div className="settings-help">{environmentWorkspace.path}</div>
            ) : null}
          </div>

          <div className="settings-field">
            <div className="settings-field-label">Setup script</div>
            <div className="settings-help">
              Runs once in a dedicated terminal after each new worktree is created.
            </div>
            {environmentError ? (
              <div className="settings-agents-error">{environmentError}</div>
            ) : null}
            <textarea
              className="settings-agents-textarea"
              value={environmentDraftScript}
              onChange={(event) => onSetEnvironmentDraftScript(event.target.value)}
              placeholder="pnpm install"
              spellCheck={false}
              disabled={environmentSaving}
            />
            <div className="settings-field-actions">
              <button
                type="button"
                className="ghost settings-button-compact"
                onClick={() => {
                  const clipboard = typeof navigator === "undefined" ? null : navigator.clipboard;
                  if (!clipboard?.writeText) {
                    pushErrorToast({
                      title: "Copy failed",
                      message:
                        "Clipboard access is unavailable in this environment. Copy the script manually instead.",
                    });
                    return;
                  }

                  void clipboard.writeText(environmentDraftScript).catch(() => {
                    pushErrorToast({
                      title: "Copy failed",
                      message:
                        "Could not write to the clipboard. Copy the script manually instead.",
                    });
                  });
                }}
                disabled={environmentSaving || environmentDraftScript.length === 0}
              >
                Copy
              </button>
              <button
                type="button"
                className="ghost settings-button-compact"
                onClick={() => onSetEnvironmentDraftScript(environmentSavedScript ?? "")}
                disabled={environmentSaving || !environmentDirty}
              >
                Reset
              </button>
              <button
                type="button"
                className="primary settings-button-compact"
                onClick={() => {
                  void onSaveEnvironmentSetup();
                }}
                disabled={environmentSaving || !environmentDirty}
              >
                {environmentSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="settings-field">
            <div className="settings-field-label">One-click actions</div>
            <div className="settings-help">
              Actions from <code>.codex/environments/environment.toml</code> that appear in the
              top bar launcher.
            </div>
            {environmentActionsError ? (
              <div className="settings-agents-error">{environmentActionsError}</div>
            ) : null}
            <div className="settings-environment-actions-list">
              {environmentActionsDraft.length === 0 ? (
                <div className="settings-empty">No actions configured.</div>
              ) : (
                environmentActionsDraft.map((action, index) => (
                  <div className="settings-environment-action-card" key={action.id}>
                    <div className="settings-environment-action-header">
                      <div className="settings-field-label">Action {index + 1}</div>
                      <button
                        type="button"
                        className="ghost settings-button-compact"
                        onClick={() => onRemoveEnvironmentAction(action.id)}
                        disabled={environmentActionsSaving}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="settings-field">
                      <label
                        className="settings-field-label"
                        htmlFor={`settings-environment-action-name-${action.id}`}
                      >
                        Name
                      </label>
                      <input
                        id={`settings-environment-action-name-${action.id}`}
                        className="settings-input"
                        value={action.label ?? ""}
                        onChange={(event) =>
                          onUpdateEnvironmentActionLabel(action.id, event.target.value)
                        }
                        placeholder="Run"
                        disabled={environmentActionsSaving}
                      />
                    </div>
                    <div className="settings-field">
                      <div className="settings-field-label">Icon</div>
                      <LaunchScriptIconPicker
                        value={action.icon}
                        onChange={(value) =>
                          onUpdateEnvironmentActionIcon(action.id, value as LaunchScriptIconId)
                        }
                      />
                    </div>
                    <div className="settings-field">
                      <label
                        className="settings-field-label"
                        htmlFor={`settings-environment-action-command-${action.id}`}
                      >
                        Command
                      </label>
                      <textarea
                        id={`settings-environment-action-command-${action.id}`}
                        className="settings-agents-textarea"
                        value={action.script}
                        onChange={(event) =>
                          onUpdateEnvironmentActionScript(action.id, event.target.value)
                        }
                        placeholder="npm run dev"
                        spellCheck={false}
                        disabled={environmentActionsSaving}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="settings-field-actions">
              <button
                type="button"
                className="ghost settings-button-compact"
                onClick={onAddEnvironmentAction}
                disabled={environmentActionsSaving}
              >
                Add action
              </button>
              <button
                type="button"
                className="ghost settings-button-compact"
                onClick={onResetEnvironmentActions}
                disabled={environmentActionsSaving || !environmentActionsDirty}
              >
                Reset
              </button>
              <button
                type="button"
                className="primary settings-button-compact"
                onClick={() => {
                  void onSaveEnvironmentActions();
                }}
                disabled={environmentActionsSaving || !environmentActionsDirty}
              >
                {environmentActionsSaving ? "Saving..." : "Save actions"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
