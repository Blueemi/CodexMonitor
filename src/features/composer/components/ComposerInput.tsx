import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  RefObject,
  SyntheticEvent,
} from "react";
import type { AutocompleteItem } from "../hooks/useComposerAutocomplete";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Mic from "lucide-react/dist/esm/icons/mic";
import Square from "lucide-react/dist/esm/icons/square";
import Brain from "lucide-react/dist/esm/icons/brain";
import GitFork from "lucide-react/dist/esm/icons/git-fork";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import PlusCircle from "lucide-react/dist/esm/icons/plus-circle";
import Plus from "lucide-react/dist/esm/icons/plus";
import Info from "lucide-react/dist/esm/icons/info";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import ScrollText from "lucide-react/dist/esm/icons/scroll-text";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Plug from "lucide-react/dist/esm/icons/plug";
import { useComposerImageDrop } from "../hooks/useComposerImageDrop";
import {
  PopoverMenuItem,
  PopoverSurface,
} from "../../design-system/components/popover/PopoverPrimitives";
import { useDismissibleMenu } from "../../app/hooks/useDismissibleMenu";
import { ComposerAttachments } from "./ComposerAttachments";
import { DictationWaveform } from "../../dictation/components/DictationWaveform";
import { ReviewInlinePrompt } from "./ReviewInlinePrompt";
import type { ReviewPromptState, ReviewPromptStep } from "../../threads/hooks/useReviewPrompt";
import { getFileTypeIconUrl } from "../../../utils/fileTypeIcons";

type ComposerInputProps = {
  text: string;
  disabled: boolean;
  sendLabel: string;
  canStop: boolean;
  canSend: boolean;
  isProcessing: boolean;
  onStop: () => void;
  onSend: () => void;
  dictationState?: "idle" | "listening" | "processing";
  dictationLevel?: number;
  dictationEnabled?: boolean;
  onToggleDictation?: () => void;
  onOpenDictationSettings?: () => void;
  dictationError?: string | null;
  onDismissDictationError?: () => void;
  dictationHint?: string | null;
  onDismissDictationHint?: () => void;
  attachments?: string[];
  onAddAttachment?: () => void;
  onAttachImages?: (paths: string[]) => void;
  onRemoveAttachment?: (path: string) => void;
  onTextChange: (next: string, selectionStart: number | null) => void;
  onTextPaste?: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectionChange: (selectionStart: number | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  suggestionsOpen: boolean;
  suggestions: AutocompleteItem[];
  highlightIndex: number;
  onHighlightIndex: (index: number) => void;
  onSelectSuggestion: (item: AutocompleteItem) => void;
  suggestionsStyle?: React.CSSProperties;
  models: { id: string; displayName: string; model: string }[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  reasoningOptions: string[];
  selectedEffort: string | null;
  onSelectEffort: (effort: string) => void;
  reasoningSupported: boolean;
  showWorktreeFromBranch?: boolean;
  worktreeFromBranch?: string;
  worktreeFromBranchOptions?: string[];
  onSelectWorktreeFromBranch?: (branch: string) => void;
  showPlanToggle?: boolean;
  planLabel?: string;
  planSelected?: boolean;
  onTogglePlanMode?: (enabled: boolean) => void;
  reviewPrompt?: ReviewPromptState;
  onReviewPromptClose?: () => void;
  onReviewPromptShowPreset?: () => void;
  onReviewPromptChoosePreset?: (
    preset: Exclude<ReviewPromptStep, "preset"> | "uncommitted",
  ) => void;
  highlightedPresetIndex?: number;
  onReviewPromptHighlightPreset?: (index: number) => void;
  highlightedBranchIndex?: number;
  onReviewPromptHighlightBranch?: (index: number) => void;
  highlightedCommitIndex?: number;
  onReviewPromptHighlightCommit?: (index: number) => void;
  onReviewPromptSelectBranch?: (value: string) => void;
  onReviewPromptSelectBranchAtIndex?: (index: number) => void;
  onReviewPromptConfirmBranch?: () => Promise<void>;
  onReviewPromptSelectCommit?: (sha: string, title: string) => void;
  onReviewPromptSelectCommitAtIndex?: (index: number) => void;
  onReviewPromptConfirmCommit?: () => Promise<void>;
  onReviewPromptUpdateCustomInstructions?: (value: string) => void;
  onReviewPromptConfirmCustom?: () => Promise<void>;
};

const isFileSuggestion = (item: AutocompleteItem) => item.group === "Files";

const suggestionIcon = (item: AutocompleteItem) => {
  if (isFileSuggestion(item)) {
    return FileText;
  }
  if (item.id.startsWith("skill:")) {
    return Wrench;
  }
  if (item.id.startsWith("app:")) {
    return Plug;
  }
  if (item.id === "review") {
    return Brain;
  }
  if (item.id === "fork") {
    return GitFork;
  }
  if (item.id === "mcp") {
    return Plug;
  }
  if (item.id === "apps") {
    return Plug;
  }
  if (item.id === "new") {
    return PlusCircle;
  }
  if (item.id === "resume") {
    return RotateCcw;
  }
  if (item.id === "status") {
    return Info;
  }
  if (item.id.startsWith("prompt:")) {
    return ScrollText;
  }
  return Wrench;
};

const fileTitle = (path: string) => {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : path;
};

export function ComposerInput({
  text,
  disabled,
  sendLabel,
  canStop,
  canSend,
  isProcessing,
  onStop,
  onSend,
  dictationState = "idle",
  dictationLevel = 0,
  dictationEnabled = false,
  onToggleDictation,
  onOpenDictationSettings,
  dictationError = null,
  onDismissDictationError,
  dictationHint = null,
  onDismissDictationHint,
  attachments = [],
  onAddAttachment,
  onAttachImages,
  onRemoveAttachment,
  onTextChange,
  onTextPaste,
  onSelectionChange,
  onKeyDown,
  isExpanded = false,
  onToggleExpand,
  textareaRef,
  suggestionsOpen,
  suggestions,
  highlightIndex,
  onHighlightIndex,
  onSelectSuggestion,
  suggestionsStyle,
  models,
  selectedModelId,
  onSelectModel,
  reasoningOptions,
  selectedEffort,
  onSelectEffort,
  reasoningSupported,
  showWorktreeFromBranch = false,
  worktreeFromBranch = "main",
  worktreeFromBranchOptions = [],
  onSelectWorktreeFromBranch,
  showPlanToggle = false,
  planLabel = "Plan",
  planSelected = false,
  onTogglePlanMode,
  reviewPrompt,
  onReviewPromptClose,
  onReviewPromptShowPreset,
  onReviewPromptChoosePreset,
  highlightedPresetIndex,
  onReviewPromptHighlightPreset,
  highlightedBranchIndex,
  onReviewPromptHighlightBranch,
  highlightedCommitIndex,
  onReviewPromptHighlightCommit,
  onReviewPromptSelectBranch,
  onReviewPromptSelectBranchAtIndex,
  onReviewPromptConfirmBranch,
  onReviewPromptSelectCommit,
  onReviewPromptSelectCommitAtIndex,
  onReviewPromptConfirmCommit,
  onReviewPromptUpdateCustomInstructions,
  onReviewPromptConfirmCustom,
}: ComposerInputProps) {
  const suggestionListRef = useRef<HTMLDivElement | null>(null);
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileActionsRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const effortMenuRef = useRef<HTMLDivElement | null>(null);
  const worktreeFromBranchMenuRef = useRef<HTMLDivElement | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);
  const effortDropdownRef = useRef<HTMLDivElement | null>(null);
  const worktreeFromBranchDropdownRef = useRef<HTMLDivElement | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [effortMenuOpen, setEffortMenuOpen] = useState(false);
  const [worktreeFromBranchMenuOpen, setWorktreeFromBranchMenuOpen] = useState(false);
  const [modelMenuAbove, setModelMenuAbove] = useState(false);
  const [effortMenuAbove, setEffortMenuAbove] = useState(false);
  const [worktreeFromBranchMenuAbove, setWorktreeFromBranchMenuAbove] = useState(false);
  const [isPhoneLayout, setIsPhoneLayout] = useState(false);
  const [isPhoneTallInput, setIsPhoneTallInput] = useState(false);
  const reviewPromptOpen = Boolean(reviewPrompt);
  const {
    dropTargetRef,
    isDragOver,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handlePaste,
  } = useComposerImageDrop({
    disabled,
    onAttachImages,
  });

  useEffect(() => {
    if (!suggestionsOpen || suggestions.length === 0) {
      return;
    }
    const list = suggestionListRef.current;
    const item = suggestionRefs.current[highlightIndex];
    if (!list || !item) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < listRect.top) {
      item.scrollIntoView({ block: "nearest" });
      return;
    }
    if (itemRect.bottom > listRect.bottom) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, suggestionsOpen, suggestions.length]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const appRoot = textarea.closest(".app");
    if (!(appRoot instanceof HTMLElement)) {
      setIsPhoneLayout(false);
      return;
    }

    const syncLayout = () => {
      const nextIsPhoneLayout = appRoot.classList.contains("layout-phone");
      setIsPhoneLayout((prev) => (prev === nextIsPhoneLayout ? prev : nextIsPhoneLayout));
    };

    syncLayout();
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === "class")) {
        syncLayout();
      }
    });
    observer.observe(appRoot, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
    };
  }, [textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const minTextareaHeight = isExpanded ? (isPhoneLayout ? 148 : 198) : isPhoneLayout ? 40 : 46;
    const maxTextareaHeight = isExpanded ? (isPhoneLayout ? 272 : 344) : isPhoneLayout ? 160 : 160;
    textarea.style.height = "auto";
    textarea.style.minHeight = `${minTextareaHeight}px`;
    textarea.style.maxHeight = `${maxTextareaHeight}px`;
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minTextareaHeight),
      maxTextareaHeight,
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxTextareaHeight ? "auto" : "hidden";

    if (!isPhoneLayout) {
      setIsPhoneTallInput((prev) => (prev ? false : prev));
      return;
    }

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const contentHeight = Math.max(0, nextHeight - paddingTop - paddingBottom);
    const estimatedLineCount = contentHeight / lineHeight;
    const nextIsPhoneTallInput = estimatedLineCount > 2.25;
    setIsPhoneTallInput((prev) => (prev === nextIsPhoneTallInput ? prev : nextIsPhoneTallInput));
  }, [isExpanded, isPhoneLayout, text, textareaRef]);

  useEffect(() => {
    if (!mobileActionsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && mobileActionsRef.current?.contains(target)) {
        return;
      }
      setMobileActionsOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileActionsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileActionsOpen]);

  useEffect(() => {
    if (disabled && mobileActionsOpen) {
      setMobileActionsOpen(false);
    }
  }, [disabled, mobileActionsOpen]);

  useDismissibleMenu({
    isOpen: modelMenuOpen,
    containerRef: modelMenuRef,
    onClose: () => setModelMenuOpen(false),
  });

  useDismissibleMenu({
    isOpen: effortMenuOpen,
    containerRef: effortMenuRef,
    onClose: () => setEffortMenuOpen(false),
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
    setModelMenuOpen(false);
    setEffortMenuOpen(false);
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
    if (!modelMenuOpen) {
      setModelMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(modelMenuRef, modelDropdownRef, setModelMenuAbove);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [modelMenuOpen, updateMenuPlacement]);

  useLayoutEffect(() => {
    if (!effortMenuOpen) {
      setEffortMenuAbove(false);
      return;
    }
    const update = () =>
      updateMenuPlacement(effortMenuRef, effortDropdownRef, setEffortMenuAbove);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [effortMenuOpen, updateMenuPlacement]);

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

  const handleActionClick = useCallback(() => {
    if (canStop) {
      onStop();
    } else {
      onSend();
    }
  }, [canStop, onSend, onStop]);
  const isDictating = dictationState === "listening";
  const isDictationBusy = dictationState !== "idle";
  const allowOpenDictationSettings = Boolean(
    onOpenDictationSettings && !dictationEnabled && !disabled,
  );
  const micDisabled =
    disabled || dictationState === "processing" || !dictationEnabled || !onToggleDictation;
  const micAriaLabel = allowOpenDictationSettings
    ? "Open dictation settings"
    : dictationState === "processing"
      ? "Dictation processing"
      : isDictating
        ? "Stop dictation"
        : "Start dictation";
  const micTitle = allowOpenDictationSettings
    ? "Dictation disabled. Open settings"
    : dictationState === "processing"
      ? "Processing dictation"
      : isDictating
        ? "Stop dictation"
        : "Start dictation";
  const handleMicClick = useCallback(() => {
    if (allowOpenDictationSettings) {
      onOpenDictationSettings?.();
      return;
    }
    if (!onToggleDictation || micDisabled) {
      return;
    }
    onToggleDictation();
  }, [
    allowOpenDictationSettings,
    micDisabled,
    onOpenDictationSettings,
    onToggleDictation,
  ]);

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onTextChange(event.target.value, event.target.selectionStart);
    },
    [onTextChange],
  );

  const handleTextareaSelect = useCallback(
    (event: SyntheticEvent<HTMLTextAreaElement>) => {
      onSelectionChange((event.target as HTMLTextAreaElement).selectionStart);
    },
    [onSelectionChange],
  );

  const handleTextareaPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      void handlePaste(event);
      if (!event.defaultPrevented) {
        onTextPaste?.(event);
      }
    },
    [handlePaste, onTextPaste],
  );

  const handleMobileAttachClick = useCallback(() => {
    if (disabled || !onAddAttachment) {
      return;
    }
    setMobileActionsOpen(false);
    onAddAttachment();
  }, [disabled, onAddAttachment]);

  const handleMobileExpandClick = useCallback(() => {
    if (disabled || !onToggleExpand) {
      return;
    }
    setMobileActionsOpen(false);
    onToggleExpand();
  }, [disabled, onToggleExpand]);

  const selectedModel =
    (selectedModelId ? models.find((model) => model.id === selectedModelId) : null) ?? null;
  const selectedModelLabel =
    selectedModel?.displayName || selectedModel?.model || models[0]?.displayName || models[0]?.model || "No models";
  const selectedEffortLabel = selectedEffort || "Default";

  const handleMobileDictationClick = useCallback(() => {
    setMobileActionsOpen(false);
    handleMicClick();
  }, [handleMicClick]);

  return (
    <div className={`composer-input${isPhoneLayout && isPhoneTallInput ? " is-phone-tall" : ""}`}>
      <div
        className={`composer-input-area${isDragOver ? " is-drag-over" : ""}`}
        ref={dropTargetRef}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ComposerAttachments
          attachments={attachments}
          disabled={disabled}
          onRemoveAttachment={onRemoveAttachment}
        />
        <div className="composer-input-row">
          <div
            className={`composer-mobile-menu${mobileActionsOpen ? " is-open" : ""}`}
            ref={mobileActionsRef}
          >
            <button
              type="button"
              className="composer-action composer-action--mobile-menu"
              onClick={() => setMobileActionsOpen((prev) => !prev)}
              disabled={disabled}
              aria-expanded={mobileActionsOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              title="More actions"
            >
              <Plus size={14} aria-hidden />
            </button>
            {mobileActionsOpen && (
              <PopoverSurface className="composer-mobile-actions-popover" role="menu">
                <PopoverMenuItem
                  onClick={handleMobileAttachClick}
                  disabled={disabled || !onAddAttachment}
                  icon={<ImagePlus size={14} />}
                >
                  Add image
                </PopoverMenuItem>
                {onToggleExpand && (
                  <PopoverMenuItem
                    onClick={handleMobileExpandClick}
                    disabled={disabled}
                    icon={
                      isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronUp size={14} />
                      )
                    }
                  >
                    {isExpanded ? "Collapse input" : "Expand input"}
                  </PopoverMenuItem>
                )}
                {(onToggleDictation || onOpenDictationSettings) && (
                  <PopoverMenuItem
                    onClick={handleMobileDictationClick}
                    disabled={
                      disabled ||
                      dictationState === "processing" ||
                      (!onToggleDictation && !allowOpenDictationSettings)
                    }
                    icon={isDictating ? <Square size={14} /> : <Mic size={14} />}
                  >
                    {micAriaLabel}
                  </PopoverMenuItem>
                )}
              </PopoverSurface>
            )}
          </div>
          <textarea
            ref={textareaRef}
            placeholder={
              disabled
                ? "Review in progress. Chat will re-enable when it completes."
                : "Ask for follow-up changes"
            }
            value={text}
            onChange={handleTextareaChange}
            onSelect={handleTextareaSelect}
            disabled={disabled}
            onKeyDown={onKeyDown}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handleTextareaPaste}
          />
        </div>
        {isDictationBusy && (
          <DictationWaveform
            active={isDictating}
            processing={dictationState === "processing"}
            level={dictationLevel}
          />
        )}
        {dictationError && (
          <div className="composer-dictation-error" role="status">
            <span>{dictationError}</span>
            <button
              type="button"
              className="ghost composer-dictation-error-dismiss"
              onClick={onDismissDictationError}
            >
              Dismiss
            </button>
          </div>
        )}
        {dictationHint && (
          <div className="composer-dictation-hint" role="status">
            <span>{dictationHint}</span>
            {onDismissDictationHint && (
              <button
                type="button"
                className="ghost composer-dictation-error-dismiss"
                onClick={onDismissDictationHint}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
        {suggestionsOpen && (
          <PopoverSurface
            className={`composer-suggestions${
              reviewPromptOpen ? " review-inline-suggestions" : ""
            }`}
            role="listbox"
            ref={suggestionListRef}
            style={suggestionsStyle}
          >
            {reviewPromptOpen &&
            reviewPrompt &&
            onReviewPromptClose &&
            onReviewPromptShowPreset &&
            onReviewPromptChoosePreset &&
            highlightedPresetIndex !== undefined &&
            onReviewPromptHighlightPreset &&
            highlightedBranchIndex !== undefined &&
            onReviewPromptHighlightBranch &&
            highlightedCommitIndex !== undefined &&
            onReviewPromptHighlightCommit &&
            onReviewPromptSelectBranch &&
            onReviewPromptSelectBranchAtIndex &&
            onReviewPromptConfirmBranch &&
            onReviewPromptSelectCommit &&
            onReviewPromptSelectCommitAtIndex &&
            onReviewPromptConfirmCommit &&
            onReviewPromptUpdateCustomInstructions &&
            onReviewPromptConfirmCustom ? (
              <ReviewInlinePrompt
                reviewPrompt={reviewPrompt}
                onClose={onReviewPromptClose}
                onShowPreset={onReviewPromptShowPreset}
                onChoosePreset={onReviewPromptChoosePreset}
                highlightedPresetIndex={highlightedPresetIndex}
                onHighlightPreset={onReviewPromptHighlightPreset}
                highlightedBranchIndex={highlightedBranchIndex}
                onHighlightBranch={onReviewPromptHighlightBranch}
                highlightedCommitIndex={highlightedCommitIndex}
                onHighlightCommit={onReviewPromptHighlightCommit}
                onSelectBranch={onReviewPromptSelectBranch}
                onSelectBranchAtIndex={onReviewPromptSelectBranchAtIndex}
                onConfirmBranch={onReviewPromptConfirmBranch}
                onSelectCommit={onReviewPromptSelectCommit}
                onSelectCommitAtIndex={onReviewPromptSelectCommitAtIndex}
                onConfirmCommit={onReviewPromptConfirmCommit}
                onUpdateCustomInstructions={onReviewPromptUpdateCustomInstructions}
                onConfirmCustom={onReviewPromptConfirmCustom}
              />
            ) : (
              suggestions.map((item, index) => {
                const prevGroup = suggestions[index - 1]?.group;
                const showGroup = Boolean(item.group && item.group !== prevGroup);
                return (
                  <div key={item.id}>
                    {showGroup && (
                      <div className="composer-suggestion-section">{item.group}</div>
                    )}
                    <button
                      type="button"
                      className={`composer-suggestion${
                        index === highlightIndex ? " is-active" : ""
                      }`}
                      role="option"
                      aria-selected={index === highlightIndex}
                      ref={(node) => {
                        suggestionRefs.current[index] = node;
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onSelectSuggestion(item)}
                      onMouseEnter={() => onHighlightIndex(index)}
                    >
                      {(() => {
                        const Icon = suggestionIcon(item);
                        const fileSuggestion = isFileSuggestion(item);
                        const skillSuggestion = item.id.startsWith("skill:");
                        const title = fileSuggestion ? fileTitle(item.label) : item.label;
                        const description = fileSuggestion ? item.label : item.description;
                        const fileTypeIconUrl = fileSuggestion
                          ? getFileTypeIconUrl(item.label)
                          : null;
                        return (
                          <span className="composer-suggestion-row">
                            <span className="composer-suggestion-icon" aria-hidden>
                              {fileTypeIconUrl ? (
                                <img
                                  className="composer-suggestion-icon-image"
                                  src={fileTypeIconUrl}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <Icon size={14} />
                              )}
                            </span>
                            <span className="composer-suggestion-content">
                              <span className="composer-suggestion-title">{title}</span>
                              {description && (
                                <span
                                  className={`composer-suggestion-description${
                                    skillSuggestion ? " composer-suggestion-description--skill" : ""
                                  }`}
                                >
                                  {description}
                                </span>
                              )}
                              {!fileSuggestion && item.hint && (
                                <span className="composer-suggestion-description">
                                  {item.hint}
                                </span>
                              )}
                            </span>
                          </span>
                        );
                      })()}
                    </button>
                  </div>
                );
              })
            )}
          </PopoverSurface>
        )}
      </div>
      <div className="composer-input-toolbar">
        <div className="composer-input-toolbar-left">
          <button
            type="button"
            className="composer-toolbar-attach"
            onClick={onAddAttachment}
            disabled={disabled || !onAddAttachment}
            aria-label="Add attachment"
            title="Add attachment"
          >
            <Plus size={14} aria-hidden />
          </button>
          <div className="composer-toolbar-menu" ref={modelMenuRef}>
            <button
              type="button"
              className="composer-toolbar-select composer-toolbar-select--model"
              aria-label="Model"
              aria-haspopup="menu"
              aria-expanded={modelMenuOpen}
              onClick={() => {
                setModelMenuOpen((prev) => !prev);
                setEffortMenuOpen(false);
                setWorktreeFromBranchMenuOpen(false);
              }}
              disabled={disabled}
            >
              {selectedModelLabel}
            </button>
            {modelMenuOpen && (
              <PopoverSurface
                ref={modelDropdownRef}
                className={`composer-toolbar-dropdown${modelMenuAbove ? " is-above" : ""}`}
                role="menu"
              >
                {models.length === 0 ? (
                  <div className="composer-toolbar-dropdown-empty">No models</div>
                ) : (
                  models.map((model) => (
                    <PopoverMenuItem
                      key={model.id}
                      className="composer-toolbar-option"
                      onClick={() => {
                        onSelectModel(model.id);
                        setModelMenuOpen(false);
                      }}
                      active={model.id === selectedModelId}
                    >
                      {model.displayName || model.model}
                    </PopoverMenuItem>
                  ))
                )}
              </PopoverSurface>
            )}
          </div>
          <div className="composer-toolbar-menu" ref={effortMenuRef}>
            <button
              type="button"
              className="composer-toolbar-select composer-toolbar-select--effort"
              aria-label="Thinking mode"
              aria-haspopup="menu"
              aria-expanded={effortMenuOpen}
              onClick={() => {
                setEffortMenuOpen((prev) => !prev);
                setModelMenuOpen(false);
                setWorktreeFromBranchMenuOpen(false);
              }}
              disabled={disabled || !reasoningSupported}
            >
              {selectedEffortLabel}
            </button>
            {effortMenuOpen && (
              <PopoverSurface
                ref={effortDropdownRef}
                className={`composer-toolbar-dropdown${effortMenuAbove ? " is-above" : ""}`}
                role="menu"
              >
                {reasoningOptions.length === 0 ? (
                  <PopoverMenuItem
                    className="composer-toolbar-option"
                    onClick={() => {
                      onSelectEffort("");
                      setEffortMenuOpen(false);
                    }}
                    active={!selectedEffort}
                  >
                    Default
                  </PopoverMenuItem>
                ) : (
                  reasoningOptions.map((effort) => (
                    <PopoverMenuItem
                      key={effort}
                      className="composer-toolbar-option"
                      onClick={() => {
                        onSelectEffort(effort);
                        setEffortMenuOpen(false);
                      }}
                      active={effort === selectedEffort}
                    >
                      {effort}
                    </PopoverMenuItem>
                  ))
                )}
              </PopoverSurface>
            )}
          </div>
          {showPlanToggle && (
            <>
              <span className="composer-toolbar-separator" aria-hidden />
              <button
                type="button"
                className={`composer-toolbar-plan-toggle${
                  planSelected ? " is-active" : ""
                }`}
                onClick={() => onTogglePlanMode?.(!planSelected)}
                disabled={disabled || !onTogglePlanMode}
                aria-pressed={planSelected}
                aria-label="Plan mode"
              >
                <ScrollText size={13} aria-hidden />
                <span>{planLabel}</span>
              </button>
            </>
          )}
        </div>
        <div className="composer-input-toolbar-right">
          <button
            className={`composer-action composer-action--mic${
              isDictationBusy ? " is-active" : ""
            }${dictationState === "processing" ? " is-processing" : ""}${
              micDisabled ? " is-disabled" : ""
            }`}
            onClick={handleMicClick}
            disabled={
              disabled ||
              dictationState === "processing" ||
              (!onToggleDictation && !allowOpenDictationSettings)
            }
            aria-label={micAriaLabel}
            title={micTitle}
          >
            {isDictating ? <Square aria-hidden /> : <Mic aria-hidden />}
          </button>
          <button
            className={`composer-action${canStop ? " is-stop" : " is-send"}${
              canStop && isProcessing ? " is-loading" : ""
            }`}
            onClick={handleActionClick}
            disabled={disabled || isDictationBusy || (!canStop && !canSend)}
            aria-label={canStop ? "Stop" : sendLabel}
          >
            {canStop ? (
              <>
                <span className="composer-action-stop-square" aria-hidden />
                {isProcessing && (
                  <span className="composer-action-spinner" aria-hidden />
                )}
              </>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 5l6 6m-6-6L6 11m6-6v14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      {showWorktreeFromBranch && (
        <div className="composer-worktree-source-row">
          <div className="composer-worktree-source-menu" ref={worktreeFromBranchMenuRef}>
            <button
              type="button"
              className="composer-worktree-source-button"
              aria-label="Worktree base branch"
              aria-haspopup="menu"
              aria-expanded={worktreeFromBranchMenuOpen}
              onClick={() => {
                setWorktreeFromBranchMenuOpen((prev) => !prev);
                setModelMenuOpen(false);
                setEffortMenuOpen(false);
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
        </div>
      )}
    </div>
  );
}
