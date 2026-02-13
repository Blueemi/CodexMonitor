import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import type { AccessMode, ThreadTokenUsage } from "../../../types";
import Laptop from "lucide-react/dist/esm/icons/laptop";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import { useDismissibleMenu } from "../../app/hooks/useDismissibleMenu";
import {
  PopoverMenuItem,
  PopoverSurface,
} from "../../design-system/components/popover/PopoverPrimitives";

type ComposerMetaBarProps = {
  disabled: boolean;
  collaborationModes: { id: string; label: string }[];
  selectedCollaborationModeId: string | null;
  onSelectCollaborationMode: (id: string | null) => void;
  showCollaborationSelector?: boolean;
  accessMode: AccessMode;
  onSelectAccessMode: (mode: AccessMode) => void;
  agentMode: "local" | "worktree";
  onSelectAgentMode: (mode: "local" | "worktree") => void;
  showWorktreeFromBranch?: boolean;
  worktreeFromBranch?: string;
  worktreeFromBranchOptions?: string[];
  onSelectWorktreeFromBranch?: (branch: string) => void;
  contextUsage?: ThreadTokenUsage | null;
};

export function ComposerMetaBar({
  disabled,
  collaborationModes,
  selectedCollaborationModeId,
  onSelectCollaborationMode,
  showCollaborationSelector = true,
  accessMode,
  onSelectAccessMode,
  agentMode,
  onSelectAgentMode,
  showWorktreeFromBranch = false,
  worktreeFromBranch = "main",
  worktreeFromBranchOptions = [],
  onSelectWorktreeFromBranch,
  contextUsage = null,
}: ComposerMetaBarProps) {
  const [collaborationMenuOpen, setCollaborationMenuOpen] = useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);
  const [worktreeFromBranchMenuOpen, setWorktreeFromBranchMenuOpen] = useState(false);
  const [collaborationMenuAbove, setCollaborationMenuAbove] = useState(false);
  const [agentMenuAbove, setAgentMenuAbove] = useState(false);
  const [accessMenuAbove, setAccessMenuAbove] = useState(false);
  const [worktreeFromBranchMenuAbove, setWorktreeFromBranchMenuAbove] = useState(false);
  const collaborationMenuRef = useRef<HTMLDivElement | null>(null);
  const agentMenuRef = useRef<HTMLDivElement | null>(null);
  const accessMenuRef = useRef<HTMLDivElement | null>(null);
  const worktreeFromBranchMenuRef = useRef<HTMLDivElement | null>(null);
  const collaborationDropdownRef = useRef<HTMLDivElement | null>(null);
  const agentDropdownRef = useRef<HTMLDivElement | null>(null);
  const accessDropdownRef = useRef<HTMLDivElement | null>(null);
  const worktreeFromBranchDropdownRef = useRef<HTMLDivElement | null>(null);

  useDismissibleMenu({
    isOpen: collaborationMenuOpen,
    containerRef: collaborationMenuRef,
    onClose: () => setCollaborationMenuOpen(false),
  });

  useDismissibleMenu({
    isOpen: accessMenuOpen,
    containerRef: accessMenuRef,
    onClose: () => setAccessMenuOpen(false),
  });

  useDismissibleMenu({
    isOpen: agentMenuOpen,
    containerRef: agentMenuRef,
    onClose: () => setAgentMenuOpen(false),
  });

  useDismissibleMenu({
    isOpen: worktreeFromBranchMenuOpen,
    containerRef: worktreeFromBranchMenuRef,
    onClose: () => setWorktreeFromBranchMenuOpen(false),
  });

  useEffect(() => {
    if (!disabled) {
      return;
    }
    setCollaborationMenuOpen(false);
    setAgentMenuOpen(false);
    setAccessMenuOpen(false);
    setWorktreeFromBranchMenuOpen(false);
  }, [disabled]);

  const updateMenuPlacement = useCallback(
    (
      containerRef: RefObject<HTMLDivElement | null>,
      dropdownRef: RefObject<HTMLDivElement | null>,
      setAbove: (above: boolean) => void,
    ) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const dropdownRect = dropdownRef.current?.getBoundingClientRect();
      if (!containerRect || !dropdownRect) {
        setAbove(false);
        return;
      }
      const gap = 8;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - containerRect.bottom - viewportPadding;
      const spaceAbove = containerRect.top - viewportPadding;
      const shouldOpenAbove =
        spaceBelow < dropdownRect.height + gap && spaceAbove > spaceBelow;
      setAbove(shouldOpenAbove);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!collaborationMenuOpen) {
      setCollaborationMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(
        collaborationMenuRef,
        collaborationDropdownRef,
        setCollaborationMenuAbove,
      );
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [collaborationMenuOpen, updateMenuPlacement]);

  useLayoutEffect(() => {
    if (!agentMenuOpen) {
      setAgentMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(agentMenuRef, agentDropdownRef, setAgentMenuAbove);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [agentMenuOpen, updateMenuPlacement]);

  useLayoutEffect(() => {
    if (!accessMenuOpen) {
      setAccessMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(accessMenuRef, accessDropdownRef, setAccessMenuAbove);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [accessMenuOpen, updateMenuPlacement]);

  useLayoutEffect(() => {
    if (!worktreeFromBranchMenuOpen) {
      setWorktreeFromBranchMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(
        worktreeFromBranchMenuRef,
        worktreeFromBranchDropdownRef,
        setWorktreeFromBranchMenuAbove,
      );
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [worktreeFromBranchMenuOpen, updateMenuPlacement]);

  const contextWindow = contextUsage?.modelContextWindow ?? null;
  const lastTokens = contextUsage?.last.totalTokens ?? 0;
  const totalTokens = contextUsage?.total.totalTokens ?? 0;
  const usedTokens = lastTokens > 0 ? lastTokens : totalTokens;
  const contextUsedPercent =
    contextWindow && contextWindow > 0 && usedTokens > 0
      ? Math.min(Math.max((usedTokens / contextWindow) * 100, 0), 100)
      : null;
  const contextUsageLabel =
    contextUsedPercent === null
      ? "Context used --"
      : `Context used ${Math.round(contextUsedPercent)}%`;
  const selectedCollaborationMode =
    collaborationModes.find((mode) => mode.id === selectedCollaborationModeId) ?? null;
  const selectedCollaborationLabel =
    selectedCollaborationMode?.label || selectedCollaborationMode?.id || "Select mode";
  const accessOptions: Array<{ id: AccessMode; label: string }> = [
    { id: "read-only", label: "Read only" },
    { id: "current", label: "On-Request" },
    { id: "full-access", label: "Full access" },
  ];
  const selectedAccessLabel =
    accessOptions.find((option) => option.id === accessMode)?.label ?? "Agent access";
  const agentOptions: Array<{ id: "local" | "worktree"; label: string }> = [
    { id: "local", label: "Local" },
    { id: "worktree", label: "Worktree" },
  ];
  const selectedAgentLabel =
    agentOptions.find((option) => option.id === agentMode)?.label ?? "Local";
  const AgentModeIcon = agentMode === "local" ? Laptop : GitBranch;

  return (
    <div className="composer-bar">
      <div className="composer-meta">
        {showCollaborationSelector && collaborationModes.length > 0 && (
          <div className="composer-select-wrap composer-select-wrap--menu" ref={collaborationMenuRef}>
            <span className="composer-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="m6.5 7.5 1 1 2-2M6.5 12.5l1 1 2-2M6.5 17.5l1 1 2-2M11 7.5h7M11 12.5h7M11 17.5h7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <button
              type="button"
              className="composer-select composer-select--model composer-select--collab"
              aria-label="Collaboration mode"
              aria-haspopup="menu"
              aria-expanded={collaborationMenuOpen}
              onClick={() => {
                setCollaborationMenuOpen((prev) => !prev);
                setAgentMenuOpen(false);
                setAccessMenuOpen(false);
                setWorktreeFromBranchMenuOpen(false);
              }}
              disabled={disabled}
            >
              {selectedCollaborationLabel}
            </button>
            {collaborationMenuOpen && (
              <PopoverSurface
                ref={collaborationDropdownRef}
                className={`composer-select-dropdown${collaborationMenuAbove ? " is-above" : ""}`}
                role="menu"
              >
                {collaborationModes.map((mode) => (
                  <PopoverMenuItem
                    key={mode.id}
                    className="composer-select-option"
                    onClick={() => {
                      onSelectCollaborationMode(mode.id || null);
                      setCollaborationMenuOpen(false);
                    }}
                    active={mode.id === selectedCollaborationModeId}
                  >
                    {mode.label || mode.id}
                  </PopoverMenuItem>
                ))}
              </PopoverSurface>
            )}
          </div>
        )}
        <div
          className="composer-select-wrap composer-select-wrap--menu composer-select-wrap--agent"
          ref={agentMenuRef}
        >
          <span className="composer-icon" aria-hidden>
            <AgentModeIcon size={13} />
          </span>
          <button
            type="button"
            className="composer-select composer-select--agent-mode"
            aria-label="New agent mode"
            aria-haspopup="menu"
            aria-expanded={agentMenuOpen}
            onClick={() => {
              setAgentMenuOpen((prev) => !prev);
              setCollaborationMenuOpen(false);
              setAccessMenuOpen(false);
              setWorktreeFromBranchMenuOpen(false);
            }}
            disabled={disabled}
          >
            {selectedAgentLabel}
          </button>
          {agentMenuOpen && (
            <PopoverSurface
              ref={agentDropdownRef}
              className={`composer-select-dropdown${agentMenuAbove ? " is-above" : ""}`}
              role="menu"
            >
              {agentOptions.map((option) => (
                <PopoverMenuItem
                  key={option.id}
                  className="composer-select-option"
                  onClick={() => {
                    onSelectAgentMode(option.id);
                    setAgentMenuOpen(false);
                  }}
                  active={option.id === agentMode}
                >
                  {option.label}
                </PopoverMenuItem>
              ))}
            </PopoverSurface>
          )}
        </div>
        <div
          className={`composer-select-wrap composer-select-wrap--menu composer-select-wrap--access composer-select-wrap--access-${accessMode}`}
          ref={accessMenuRef}
        >
          <span className="composer-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4l7 3v5c0 4.5-3 7.5-7 8-4-0.5-7-3.5-7-8V7l7-3z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12.5l1.8 1.8 3.7-4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <button
            type="button"
            className="composer-select composer-select--approval"
            aria-label="Agent access"
            aria-haspopup="menu"
            aria-expanded={accessMenuOpen}
            disabled={disabled}
            onClick={() => {
              setAccessMenuOpen((prev) => !prev);
              setCollaborationMenuOpen(false);
              setAgentMenuOpen(false);
              setWorktreeFromBranchMenuOpen(false);
            }}
          >
            {selectedAccessLabel}
          </button>
          {accessMenuOpen && (
            <PopoverSurface
              ref={accessDropdownRef}
              className={`composer-select-dropdown${accessMenuAbove ? " is-above" : ""}`}
              role="menu"
            >
              {accessOptions.map((option) => (
                <PopoverMenuItem
                  key={option.id}
                  className="composer-select-option"
                  onClick={() => {
                    onSelectAccessMode(option.id);
                    setAccessMenuOpen(false);
                  }}
                  active={option.id === accessMode}
                >
                  {option.label}
                </PopoverMenuItem>
              ))}
            </PopoverSurface>
          )}
        </div>
      </div>
      <div className="composer-context">
        {showWorktreeFromBranch && (
          <div
            className="composer-worktree-source-menu composer-worktree-source-menu--inline"
            ref={worktreeFromBranchMenuRef}
          >
            <button
              type="button"
              className="composer-worktree-source-button composer-worktree-source-button--inline"
              aria-label="Worktree base branch"
              aria-haspopup="menu"
              aria-expanded={worktreeFromBranchMenuOpen}
              onClick={() => {
                setWorktreeFromBranchMenuOpen((prev) => !prev);
                setCollaborationMenuOpen(false);
                setAgentMenuOpen(false);
                setAccessMenuOpen(false);
              }}
              disabled={disabled || worktreeFromBranchOptions.length === 0}
            >
              <GitBranch size={13} aria-hidden />
              <span className="composer-worktree-source-text">
                From {worktreeFromBranch || "main"}
              </span>
              <ChevronDown size={13} aria-hidden />
            </button>
            {worktreeFromBranchMenuOpen && (
              <PopoverSurface
                ref={worktreeFromBranchDropdownRef}
                className={`composer-worktree-source-dropdown${
                  worktreeFromBranchMenuAbove ? " is-above" : ""
                }`}
                role="menu"
              >
                {worktreeFromBranchOptions.length === 0 ? (
                  <div className="composer-toolbar-dropdown-empty">No branches</div>
                ) : (
                  worktreeFromBranchOptions.map((branch) => (
                    <PopoverMenuItem
                      key={branch}
                      className="composer-toolbar-option"
                      onClick={() => {
                        onSelectWorktreeFromBranch?.(branch);
                        setWorktreeFromBranchMenuOpen(false);
                      }}
                      active={branch === worktreeFromBranch}
                    >
                      {branch}
                    </PopoverMenuItem>
                  ))
                )}
              </PopoverSurface>
            )}
          </div>
        )}
        <div
          className="composer-context-ring"
          title={contextUsageLabel}
          aria-label={contextUsageLabel}
          style={
            {
              "--context-used": contextUsedPercent ?? 0,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}
