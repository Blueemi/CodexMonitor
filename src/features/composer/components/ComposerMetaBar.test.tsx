// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ComposerMetaBar } from "./ComposerMetaBar";

function MetaBarHarness({
  onModeChange,
}: {
  onModeChange?: (mode: "local" | "worktree") => void;
}) {
  const [mode, setMode] = useState<"local" | "worktree">("local");
  return (
    <ComposerMetaBar
      disabled={false}
      collaborationModes={[]}
      selectedCollaborationModeId={null}
      onSelectCollaborationMode={() => {}}
      accessMode="full-access"
      onSelectAccessMode={() => {}}
      agentMode={mode}
      onSelectAgentMode={(nextMode) => {
        setMode(nextMode);
        onModeChange?.(nextMode);
      }}
      contextUsage={null}
    />
  );
}

describe("ComposerMetaBar", () => {
  it("switches new agent mode to worktree", () => {
    const onModeChange = vi.fn();
    render(<MetaBarHarness onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: "New agent mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Worktree" }));

    expect(onModeChange).toHaveBeenCalledWith("worktree");
    expect(screen.getByRole("button", { name: "New agent mode" }).textContent).toBe(
      "Worktree",
    );
  });
});
