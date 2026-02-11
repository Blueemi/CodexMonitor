import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import ListFilter from "lucide-react/dist/esm/icons/list-filter";
import SquarePlus from "lucide-react/dist/esm/icons/square-plus";
import { useRef, useState } from "react";
import type { ThreadListSortKey } from "../../../types";
import {
  PopoverMenuItem,
  PopoverSurface,
} from "../../design-system/components/popover/PopoverPrimitives";
import { useDismissibleMenu } from "../hooks/useDismissibleMenu";

type SidebarHeaderProps = {
  onAddWorkspace: () => void;
  threadListSortKey: ThreadListSortKey;
  onSetThreadListSortKey: (sortKey: ThreadListSortKey) => void;
};

export function SidebarHeader({
  onAddWorkspace,
  threadListSortKey,
  onSetThreadListSortKey,
}: SidebarHeaderProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useDismissibleMenu({
    isOpen: sortMenuOpen,
    containerRef: sortMenuRef,
    onClose: () => setSortMenuOpen(false),
  });

  const handleSelectSort = (sortKey: ThreadListSortKey) => {
    setSortMenuOpen(false);
    if (sortKey === threadListSortKey) {
      return;
    }
    onSetThreadListSortKey(sortKey);
  };

  return (
    <div className="sidebar-header">
      <span className="sidebar-header-title-text">Threads</span>
      <div className="sidebar-header-actions">
        <button
          className="ghost sidebar-header-action-btn"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
          aria-label="New thread"
          type="button"
          title="New thread"
        >
          <SquarePlus aria-hidden />
        </button>
        <div className="sidebar-sort-menu" ref={sortMenuRef}>
          <button
            className={`ghost sidebar-header-action-btn${sortMenuOpen ? " is-active" : ""}`}
            onClick={() => setSortMenuOpen((open) => !open)}
            data-tauri-drag-region="false"
            aria-label="Sort threads"
            aria-haspopup="menu"
            aria-expanded={sortMenuOpen}
            type="button"
            title="Sort threads"
          >
            <ListFilter aria-hidden />
          </button>
          {sortMenuOpen && (
            <PopoverSurface className="sidebar-sort-dropdown" role="menu">
              <PopoverMenuItem
                className="sidebar-sort-option"
                role="menuitemradio"
                aria-checked={threadListSortKey === "updated_at"}
                onClick={() => handleSelectSort("updated_at")}
                data-tauri-drag-region="false"
                icon={<Clock3 aria-hidden />}
                active={threadListSortKey === "updated_at"}
              >
                Last updated
              </PopoverMenuItem>
              <PopoverMenuItem
                className="sidebar-sort-option"
                role="menuitemradio"
                aria-checked={threadListSortKey === "created_at"}
                onClick={() => handleSelectSort("created_at")}
                data-tauri-drag-region="false"
                icon={<Calendar aria-hidden />}
                active={threadListSortKey === "created_at"}
              >
                Most recent
              </PopoverMenuItem>
            </PopoverSurface>
          )}
        </div>
      </div>
    </div>
  );
}
