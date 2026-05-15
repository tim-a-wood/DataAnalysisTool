# Final Corrective Action Plan — Review

## Verdict

**Mergeable as written.** Every must-fix item from the prior reviews is addressed, every internal contradiction is fixed, and the design/code-quality items not in the plan body are explicitly handled by Section 18's "fix or defer with linked issue" gate.

## What's resolved since v2

| v2 issue | v3 resolution |
|---|---|
| Variable group header `(N)` count missing | Section 2 — explicit code + acceptance tests |
| Modal/drawer focus trap missing implementation | Section 11 — full `getFocusableElements` + `trapFocus` helper |
| Autosave duplication contradicts spec | Section 12.2 — keeps `AppSettings.autosaveLayout`, drops from `AppLayoutState`, persists settings |
| Sticky-header CSS unbuildable | Section 10.2 — inline style with `hexToRgba(group.color, ...)` |
| Tooltip filter via `plot1::` prefix hack | Section 8.1 — uses `param.axisIndex` / `param.xAxisIndex` |
| "First 5,000 rows" ambiguous | Section 10.3 — explicit "by workbook row order" |
| Reconciliation only at workbook load | Section 12.3 — covers both mount and `loadWorkbook` |
| ESLint deps unpinned | Section 13 — pins `@eslint/js@9.17.0`, `typescript-eslint@8.18.0` |
| `noUnusedLocals` / `noUnusedParameters` not flipped | Section 13 — explicit tsconfig change |
| Vitest jsdom not specified | Section 3 + Section 16 — explicit jsdom requirement |
| `parseWorkbook.test.ts` doesn't test prod code | Section 3 + 12.4 — round-trip via `XLSX.write` |
| Escape doesn't close Export dropdown | Section 10.7 — explicit |
| Conditional performance fix | Section 14.2 — moved to named follow-up issue |
| Green-check affordance | Section 6 — explicit "implement or defer with linked issue" |

## Remaining nits (non-blocking)

### 1. Focus trap — capture and restore previous focus
Section 11's acceptance tests say *"Focus returns to Settings button after close"* and the same for Help, but the implementation snippet (`getFocusableElements` / `trapFocus`) only handles the cycle, not the restore. Add to Section 11:

```ts
// On open
const previouslyFocused = document.activeElement as HTMLElement | null;

// On close
previouslyFocused?.focus?.();
```

Without this the acceptance test for "focus returns to Settings button" won't pass.

### 2. Document the intentional spec deviation in Section 12.2
Spec §7 defines `AppLayoutState.autosaveLayout` and the plan removes it. That's the right call (per the v2 review), but it should be flagged as an **intentional deviation from spec §7** in Section 0 (Scope) or as a note at the top of Section 12.2 — otherwise the next implementer may "fix it back" thinking the spec is authoritative.

### 3. Two small bugs not yet on the plan
Both are one-line fixes; suggest folding into commit 5 ("header, export filename, copy mismatches") or commit 9, or deferring with linked issues per Section 18:

- **`Header.handleFile` leaks `isLoading=true` if `parseWorkbookFile` throws.** Wrap in `try { ... } finally { setIsLoading(false); }` (or rely on `loadWorkbook`/`showError` to clear it, but the throw path currently doesn't).
- **`parseWorkbookFile` catches all SheetJS errors as `"Failed to parse XLSX file."`** Losing the upstream error makes import bugs hard to diagnose. At minimum surface it in dev builds via `console.warn`.

### 4. Section 17 commit 14 lives in the parent repo
Commits 1–13 are in `tim-a-wood/DataAnalysisTool`; commit 14 *"Update parent submodule pointer"* lives in `tim-a-wood/tim-a-wood.github.io`. Worth one explicit line in Section 17 so the implementer doesn't accidentally try to commit the submodule bump on the data-tool repo.

### 5. Section 8.1 — settle on one `axisIndex` name in code
The plan correctly says *"use the ECharts param field that gives the hovered x-axis index"* and offers `axisIndex` or `xAxisIndex` as alternatives. In practice the ECharts `axis`-trigger tooltip params object exposes both: `param.axisIndex` is the index of the axis being triggered, and `param.componentIndex` / `param.seriesIndex` are also available. Pick `axisIndex` and stick with it (or `xAxisIndex` from the series config — but not both in the same function). A note saying *"pick one field, do not switch between them mid-function"* would prevent a `param.axisIndex === param.xAxisIndex` comparison from accidentally being introduced.

## Items legitimately deferred under Section 18

These are the design/code-quality items that don't appear in the plan body. Each should get a linked follow-up issue per Section 18:

- Variable group title color (mockup uses white + colored dot; current code colors the whole title)
- Modal entry scale (currently `0.97 → 1`, spec is `0.98 → 1`)
- Variables row hit-target size (currently ~17 px, recommend 22–24 px)
- Variable group color-band vs dot saturation mismatch
- Table row hover affordance too subtle (5% alpha vs `--hover-bg`)
- Selected-row `!important` in `table.css:9`
- `Toggle` component inline styles (move to CSS, add `:focus-visible` ring)
- ColorSwatch using `background` under the native picker swatch
- Crosshair color `#637385` too subdued — use `--focus-line`
- Legend swatch `16×3` reads as flat; recommend `24×3`
- Grid opacity double-multiplication (slider × `splitLine` alpha)
- Duplicate ARIA: row `role="checkbox"` wrapping `input[type=checkbox]`
- Plot canvases have no `aria-label` / accessible name
- Selectors (`getSortedGroups`, `getAllCases`) not memoized at call sites

## Recommendation

Ship it. Fold the focus-trap restore (item 1) into Section 11 because it's required by the acceptance test there; everything else can land in the same commits or be tracked as follow-ups. Add the line about the spec §7 deviation (item 2) so the next reader doesn't get confused.
