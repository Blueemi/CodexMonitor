import { createElement, type ComponentType, type SVGProps } from "react";
import ArrowLeftRight from "lucide-react/dist/esm/icons/arrow-left-right";
import Check from "lucide-react/dist/esm/icons/check";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Minus from "lucide-react/dist/esm/icons/minus";
import Plus from "lucide-react/dist/esm/icons/plus";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";
import ScrollText from "lucide-react/dist/esm/icons/scroll-text";
import Search from "lucide-react/dist/esm/icons/search";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import {
  sfArrowClockwise,
  sfArrowCounterclockwise,
  sfArrowDown,
  sfArrowLeftAndRight,
  sfArrowUp,
  sfCheckmark,
  sfDocument,
  sfEllipsis,
  sfMagnifyingglass,
  sfMinus,
  sfPlus,
  sfPoint3ConnectedTrianglepathDotted,
  sfScroll,
  sfSparkles,
  sfTextDocument,
  sfXmark,
} from "@bradleyhodges/sfsymbols";
import { isMacPlatform } from "../../../utils/platformPaths";

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

type IconProps = {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

type LegacyIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const SHOW_MAC_SYMBOLS = __MACOS_BUILD__ && isMacPlatform();

function SfSymbolIcon({
  symbol,
  size = 14,
  className,
  "aria-hidden": ariaHidden,
}: {
  symbol: SfSymbol;
} & IconProps) {
  const viewBox = symbol.viewBox ?? `0 0 ${symbol.width ?? 0} ${symbol.height ?? 0}`;
  return createElement(
    "svg",
    {
      viewBox,
      width: size,
      height: size,
      className,
      "aria-hidden": ariaHidden,
      focusable: false,
      xmlns: "http://www.w3.org/2000/svg",
      preserveAspectRatio: "xMidYMid meet",
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

function createPlatformIcon(
  macSymbol: SfSymbol,
  LegacyIcon: ComponentType<LegacyIconProps>,
) {
  return function PlatformIcon({ size = 14, className, "aria-hidden": ariaHidden }: IconProps) {
    if (SHOW_MAC_SYMBOLS) {
      return (
        <SfSymbolIcon
          symbol={macSymbol}
          size={size}
          className={className}
          aria-hidden={ariaHidden}
        />
      );
    }
    return <LegacyIcon size={size} className={className} aria-hidden={ariaHidden} />;
  };
}

export const GitModeDiffIcon = createPlatformIcon(sfTextDocument, FileText);
export const GitModeLogIcon = createPlatformIcon(sfScroll, ScrollText);
export const GitModeIssuesIcon = createPlatformIcon(sfMagnifyingglass, Search);
export const GitModePullRequestsIcon = createPlatformIcon(
  sfPoint3ConnectedTrianglepathDotted,
  GitBranch,
);
export const GitRefreshIcon = createPlatformIcon(sfArrowClockwise, RotateCw);
export const GitChangeRootIcon = createPlatformIcon(sfArrowLeftAndRight, ArrowLeftRight);
export const GitPullIcon = createPlatformIcon(sfArrowDown, Download);
export const GitPushIcon = createPlatformIcon(sfArrowUp, Upload);
export const GitSyncIcon = createPlatformIcon(sfArrowCounterclockwise, RotateCcw);
export const GitStageIcon = createPlatformIcon(sfPlus, Plus);
export const GitUnstageIcon = createPlatformIcon(sfMinus, Minus);
export const GitDiscardIcon = createPlatformIcon(sfArrowCounterclockwise, RotateCcw);
export const GitApplyIcon = createPlatformIcon(sfArrowUp, Upload);
export const GitSuccessIcon = createPlatformIcon(sfCheckmark, Check);
export const GitDismissIcon = createPlatformIcon(sfXmark, X);
export const GitGenerateIcon = createPlatformIcon(sfSparkles, Sparkles);
export const GitLoadingIcon = createPlatformIcon(sfEllipsis, Loader2);
export const GitCommitIcon = createPlatformIcon(sfCheckmark, Check);
export const GitFileIcon = createPlatformIcon(sfDocument, FileText);
