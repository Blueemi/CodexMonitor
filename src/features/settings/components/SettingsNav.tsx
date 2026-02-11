import { createElement, type SVGProps } from "react";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Mic from "lucide-react/dist/esm/icons/mic";
import Keyboard from "lucide-react/dist/esm/icons/keyboard";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Layers from "lucide-react/dist/esm/icons/layers";
import ServerCog from "lucide-react/dist/esm/icons/server-cog";
import {
  sfArrowUpForwardSquare,
  sfCommand,
  sfKeyboard,
  sfMicrophone,
  sfPoint3ConnectedTrianglepathDotted,
  sfServerRack,
  sfSliderHorizontal3,
  sfSquareGrid2x2,
  sfSquareStack3dUp,
  sfTesttube2,
  sfTextDocument,
} from "@bradleyhodges/sfsymbols";
import { PanelNavItem, PanelNavList } from "../../design-system/components/panel/PanelPrimitives";
import type { CodexSection } from "./settingsTypes";
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

function sectionIcon(section: CodexSection) {
  if (SHOW_MAC_SYMBOLS) {
    if (section === "projects") {
      return <SfSymbolIcon symbol={sfSquareGrid2x2} aria-hidden />;
    }
    if (section === "environments") {
      return <SfSymbolIcon symbol={sfSquareStack3dUp} aria-hidden />;
    }
    if (section === "display") {
      return <SfSymbolIcon symbol={sfSliderHorizontal3} aria-hidden />;
    }
    if (section === "composer") {
      return <SfSymbolIcon symbol={sfTextDocument} aria-hidden />;
    }
    if (section === "dictation") {
      return <SfSymbolIcon symbol={sfMicrophone} aria-hidden />;
    }
    if (section === "shortcuts") {
      return <SfSymbolIcon symbol={sfKeyboard} aria-hidden />;
    }
    if (section === "open-apps") {
      return <SfSymbolIcon symbol={sfArrowUpForwardSquare} aria-hidden />;
    }
    if (section === "git") {
      return <SfSymbolIcon symbol={sfPoint3ConnectedTrianglepathDotted} aria-hidden />;
    }
    if (section === "server") {
      return <SfSymbolIcon symbol={sfServerRack} aria-hidden />;
    }
    if (section === "codex") {
      return <SfSymbolIcon symbol={sfCommand} aria-hidden />;
    }
    if (section === "features") {
      return <SfSymbolIcon symbol={sfTesttube2} aria-hidden />;
    }
  }
  if (section === "projects") {
    return <LayoutGrid aria-hidden />;
  }
  if (section === "environments") {
    return <Layers aria-hidden />;
  }
  if (section === "display") {
    return <SlidersHorizontal aria-hidden />;
  }
  if (section === "composer") {
    return <FileText aria-hidden />;
  }
  if (section === "dictation") {
    return <Mic aria-hidden />;
  }
  if (section === "shortcuts") {
    return <Keyboard aria-hidden />;
  }
  if (section === "open-apps") {
    return <ExternalLink aria-hidden />;
  }
  if (section === "git") {
    return <GitBranch aria-hidden />;
  }
  if (section === "server") {
    return <ServerCog aria-hidden />;
  }
  if (section === "codex") {
    return <TerminalSquare aria-hidden />;
  }
  return <FlaskConical aria-hidden />;
}

type SettingsNavProps = {
  activeSection: CodexSection;
  onSelectSection: (section: CodexSection) => void;
  showDisclosure?: boolean;
};

export function SettingsNav({
  activeSection,
  onSelectSection,
  showDisclosure = false,
}: SettingsNavProps) {
  return (
    <aside className="settings-sidebar">
      <PanelNavList className="settings-nav-list">
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("projects")}
          active={activeSection === "projects"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("projects")}
        >
          Projects
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("environments")}
          active={activeSection === "environments"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("environments")}
        >
          Environments
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("display")}
          active={activeSection === "display"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("display")}
        >
          Display &amp; Sound
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("composer")}
          active={activeSection === "composer"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("composer")}
        >
          Composer
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("dictation")}
          active={activeSection === "dictation"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("dictation")}
        >
          Dictation
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("shortcuts")}
          active={activeSection === "shortcuts"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("shortcuts")}
        >
          Shortcuts
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("open-apps")}
          active={activeSection === "open-apps"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("open-apps")}
        >
          Open in
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("git")}
          active={activeSection === "git"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("git")}
        >
          Git
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("server")}
          active={activeSection === "server"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("server")}
        >
          Server
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("codex")}
          active={activeSection === "codex"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("codex")}
        >
          Codex
        </PanelNavItem>
        <PanelNavItem
          className="settings-nav"
          icon={sectionIcon("features")}
          active={activeSection === "features"}
          showDisclosure={showDisclosure}
          onClick={() => onSelectSection("features")}
        >
          Features
        </PanelNavItem>
      </PanelNavList>
    </aside>
  );
}
