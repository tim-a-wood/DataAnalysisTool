import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useAppStore } from '../store/useAppStore';
import { getEChartsInstance } from './echartsInstance';
import { downloadBlob, downloadText } from '../utils/download';
import { formatTimestamp, formatTableValue } from '../utils/format';
import { getSortedGroups } from '../model/selectors';
import { AppTooltip } from './AppTooltip';
import { tooltipContent } from '../config/tooltipContent';

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const workbookModel = useAppStore(s => s.workbookModel);
  const layoutState = useAppStore(s => s.layoutState);
  const plotSet = useAppStore(s => s.plotSet);
  const settings = useAppStore(s => s.settings);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const ts = () => formatTimestamp(new Date());

  const exportTable = async () => {
    const visibleGroups = getSortedGroups(workbookModel.groups)
      .filter(g => layoutState.visibleGroupKeys.includes(g.groupKey));
    const allVisibleVarKeys: string[] = ['Case'];
    for (const grp of visibleGroups) {
      const grpVars = workbookModel.variables
        .filter(v => v.groupKey === grp.groupKey && v.variableKey !== 'Case' && layoutState.visibleVariableKeys.includes(v.variableKey))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      allVisibleVarKeys.push(...grpVars.map(v => v.variableKey));
    }
    const headers = allVisibleVarKeys.map(k => {
      const varDef = workbookModel.variables.find(v => v.variableKey === k);
      return varDef ? `${varDef.displayName} [${varDef.unit}]` : k;
    });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');
    ws.addRow(headers);
    for (const row of workbookModel.rows) {
      ws.addRow(allVisibleVarKeys.map(k => formatTableValue(row[k], k)));
    }
    const buf = await wb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `signallite_table_${ts()}.xlsx`
    );
    useAppStore.getState().showToast('Export complete.');
    setOpen(false);
  };

  const exportPng = () => {
    const inst = getEChartsInstance();
    if (!inst) { useAppStore.getState().showToast('No plot to export.', 'warning'); return; }
    const url = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#070d13' });
    const a = document.createElement('a');
    a.href = url; a.download = `signallite_plots_${ts()}.png`; a.click();
    useAppStore.getState().showToast('Export complete.');
    setOpen(false);
  };

  const exportLayout = () => {
    const data = { layoutState, plotSet, settings };
    downloadText(JSON.stringify(data, null, 2), `signallite_layout_${ts()}.json`);
    useAppStore.getState().showToast('Export complete.');
    setOpen(false);
  };

  return (
    <div className="export-menu" ref={ref}>
      <AppTooltip content={tooltipContent.export}>
        <button className="btn btn-ghost" onClick={() => setOpen(v => !v)}>
          <Download size={13} /> Export
        </button>
      </AppTooltip>
      {open && (
        <div className="export-dropdown">
          <button className="export-item" onClick={exportTable}>Export Visible Table as XLSX</button>
          <button className="export-item" onClick={exportPng}>Export Plot Image as PNG</button>
          <button className="export-item" onClick={exportLayout}>Export Layout as JSON</button>
        </div>
      )}
    </div>
  );
}
