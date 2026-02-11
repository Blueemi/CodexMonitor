import { createElement, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { LaunchScriptIconId } from "../../../types";
export type { LaunchScriptIconId } from "../../../types";
import {
  sfArrowClockwise,
  sfChevronLeftForwardslashChevronRight,
  sfCommand,
  sfCylinderSplit1x2,
  sfGearshape,
  sfHammerFill,
  sfLadybugFill,
  sfMagnifyingglass,
  sfPlayFill,
  sfPoint3ConnectedTrianglepathDotted,
  sfServerRack,
  sfShippingbox,
  sfTesttube2,
  sfWrenchAndScrewdriver,
} from "@bradleyhodges/sfsymbols";
import Play from "lucide-react/dist/esm/icons/play";
import Hammer from "lucide-react/dist/esm/icons/hammer";
import Bug from "lucide-react/dist/esm/icons/bug";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Server from "lucide-react/dist/esm/icons/server";
import Database from "lucide-react/dist/esm/icons/database";
import Package from "lucide-react/dist/esm/icons/package";
import TestTube2 from "lucide-react/dist/esm/icons/test-tube-2";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import Settings from "lucide-react/dist/esm/icons/settings";
import Search from "lucide-react/dist/esm/icons/search";

export const DEFAULT_LAUNCH_SCRIPT_ICON: LaunchScriptIconId = "play";

export type LaunchScriptIconComponent = ComponentType<LucideProps>;

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

function toSfIcon(icon: SfSymbol): LaunchScriptIconComponent {
  return function SFSymbolIcon(props: LucideProps) {
    const { size = 14, color, className, ...rest } = props;
    const viewBox = icon.viewBox || `0 0 ${icon.width ?? 0} ${icon.height ?? 0}`;
    const fillColor = color ?? "currentColor";
    return createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox,
        className,
        focusable: false,
        xmlns: "http://www.w3.org/2000/svg",
        preserveAspectRatio: "xMidYMid meet",
        ...rest,
      },
      icon.svgPathData.map((path, idx) =>
        createElement("path", {
          key: `${idx}-${path.d}`,
          d: path.d,
          fill: fillColor,
          fillOpacity: path.fillOpacity,
        }),
      ),
    );
  };
}

const LEGACY_ICON_MAP: Record<LaunchScriptIconId, LaunchScriptIconComponent> = {
  play: Play,
  build: Hammer,
  debug: Bug,
  wrench: Wrench,
  terminal: TerminalSquare,
  code: Code2,
  server: Server,
  database: Database,
  package: Package,
  test: TestTube2,
  lint: RefreshCw,
  dev: Play,
  git: GitBranch,
  config: Settings,
  logs: Search,
};

const MACOS_ICON_MAP: Record<LaunchScriptIconId, LaunchScriptIconComponent> = {
  play: toSfIcon(sfPlayFill),
  build: toSfIcon(sfHammerFill),
  debug: toSfIcon(sfLadybugFill),
  wrench: toSfIcon(sfWrenchAndScrewdriver),
  terminal: toSfIcon(sfCommand),
  code: toSfIcon(sfChevronLeftForwardslashChevronRight),
  server: toSfIcon(sfServerRack),
  database: toSfIcon(sfCylinderSplit1x2),
  package: toSfIcon(sfShippingbox),
  test: toSfIcon(sfTesttube2),
  lint: toSfIcon(sfArrowClockwise),
  dev: toSfIcon(sfPlayFill),
  git: toSfIcon(sfPoint3ConnectedTrianglepathDotted),
  config: toSfIcon(sfGearshape),
  logs: toSfIcon(sfMagnifyingglass),
};

const ICON_MAP = __MACOS_BUILD__ ? MACOS_ICON_MAP : LEGACY_ICON_MAP;

const ICON_LABELS: Record<LaunchScriptIconId, string> = {
  play: "Play",
  build: "Build",
  debug: "Debug",
  wrench: "Wrench",
  terminal: "Terminal",
  code: "Code",
  server: "Server",
  database: "Database",
  package: "Package",
  test: "Test",
  lint: "Lint",
  dev: "Dev",
  git: "Git",
  config: "Config",
  logs: "Logs",
};

function isLaunchScriptIconId(value: string): value is LaunchScriptIconId {
  return value in ICON_MAP;
}

export function coerceLaunchScriptIconId(value?: string | null): LaunchScriptIconId {
  if (!value) {
    return DEFAULT_LAUNCH_SCRIPT_ICON;
  }
  return isLaunchScriptIconId(value) ? value : DEFAULT_LAUNCH_SCRIPT_ICON;
}

export const LAUNCH_SCRIPT_ICON_OPTIONS = Object.keys(ICON_MAP).map((id) => {
  const iconId = coerceLaunchScriptIconId(id);
  return {
    id: iconId,
    label: ICON_LABELS[iconId],
  };
});

export function getLaunchScriptIcon(id?: string | null): LaunchScriptIconComponent {
  const iconId = coerceLaunchScriptIconId(id);
  return ICON_MAP[iconId];
}

export function getLaunchScriptIconLabel(id?: string | null): string {
  const iconId = coerceLaunchScriptIconId(id);
  return ICON_LABELS[iconId];
}
