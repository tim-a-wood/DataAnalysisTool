import type { AppLayoutState } from "../types/appTypes";

/**
 * SPEC DEVIATION: AppLayoutState intentionally excludes autosaveLayout.
 * Per the spec §7, autosaveLayout should be in AppLayoutState, but it has been moved to AppSettings
 * for cleaner separation of concerns: AppLayoutState manages UI state, AppSettings manages feature toggles.
 * The autosaveLayout setting is persisted independently with other settings.
 */
export const defaultLayout: AppLayoutState = {
  visibleGroupKeys: ["test_inputs","expected_outputs","actual_outputs","tolerances","absolute_error","relative_error","inputs","logged_data"],
  visibleVariableKeys: ["GrossWeight","PressureAltitude","OAT","VR_Exp","V2_Exp","TODist_Exp","VR_Act","V2_Act","TODist_Act","VR_Tol","V2_Tol","TODist_Tol","VR_AbsErr","V2_AbsErr","TODist_AbsErr","VR_RelErr","V2_RelErr","TODist_RelErr","FlapsSetting","RunwayCondition","AntiIce","Notes","PassFail"],
  collapsedGroupKeys: [],
  selectedCase: 24,
  hoveredCase: null,
  hoveredCaseRawX: null,
  referenceCase: 24,
  xRange: [20, 36],
  currentWindowSpan: 16,
  zoomSliderValue: 86,
  activePlotSetId: "performance_summary",
  showXGrid: true,
  showYGrid: true,
  showMinorGrid: false,
  gridStyle: "dashed",
  gridOpacity: 30,
  showCrosshair: true,
  snapToData: true,
  showTooltips: true,
};
