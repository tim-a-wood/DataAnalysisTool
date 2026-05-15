import { defaultPlotSet } from "../config/defaultPlotConfig";
import type { PlotSet, SeriesConfig, VariableDefinition, WorkbookModel } from "../types/appTypes";

export function clonePlotSet(plotSet: PlotSet): PlotSet {
  return {
    ...plotSet,
    plots: plotSet.plots.map(plot => ({
      ...plot,
      series: plot.series.map(series => ({ ...series, plotMode: series.plotMode ?? "line" })),
    })),
  };
}

function labelForVariable(variable: VariableDefinition): string {
  return variable.unit ? `${variable.displayName} [${variable.unit}]` : variable.displayName;
}

function seriesIdForVariable(variableKey: string): string {
  return `s_${variableKey.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}`;
}

export function ensurePlotSetCoversVariables(plotSet: PlotSet, model: WorkbookModel): PlotSet {
  const next = clonePlotSet(plotSet);
  const firstPlot = next.plots[0];
  if (!firstPlot) return next;

  const existingVariableKeys = new Set(next.plots.flatMap(plot => plot.series.map(series => series.variableKey)));
  const existingIds = new Set(next.plots.flatMap(plot => plot.series.map(series => series.id)));
  const groupsByKey = new Map(model.groups.map(group => [group.groupKey, group]));

  const extraSeries: SeriesConfig[] = model.variables
    .filter(variable => variable.variableKey !== "Case")
    .filter(variable => variable.dataType === "number")
    .filter(variable => !existingVariableKeys.has(variable.variableKey))
    .map(variable => {
      const group = groupsByKey.get(variable.groupKey);
      const baseId = seriesIdForVariable(variable.variableKey);
      const id = existingIds.has(baseId) ? `${baseId}_${existingIds.size}` : baseId;
      existingIds.add(id);
      return {
        id,
        variableKey: variable.variableKey,
        label: labelForVariable(variable),
        color: group?.color ?? "#2f8cff",
        lineStyle: "solid",
        plotMode: "line",
        width: 2,
        yAxis: "left",
        visible: false,
      };
    });

  if (extraSeries.length === 0) return next;
  firstPlot.series = [...firstPlot.series, ...extraSeries];
  return next;
}

export function createPlotSetForWorkbook(model: WorkbookModel): PlotSet {
  return ensurePlotSetCoversVariables(defaultPlotSet, model);
}
