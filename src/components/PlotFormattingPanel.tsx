import React from "react";
import { PanelRightClose } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Toggle } from "./Toggle";
import { Select } from "./Select";
import { ColorSwatch } from "./ColorSwatch";
import { Button } from "./Button";
import { AppTooltip } from "./AppTooltip";
import { tooltipContent } from "../config/tooltipContent";
import { getOrderedGroups, getVariablesForGroup } from "../model/selectors";
import type { SeriesConfig, VariableDefinition } from "../types/appTypes";

const LINE_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

const WIDTH_OPTIONS = [
  { value: "1", label: "1px" },
  { value: "2", label: "2px" },
  { value: "3", label: "3px" },
];

const AXIS_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const PLOT_MODE_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "samples", label: "Samples" },
];

const PLOT_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6].map(count => ({ value: String(count), label: String(count) }));

const GRID_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export function PlotFormattingPanel() {
  const [search, setSearch] = React.useState("");
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<string | null>(null);
  const workbookModel = useAppStore(s => s.workbookModel);
  const plotSet = useAppStore(s => s.plotSet);
  const layoutState = useAppStore(s => s.layoutState);
  const updateSeriesConfig = useAppStore(s => s.updateSeriesConfig);
  const setPlotCount = useAppStore(s => s.setPlotCount);
  const setSelectedPlotId = useAppStore(s => s.setSelectedPlotId);
  const clearAllPlots = useAppStore(s => s.clearAllPlots);
  const clearSelectedPlot = useAppStore(s => s.clearSelectedPlot);
  const moveSeriesToPlot = useAppStore(s => s.moveSeriesToPlot);
  const toggleRightPanel = useAppStore(s => s.toggleRightPanel);
  const togglePlotGroupCollapse = useAppStore(s => s.togglePlotGroupCollapse);
  const setGridConfig = useAppStore(s => s.setGridConfig);
  const setCursorConfig = useAppStore(s => s.setCursorConfig);
  const resetView = useAppStore(s => s.resetView);

  const {
    showXGrid, showYGrid, showMinorGrid, gridStyle, gridOpacity,
    showCrosshair, snapToData, showTooltips,
    plotCollapsedGroupKeys,
    selectedPlotId,
  } = layoutState;

  const seriesByVariableKey = React.useMemo(() => {
    return new Map(plotSet.plots.flatMap(plot => plot.series.map(series => [series.variableKey, series])));
  }, [plotSet]);

  const plotOptions = React.useMemo(() => {
    return plotSet.plots.map((plot, index) => ({
      value: plot.id,
      label: `${index + 1}: ${plot.title}`,
    }));
  }, [plotSet.plots]);

  const plotIdBySeriesId = React.useMemo(() => {
    return new Map(plotSet.plots.flatMap(plot => plot.series.map(series => [series.id, plot.id])));
  }, [plotSet.plots]);

  const variableByKey = React.useMemo(() => {
    return new Map(workbookModel.variables.map(variable => [variable.variableKey, variable]));
  }, [workbookModel.variables]);

  const seriesById = React.useMemo(() => {
    return new Map(plotSet.plots.flatMap(plot => plot.series.map(series => [series.id, series])));
  }, [plotSet.plots]);

  const searchLower = search.toLowerCase().trim();

  const groupedSeries = React.useMemo(() => {
    return getOrderedGroups(workbookModel.groups, layoutState.groupOrderKeys)
      .map(group => {
        const variables: { variable: VariableDefinition; series: SeriesConfig }[] = [];
        for (const variable of getVariablesForGroup(workbookModel.variables, group.groupKey)) {
          if (variable.variableKey === "Case" || variable.dataType !== "number") continue;
          if (
            searchLower &&
            !variable.displayName.toLowerCase().includes(searchLower) &&
            !variable.variableKey.toLowerCase().includes(searchLower) &&
            !variable.unit.toLowerCase().includes(searchLower) &&
            !group.displayName.toLowerCase().includes(searchLower)
          ) {
            continue;
          }
          const series = seriesByVariableKey.get(variable.variableKey);
          if (series) variables.push({ variable, series });
        }
        return { group, variables };
      })
      .filter(group => group.variables.length > 0 || !searchLower);
  }, [workbookModel, layoutState.groupOrderKeys, searchLower, seriesByVariableKey]);

  const firstSeries = groupedSeries.flatMap(group => group.variables.map(item => item.series))[0] ?? null;
  const selectedSeries = selectedSeriesId ? seriesById.get(selectedSeriesId) : null;
  const activeSeries = selectedSeries ?? firstSeries;
  const activeVariable = activeSeries ? variableByKey.get(activeSeries.variableKey) : null;

  React.useEffect(() => {
    if (!selectedSeriesId && firstSeries) setSelectedSeriesId(firstSeries.id);
    else if (selectedSeriesId && !seriesById.has(selectedSeriesId)) setSelectedSeriesId(firstSeries?.id ?? null);
  }, [firstSeries, selectedSeriesId, seriesById]);

  return (
    <div className="plot-panel">
      <div className="plot-panel-section">
        <div className="sidebar-section-header" style={{ padding: "8px 0 4px" }}>
          <AppTooltip content={tooltipContent.plotFormatting}>
            <span className="sidebar-section-title">Plot Formatting</span>
          </AppTooltip>
          <AppTooltip content="Hide plot formatting panel">
            <button className="panel-local-toggle" onClick={toggleRightPanel} aria-label="Hide plot formatting panel">
              <PanelRightClose size={13} />
            </button>
          </AppTooltip>
        </div>
      </div>

      <div className="search-input-wrapper">
        <AppTooltip content={tooltipContent.plotVariablesSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search plot variables..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search plot variables"
          />
        </AppTooltip>
      </div>

      {/* Plot Set Selection */}
      <div className="plot-panel-section plot-config-section">
        <div className="plot-panel-section-title">Plot Set</div>
        <div className="plot-control-card">
          <Select
            value={plotSet.id}
            onChange={() => {}}
            options={[{ value: plotSet.id, label: plotSet.name }]}
            disabled
          />
        </div>
        <div className="plot-structure-controls">
          <div className="grid-row">
            <span className="grid-row-label">Stacked Plots</span>
            <Select
              value={String(plotSet.plots.length)}
              onChange={v => setPlotCount(Number(v))}
              options={PLOT_COUNT_OPTIONS}
            />
          </div>
          <div className="grid-row">
            <span className="grid-row-label">Selected Subplot</span>
            <Select
              value={selectedPlotId ?? plotSet.plots[0]?.id ?? ""}
              onChange={setSelectedPlotId}
              options={plotOptions}
            />
          </div>
          <div className="plot-clear-actions">
            <Button variant="ghost" size="sm" onClick={clearAllPlots}>Clear All</Button>
            <Button variant="ghost" size="sm" onClick={clearSelectedPlot}>Clear Selected</Button>
          </div>
        </div>
      </div>

      <div className="plot-panel-section plot-config-section">
        <div className="plot-panel-section-title">Selected Variable</div>
        {activeSeries && activeVariable ? (
          <div className="series-editor">
            <div className="series-editor-header">
              <input
                type="checkbox"
                checked={activeSeries.visible}
                onChange={e => updateSeriesConfig(activeSeries.id, { visible: e.target.checked })}
                aria-label={`Toggle ${activeSeries.label}`}
              />
              <ColorSwatch color={activeSeries.color} onChange={color => updateSeriesConfig(activeSeries.id, { color })} />
              <div className="series-editor-title">
                <span>{activeVariable.displayName}</span>
                <span>{activeVariable.unit}</span>
              </div>
            </div>
            <div className="series-editor-grid">
              <Select
                value={activeSeries.plotMode ?? "line"}
                onChange={v => updateSeriesConfig(activeSeries.id, { plotMode: v as "line" | "samples" })}
                options={PLOT_MODE_OPTIONS}
              />
              <Select
                value={activeSeries.lineStyle}
                onChange={v => updateSeriesConfig(activeSeries.id, { lineStyle: v as "solid" | "dashed" | "dotted" })}
                options={LINE_STYLE_OPTIONS}
                disabled={(activeSeries.plotMode ?? "line") === "samples"}
              />
              <Select
                value={String(activeSeries.width)}
                onChange={v => updateSeriesConfig(activeSeries.id, { width: Number(v) })}
                options={WIDTH_OPTIONS}
              />
              <Select
                value={activeSeries.yAxis}
                onChange={v => updateSeriesConfig(activeSeries.id, { yAxis: v as "left" | "right" })}
                options={AXIS_OPTIONS}
              />
            </div>
            <Select
              value={plotIdBySeriesId.get(activeSeries.id) ?? plotSet.plots[0]?.id ?? ""}
              onChange={v => moveSeriesToPlot(activeSeries.id, v)}
              options={plotOptions}
            />
          </div>
        ) : (
          <div className="series-editor-empty">No plot variable selected.</div>
        )}
      </div>

      {groupedSeries.map(({ group, variables }) => (
        <div key={group.groupKey} className="plot-panel-section">
          <div
            className="plot-series-group-header"
            onClick={() => togglePlotGroupCollapse(group.groupKey)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") togglePlotGroupCollapse(group.groupKey); }}
            aria-expanded={!plotCollapsedGroupKeys.includes(group.groupKey)}
          >
            <span className={`variable-group-chevron${plotCollapsedGroupKeys.includes(group.groupKey) ? " collapsed" : ""}`}>▾</span>
            <span className="group-color-dot" style={{ background: group.color }} />
            <span className="plot-panel-section-title series-group-title">{group.displayName}</span>
          </div>
          {!(plotCollapsedGroupKeys.includes(group.groupKey) && !searchLower) && variables.map(({ variable, series: s }) => (
            <div
              key={s.id}
              className={`series-row${activeSeries?.id === s.id ? " selected" : ""}`}
              onClick={() => setSelectedSeriesId(s.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setSelectedSeriesId(s.id); }}
            >
              <div className="series-row-top">
                <AppTooltip content={tooltipContent.seriesVisibility}>
                  <input
                    type="checkbox"
                    checked={s.visible}
                    onChange={e => updateSeriesConfig(s.id, { visible: e.target.checked })}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Toggle ${s.label}`}
                  />
                </AppTooltip>
                <span className="series-label" title={s.label}>{variable.displayName}</span>
                <span className="series-unit">{variable.unit}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Grid */}
      <div className="plot-panel-section">
        <div className="plot-panel-section-title">Grid</div>
        <div className="grid-row">
          <span className="grid-row-label">X Grid</span>
          <AppTooltip content={tooltipContent.gridToggle}>
            <Toggle checked={showXGrid} onChange={v => setGridConfig({ showXGrid: v })} />
          </AppTooltip>
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Y Grid</span>
          <AppTooltip content={tooltipContent.gridToggle}>
            <Toggle checked={showYGrid} onChange={v => setGridConfig({ showYGrid: v })} />
          </AppTooltip>
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Minor Grid</span>
          <Toggle checked={showMinorGrid} onChange={v => setGridConfig({ showMinorGrid: v })} />
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Style</span>
          <Select value={gridStyle} onChange={v => setGridConfig({ gridStyle: v as "solid" | "dashed" | "dotted" })} options={GRID_STYLE_OPTIONS} />
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Opacity</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={gridOpacity}
              onChange={e => setGridConfig({ gridOpacity: Number(e.target.value) })}
              style={{ width: 60, accentColor: "var(--blue)" }}
              aria-label="Grid opacity"
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 28, fontFamily: "var(--font-mono)" }}>{gridOpacity}%</span>
          </div>
        </div>
      </div>

      {/* Cursor */}
      <div className="plot-panel-section">
        <div className="plot-panel-section-title">Cursor</div>
        <div className="grid-row">
          <span className="grid-row-label">Crosshair</span>
          <AppTooltip content={tooltipContent.cursorToggle}>
            <Toggle checked={showCrosshair} onChange={v => setCursorConfig({ showCrosshair: v })} />
          </AppTooltip>
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Snap to Data</span>
          <AppTooltip content={tooltipContent.snapToData}>
            <Toggle checked={snapToData} onChange={v => setCursorConfig({ snapToData: v })} />
          </AppTooltip>
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Tooltips</span>
          <AppTooltip content={tooltipContent.showTooltips}>
            <Toggle checked={showTooltips} onChange={v => setCursorConfig({ showTooltips: v })} />
          </AppTooltip>
        </div>
      </div>

      {/* X Axis Navigation */}
      <div className="plot-panel-section">
        <div className="plot-panel-section-title">X Axis Navigation</div>
        <div className="grid-row">
          <span className="grid-row-label">Zoom Behavior</span>
          <Button variant="ghost" size="sm" disabled>Horizontal</Button>
        </div>
        <div className="grid-row">
          <span className="grid-row-label">Zoom Mode</span>
          <Button variant="ghost" size="sm" disabled>Brush + Controls</Button>
        </div>
      </div>

      {/* Reset View */}
      <div className="plot-panel-section">
        <Button variant="ghost" size="sm" onClick={resetView} style={{ width: "100%" }}>Reset View</Button>
      </div>
    </div>
  );
}
