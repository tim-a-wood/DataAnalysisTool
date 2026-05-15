import { useState } from 'react';
import { GripVertical, PanelLeftClose } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getOrderedGroups } from '../model/selectors';
import { AppTooltip } from './AppTooltip';
import { tooltipContent } from '../config/tooltipContent';

export function DataGroupsPanel() {
  const [draggingGroupKey, setDraggingGroupKey] = useState<string | null>(null);
  const [dragOverGroupKey, setDragOverGroupKey] = useState<string | null>(null);
  const workbookModel = useAppStore(s => s.workbookModel);
  const layoutState = useAppStore(s => s.layoutState);
  const toggleGroup = useAppStore(s => s.toggleGroup);
  const toggleLeftPanel = useAppStore(s => s.toggleLeftPanel);
  const reorderGroup = useAppStore(s => s.reorderGroup);

  const sorted = getOrderedGroups(workbookModel.groups, layoutState.groupOrderKeys);

  const getCount = (groupKey: string) => {
    const isVis = layoutState.visibleGroupKeys.includes(groupKey);
    if (!isVis) return 0;
    return workbookModel.variables
      .filter(v => v.groupKey === groupKey && (v.variableKey === 'Case' || layoutState.visibleVariableKeys.includes(v.variableKey)))
      .length;
  };

  return (
    <div style={{ flexShrink: 0 }}>
      <div className="sidebar-section-header">
        <span>DATA GROUPS</span>
        <AppTooltip content="Hide left panels">
          <button className="panel-local-toggle" onClick={toggleLeftPanel} aria-label="Hide left panels">
            <PanelLeftClose size={13} />
          </button>
        </AppTooltip>
      </div>
      <AppTooltip content={tooltipContent.dataGroups}>
        <div>
          {sorted.map((g, i) => {
            const isVisible = layoutState.visibleGroupKeys.includes(g.groupKey);
            return (
              <div
                key={g.groupKey}
                className={`group-row${draggingGroupKey === g.groupKey ? ' dragging' : ''}${dragOverGroupKey === g.groupKey ? ' drag-over' : ''}`}
                draggable
                onClick={() => toggleGroup(g.groupKey)}
                onDragStart={e => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', g.groupKey);
                  setDraggingGroupKey(g.groupKey);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverGroupKey(g.groupKey);
                }}
                onDragLeave={() => setDragOverGroupKey(current => current === g.groupKey ? null : current)}
                onDrop={e => {
                  e.preventDefault();
                  const sourceGroupKey = e.dataTransfer.getData('text/plain') || draggingGroupKey;
                  if (sourceGroupKey) reorderGroup(sourceGroupKey, g.groupKey);
                  setDraggingGroupKey(null);
                  setDragOverGroupKey(null);
                }}
                onDragEnd={() => {
                  setDraggingGroupKey(null);
                  setDragOverGroupKey(null);
                }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleGroup(g.groupKey)}
                  onClick={e => e.stopPropagation()}
                />
                <span className="group-drag-handle" aria-hidden="true">
                  <GripVertical size={12} />
                </span>
                <span className="group-index">{i + 1}</span>
                <span className="group-color-dot" style={{ background: g.color }} />
                <span className="group-name">{g.displayName}</span>
                <span className="group-count">{getCount(g.groupKey)}</span>
              </div>
            );
          })}
        </div>
      </AppTooltip>
    </div>
  );
}
