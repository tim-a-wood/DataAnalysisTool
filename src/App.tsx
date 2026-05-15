import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useAppStore } from "./store/useAppStore";
import { Header } from "./components/Header";
import { DataGroupsPanel } from "./components/DataGroupsPanel";
import { VariablesPanel } from "./components/VariablesPanel";
import { GroupedDataTable } from "./components/GroupedDataTable";
import { PlotWorkspace } from "./components/PlotWorkspace";
import { PlotFormattingPanel } from "./components/PlotFormattingPanel";
import { BottomStatusBar } from "./components/BottomStatusBar";
import { HelpDrawer } from "./components/HelpDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { ErrorPanel } from "./components/ErrorPanel";
import { ToastHost } from "./components/ToastHost";

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isLoading = useAppStore(s => s.isLoading);
  const activeError = useAppStore(s => s.activeError);
  const clearError = useAppStore(s => s.clearError);
  const loadLayout = useAppStore(s => s.loadLayout);
  const previousCase = useAppStore(s => s.previousCase);
  const nextCase = useAppStore(s => s.nextCase);
  const saveLayout = useAppStore(s => s.saveLayout);
  const layoutState = useAppStore(s => s.layoutState);
  const setFocusedPane = useAppStore(s => s.setFocusedPane);
  const toggleTablePaneCollapse = useAppStore(s => s.toggleTablePaneCollapse);
  const togglePlotsPaneCollapse = useAppStore(s => s.togglePlotsPaneCollapse);
  const setTablePaneHeight = useAppStore(s => s.setTablePaneHeight);
  const toggleLeftPanel = useAppStore(s => s.toggleLeftPanel);
  const toggleRightPanel = useAppStore(s => s.toggleRightPanel);

  const gridTemplateRows = layoutState.tableCollapsed
    ? "52px 0 1fr 38px"
    : layoutState.plotsCollapsed
      ? "52px 1fr 0 38px"
      : `52px ${layoutState.tablePaneHeightPx}px 1fr 38px`;

  const appClassName = [
    "app",
    layoutState.leftPanelCollapsed ? "left-collapsed" : "",
    layoutState.rightPanelCollapsed ? "right-collapsed" : "",
    layoutState.focusedPane === "table" ? "focus-table" : "",
    layoutState.focusedPane === "plots" ? "focus-plots" : "",
    layoutState.tableCollapsed ? "table-collapsed" : "",
    layoutState.plotsCollapsed ? "plots-collapsed" : "",
  ].filter(Boolean).join(" ");

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const inInput = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "ArrowLeft" && !inInput) {
        e.preventDefault();
        previousCase();
      } else if (e.key === "ArrowRight" && !inInput) {
        e.preventDefault();
        nextCase();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveLayout();
      } else if (e.key === "Escape") {
        setHelpOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previousCase, nextCase, saveLayout]);

  return (
    <div className={appClassName} style={{ gridTemplateRows }}>
      <div className="app-header">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
      </div>

      {(layoutState.leftPanelCollapsed || layoutState.focusedPane) && (
        <button
          className="panel-rail-toggle panel-rail-toggle-left"
          onClick={toggleLeftPanel}
          aria-label="Show left panels"
          title="Show left panels"
        >
          <PanelLeftOpen size={14} />
          <span>Panels</span>
        </button>
      )}

      {(layoutState.rightPanelCollapsed || layoutState.focusedPane) && (
        <button
          className="panel-rail-toggle panel-rail-toggle-right"
          onClick={toggleRightPanel}
          aria-label="Show plot formatting panel"
          title="Show plot formatting panel"
        >
          <PanelRightOpen size={14} />
          <span>Formatting</span>
        </button>
      )}

      <div className="app-left-sidebar">
        {activeError && (
          <ErrorPanel message={activeError} onDismiss={clearError} />
        )}
        <DataGroupsPanel />
        <div className="divider" />
        <VariablesPanel />
      </div>

      <div className="app-table">
        <div className="pane-action-group pane-action-group-top">
          <button
            className="pane-action"
            onClick={toggleTablePaneCollapse}
            aria-label="Collapse table upward"
            title="Collapse table upward"
          >
            <ChevronUp size={13} />
          </button>
          <button
            className="pane-action"
            onClick={() => setFocusedPane(layoutState.focusedPane === "table" ? null : "table")}
            aria-label={layoutState.focusedPane === "table" ? "Restore split view" : "Maximize table"}
            title={layoutState.focusedPane === "table" ? "Restore split view" : "Maximize table"}
          >
            {layoutState.focusedPane === "table" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        <GroupedDataTable />
        {layoutState.plotsCollapsed && (
          <button
            className="pane-restore pane-restore-plots"
            onClick={togglePlotsPaneCollapse}
            aria-label="Show plots"
            title="Show plots"
          >
            <ChevronUp size={14} />
            <span>Show Plots</span>
          </button>
        )}
      </div>

      <div className="app-plots">
        {layoutState.tableCollapsed && (
          <button
            className="pane-restore pane-restore-table"
            onClick={toggleTablePaneCollapse}
            aria-label="Show table"
            title="Show table"
          >
            <ChevronDown size={14} />
            <span>Show Table</span>
          </button>
        )}
        <div className="pane-action-group pane-action-group-bottom">
          <button
            className="pane-action"
            onClick={togglePlotsPaneCollapse}
            aria-label="Collapse plots downward"
            title="Collapse plots downward"
          >
            <ChevronDown size={13} />
          </button>
          <button
            className="pane-action"
            onClick={() => setFocusedPane(layoutState.focusedPane === "plots" ? null : "plots")}
            aria-label={layoutState.focusedPane === "plots" ? "Restore split view" : "Maximize plots"}
            title={layoutState.focusedPane === "plots" ? "Restore split view" : "Maximize plots"}
          >
            {layoutState.focusedPane === "plots" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        <PlotWorkspace />
      </div>

      {!layoutState.focusedPane && !layoutState.tableCollapsed && !layoutState.plotsCollapsed && (
        <div
          className="app-pane-divider"
          role="separator"
          aria-label="Resize table and plot panes"
          aria-orientation="horizontal"
          tabIndex={0}
          onPointerDown={e => {
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = layoutState.tablePaneHeightPx;
            const maxHeight = Math.max(160, window.innerHeight - 52 - 38 - 180);

            const handlePointerMove = (moveEvent: PointerEvent) => {
              const nextHeight = Math.max(120, Math.min(maxHeight, startHeight + moveEvent.clientY - startY));
              setTablePaneHeight(nextHeight);
            };

            const handlePointerUp = () => {
              document.body.classList.remove("resizing-panes");
              window.removeEventListener("pointermove", handlePointerMove);
              window.removeEventListener("pointerup", handlePointerUp);
            };

            document.body.classList.add("resizing-panes");
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp, { once: true });
          }}
          onKeyDown={e => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setTablePaneHeight(layoutState.tablePaneHeightPx - 24);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setTablePaneHeight(layoutState.tablePaneHeightPx + 24);
            }
          }}
        />
      )}

      <div className="app-right-inspector">
        <PlotFormattingPanel />
      </div>

      <div className="app-bottom-status">
        <BottomStatusBar />
      </div>

      {isLoading && <LoadingOverlay />}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <ToastHost />
    </div>
  );
}
