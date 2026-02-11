import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useDismissibleMenu } from "../../app/hooks/useDismissibleMenu";
import {
  PopoverMenuItem,
  PopoverSurface,
} from "../../design-system/components/popover/PopoverPrimitives";
import { joinClassNames } from "../../design-system/components/classNames";

export type SettingsSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SettingsMenuSelectProps = {
  id?: string;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  value: string;
  options: SettingsSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function SettingsMenuSelect({
  id,
  className,
  menuClassName,
  optionClassName,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: SettingsMenuSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useDismissibleMenu({
    isOpen: open,
    containerRef,
    onClose: () => setOpen(false),
  });

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const updateMenuPlacement = useCallback(
    (
      hostRef: RefObject<HTMLDivElement | null>,
      surfaceRef: RefObject<HTMLDivElement | null>,
      setAbove: (above: boolean) => void,
    ) => {
      const hostRect = hostRef.current?.getBoundingClientRect();
      const surfaceRect = surfaceRef.current?.getBoundingClientRect();
      if (!hostRect || !surfaceRect) {
        setAbove(false);
        return;
      }
      const gap = 8;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - hostRect.bottom - viewportPadding;
      const spaceAbove = hostRect.top - viewportPadding;
      const shouldOpenAbove =
        spaceBelow < surfaceRect.height + gap && spaceAbove > spaceBelow;
      setAbove(shouldOpenAbove);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!open) {
      setMenuAbove(false);
      return;
    }
    const update = () => updateMenuPlacement(containerRef, dropdownRef, setMenuAbove);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, updateMenuPlacement]);

  return (
    <div
      ref={containerRef}
      className={joinClassNames("settings-select", className)}
    >
      <button
        type="button"
        id={id}
        className="settings-select-button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!disabled) {
              setOpen(true);
            }
          }
        }}
      >
        <span className="settings-select-button-label">
          {selectedOption?.label ?? value}
        </span>
      </button>
      {open && (
        <PopoverSurface
          ref={dropdownRef}
          className={joinClassNames(
            "settings-select-dropdown",
            menuAbove && "is-above",
            menuClassName,
          )}
          role="menu"
        >
          {options.map((option) => (
            <PopoverMenuItem
              key={option.value}
              className={joinClassNames("settings-select-option", optionClassName)}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setOpen(false);
                }
              }}
              active={option.value === value}
              disabled={option.disabled}
            >
              {option.label}
            </PopoverMenuItem>
          ))}
        </PopoverSurface>
      )}
    </div>
  );
}
