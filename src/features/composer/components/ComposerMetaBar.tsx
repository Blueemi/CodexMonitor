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
  contextUsage = null,
}: ComposerMetaBarProps) {
  const [collaborationMenuOpen, setCollaborationMenuOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);
  const [collaborationMenuAbove, setCollaborationMenuAbove] = useState(false);
  const [accessMenuAbove, setAccessMenuAbove] = useState(false);
  const collaborationMenuRef = useRef<HTMLDivElement | null>(null);
  const accessMenuRef = useRef<HTMLDivElement | null>(null);
  const collaborationDropdownRef = useRef<HTMLDivElement | null>(null);
  const accessDropdownRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!disabled) {
      return;
    }
    setCollaborationMenuOpen(false);
    setAccessMenuOpen(false);
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

  const contextWindow = contextUsage?.modelContextWindow ?? null;
  const lastTokens = contextUsage?.last.totalTokens ?? 0;
  const totalTokens = contextUsage?.total.totalTokens ?? 0;
  const usedTokens = lastTokens > 0 ? lastTokens : totalTokens;
  const contextFreePercent =
    contextWindow && contextWindow > 0 && usedTokens > 0
      ? Math.max(
          0,
          100 -
            Math.min(Math.max((usedTokens / contextWindow) * 100, 0), 100),
        )
      : null;
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
                setAccessMenuOpen(false);
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
        <div
          className="composer-context-ring"
          data-tooltip={
            contextFreePercent === null
              ? "Context free --"
              : `Context free ${Math.round(contextFreePercent)}%`
          }
          aria-label={
            contextFreePercent === null
              ? "Context free --"
              : `Context free ${Math.round(contextFreePercent)}%`
          }
          style={
            {
              "--context-free": contextFreePercent ?? 0,
            } as CSSProperties
          }
        >
          <span className="composer-context-value">●</span>
        </div>
      </div>
    </div>
  );
}
