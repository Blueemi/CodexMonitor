import { createElement, useRef, type KeyboardEvent, type ReactNode, type SVGProps } from "react";
import Folder from "lucide-react/dist/esm/icons/folder";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import ScrollText from "lucide-react/dist/esm/icons/scroll-text";
import {
  sfFolder,
  sfPoint3ConnectedTrianglepathDotted,
  sfTextDocument,
} from "@bradleyhodges/sfsymbols";
import { isMacPlatform } from "../../../utils/platformPaths";

export type PanelTabId = "git" | "files" | "prompts";

type PanelTab = {
  id: PanelTabId;
  label: string;
  icon: ReactNode;
};

type PanelTabsProps = {
  active: PanelTabId;
  onSelect: (id: PanelTabId) => void;
  tabs?: PanelTab[];
};

type SfSymbol = {
  viewBox?: string;
  width?: number;
  height?: number;
  svgPathData: Array<{
    d: string;
    fill?: string;
    fillOpacity?: number;
  }>;
};

type SfSymbolIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  symbol: SfSymbol;
};

const SHOW_MAC_SYMBOLS = __MACOS_BUILD__ && isMacPlatform();

function SfSymbolIcon({ symbol, ...props }: SfSymbolIconProps) {
  const viewBox = symbol.viewBox ?? `0 0 ${symbol.width ?? 0} ${symbol.height ?? 0}`;
  return createElement(
    "svg",
    {
      viewBox,
      focusable: false,
      xmlns: "http://www.w3.org/2000/svg",
      preserveAspectRatio: "xMidYMid meet",
      ...props,
    },
    symbol.svgPathData.map((path, idx) =>
      createElement("path", {
        key: `${idx}-${path.d}`,
        d: path.d,
        fill: "currentColor",
        fillOpacity: path.fillOpacity,
      }),
    ),
  );
}

const defaultTabs: PanelTab[] = [
  {
    id: "git",
    label: "Git",
    icon: SHOW_MAC_SYMBOLS ? (
      <SfSymbolIcon symbol={sfPoint3ConnectedTrianglepathDotted} aria-hidden />
    ) : (
      <GitBranch aria-hidden />
    ),
  },
  {
    id: "files",
    label: "Files",
    icon: SHOW_MAC_SYMBOLS ? <SfSymbolIcon symbol={sfFolder} aria-hidden /> : <Folder aria-hidden />,
  },
  {
    id: "prompts",
    label: "Prompts",
    icon: SHOW_MAC_SYMBOLS ? (
      <SfSymbolIcon symbol={sfTextDocument} aria-hidden />
    ) : (
      <ScrollText aria-hidden />
    ),
  },
];

export function PanelTabs({ active, onSelect, tabs = defaultTabs }: PanelTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = tabs.findIndex((tab) => tab.id === active);
  const focusableIndex = activeIndex >= 0 ? activeIndex : 0;

  const selectByIndex = (index: number, options?: { focus?: boolean }) => {
    if (tabs.length === 0) {
      return;
    }
    const normalized = (index + tabs.length) % tabs.length;
    onSelect(tabs[normalized].id);
    if (options?.focus) {
      tabRefs.current[normalized]?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length <= 1) {
      return;
    }
    const currentIndex = activeIndex >= 0 ? activeIndex : index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectByIndex(currentIndex + 1, { focus: true });
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectByIndex(currentIndex - 1, { focus: true });
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectByIndex(0, { focus: true });
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      selectByIndex(tabs.length - 1, { focus: true });
    }
  };

  return (
    <div className="panel-tabs" role="tablist" aria-label="Panel" aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`panel-tab${isActive ? " is-active" : ""}`}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={index === focusableIndex ? 0 : -1}
            aria-label={tab.label}
            title={tab.label}
          >
            <span className="panel-tab-icon" aria-hidden>
              {tab.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}
