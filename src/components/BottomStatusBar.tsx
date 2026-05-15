import React, { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { getRowByCase } from "../model/selectors";

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metricTone(value: number, warnAt: number, badAt: number): "good" | "warn" | "bad" {
  if (value >= badAt) return "bad";
  if (value >= warnAt) return "warn";
  return "good";
}

function passTone(value: number): "good" | "warn" | "bad" {
  if (value < 75) return "bad";
  if (value < 90) return "warn";
  return "good";
}

export function BottomStatusBar() {
  const workbookModel = useAppStore(s => s.workbookModel);
  const layoutState = useAppStore(s => s.layoutState);

  const { rows } = workbookModel;
  const { selectedCase, hoveredCase, hoveredCaseRawX } = layoutState;
  const displayCase = hoveredCase ?? selectedCase;

  const row = useMemo(() => {
    if (displayCase === null) return undefined;
    return getRowByCase(rows, displayCase);
  }, [rows, displayCase]);

  const metrics = useMemo(() => {
    const passCount = rows.filter(r => String(r["PassFail"]).toUpperCase() === "PASS").length;
    const passPct = rows.length > 0 ? (passCount / rows.length) * 100 : 0;
    const tolerancePairs = [
      ["VR_AbsErr", "VR_Tol"],
      ["V2_AbsErr", "V2_Tol"],
      ["TODist_AbsErr", "TODist_Tol"],
    ] as const;
    const relKeys = ["VR_RelErr", "V2_RelErr", "TODist_RelErr"] as const;
    const utilizationValues: number[] = [];
    const relativeValues: number[] = [];

    for (const r of rows) {
      for (const [errKey, tolKey] of tolerancePairs) {
        const err = asNumber(r[errKey]);
        const tol = asNumber(r[tolKey]);
        if (err !== null && tol !== null && tol !== 0) utilizationValues.push(Math.abs(err) / Math.abs(tol) * 100);
      }
      for (const relKey of relKeys) {
        const rel = asNumber(r[relKey]);
        if (rel !== null) relativeValues.push(Math.abs(rel));
      }
    }

    const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const max = (values: number[]) => values.length ? Math.max(...values) : 0;

    return {
      passPct,
      avgToleranceUse: average(utilizationValues),
      maxToleranceUse: max(utilizationValues),
      avgRelativeError: average(relativeValues),
    };
  }, [rows]);

  // ΔX: difference between hoveredCaseRawX and selectedCase
  let dxStr = "";
  if (hoveredCaseRawX !== null && selectedCase !== null) {
    const dx = hoveredCaseRawX - selectedCase;
    dxStr = ` | ΔX: ${dx > 0 ? "+" : ""}${dx.toFixed(1)}`;
  }

  return (
    <div
      className="bottom-status-content"
    >
      <span className="bottom-status-current">
        {displayCase !== null ? `Case # ${displayCase}${dxStr}` : "No case selected"}
      </span>
      <span className={`metric-chip ${passTone(metrics.passPct)}`}>
        <span>% Passed</span>
        <strong>{metrics.passPct.toFixed(1)}%</strong>
      </span>
      <span className={`metric-chip ${metricTone(metrics.avgToleranceUse, 50, 85)}`}>
        <span>Avg Tol Use</span>
        <strong>{metrics.avgToleranceUse.toFixed(1)}%</strong>
      </span>
      <span className={`metric-chip ${metricTone(metrics.maxToleranceUse, 80, 100)}`}>
        <span>Max Tol Use</span>
        <strong>{metrics.maxToleranceUse.toFixed(1)}%</strong>
      </span>
      <span className={`metric-chip ${metricTone(metrics.avgRelativeError, 1, 3)}`}>
        <span>Avg Rel Err</span>
        <strong>{metrics.avgRelativeError.toFixed(2)}%</strong>
      </span>
    </div>
  );
}
