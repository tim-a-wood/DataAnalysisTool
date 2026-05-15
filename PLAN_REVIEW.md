# Updated Corrective Action Plan — Review

Big improvement over v1 — the plan now reads end-to-end and folds in nearly everything from both prior reviews. Below are the remaining gaps and a few internal issues to fix before locking it in.

## Strong improvements over v1

- Single normalization pipeline (Section 3) — no more double-coercion ambiguity.
- Tooltip-filter, Axes section, row caps, app grid, sticky-header opacity all promoted to numbered sections.
- Typed `Partial<Pick<...>>` for grid/cursor patches, layout reconciliation, validation-path cleanup all included.
- ESLint flat config + Prettier are wired in with exact scripts; no vague "or use existing formatter."
- `prefers-reduced-motion` and batched variable-selection actions added.
- Section 17 explicitly requires deferred design/code-quality items to be linked to follow-up issues — this is the right escape hatch.

## Must-fix gaps (blocker-level, still not in the plan)

### 1. Variable group header `(N)` count

Spec §12.7: `▾ Test Inputs (4)`. The plan touches Variables panel in Sections 2 and 10 but never adds the count chip. Should be in Section 2 alongside the protected-Case work, since the count is computed the same way.

### 2. Modal/drawer focus trap implementation

Section 15 manual test says *"Tab repeatedly. Confirm focus remains trapped inside modal,"* but no section in the plan body specifies the implementation. Current code only calls `closeRef.current?.focus()` on mount. Spec §17.2 / §17.3 say *"Focus trap: required."* — that's a hard requirement, not a deferred design item. Add to Section 10 or as a new sub-section: keyboard-cycle Tab/Shift+Tab inside `.modal-box` and `.drawer`, restore focus on close.

## Internal contradictions in the plan

### A. Section 11.2 deviates from the spec data model

Spec §7 defines both `AppLayoutState.autosaveLayout` and `AppSettings.autosaveLayout`, and §18.2 says persistence saves *"layoutState, plotSet, settings."* The plan picks `layoutState.autosaveLayout` as the single source AND removes `settings` from persistence. That contradicts the spec twice over.

**Better resolution**: keep `AppSettings.autosaveLayout` as the source of truth (it's a Settings-modal control), drop the duplicate from `AppLayoutState`, and keep `settings` in the persisted payload. That's a smaller spec deviation and matches where the UI lives.

### B. Section 10.2 sticky-header CSS won't work as written

````css
background-image: linear-gradient(
  rgba(var(--group-rgb), 0.18),
  rgba(var(--group-rgb), 0.18)
);
````

This requires `--group-rgb` to be set as a comma-separated triple (e.g. `47, 140, 255`), but the current code stores hex (`#2f8cff`) and uses `hexToRgba`. As written, no CSS variable is ever set, so the gradient renders nothing.

**Fix**: either pre-compute the rgba at the inline-style level — e.g.

```ts
style={{
  backgroundColor: 'var(--panel-soft)',
  backgroundImage: `linear-gradient(${hexToRgba(g.color, 0.18)}, ${hexToRgba(g.color, 0.18)})`,
}}
```

— or add a `setProperty('--group-rgb', '47,140,255')` step at row render. Spell out which.

### C. Section 8.1 tooltip filter mechanism is hacky

The plan suggests *"If ECharts params do not directly expose hovered plot index, assign each series a stable ID prefix: `plot1::`, `plot2::`, `plot3::`."* ECharts axis-trigger params already expose `axisIndex` / `seriesIndex`, and each series has a known `xAxisIndex`. Filter by `param.axisIndex === hoveredAxisIndex` (derived from the first param). The ID-prefix fallback is brittle and shows up in legends.

### D. Section 10.3 "first 5,000 rows" is ambiguous

"Table renders first 5,000 rows only" — by workbook order or by Case-ascending order? Spec §13 says the table preserves workbook row order, so it should be **first 5,000 by workbook order**. Plots use all rows up to 20,000 (also order-preserving). Spell this out.

### E. Section 11.3 layout reconciliation scope

The plan says reconcile *"After loadWorkbook(model)"*. But `loadLayout` is also called on app mount (`App.tsx:28-30`) and merges into the already-loaded sample model. If a user's saved `selectedCase` is `200` and the sample only has 1–120, the cursor lands on phantom case 200 until the user imports something. Apply reconciliation both at mount-time `loadLayout` and at `loadWorkbook`.

### F. Section 12 ESLint config doesn't pin versions

The flat config imports `@eslint/js` and `typescript-eslint` but the `devDependencies` block only lists `prettier`. Without `@eslint/js` and `typescript-eslint` (and matching versions), `npm run lint` will throw a different error than before. Pin: `@eslint/js@9.17.0`, `typescript-eslint@8.18.0` (both compatible with the existing `eslint@9.17.0` and `typescript@6.0.3`).

### G. Section 14.1 is conditional in a corrective plan

*"If 5,000-row hover is sluggish, implement partial cursor updates."* For a plan whose merge criteria require all blockers fixed, "fix it if you notice" is unusual. Either commit to the side-effect approach now, or move this to a follow-up issue and remove it from Section 16's commit list.

## Smaller cleanups

- **Section 6** correctly fixes `Loaded ·` → `Loaded successfully •`, but the mockup also shows a green checkmark next to the filename. If that affordance is intentional from the mockup, mention it explicitly; otherwise add to the deferred-design list.
- **Section 16** lists 13 commits; Section 1 lists 13 items but item #12 (*"Run full verification"*) is ops, not code. Renumber to avoid implying a 12-as-code mapping.
- **Acceptance test in Section 11.4**: *"parseWorkbook tests exercise the same validation functions used in production"* — make it concrete: *"src/tests/parseWorkbook.test.ts imports `parseWorkbookFile` (not `validateSheets`) and exercises it with an in-memory `XLSX.write` output."*
- **Section 15 keyboard test** has a Tab-cycle check for Settings and Help, but no test that Escape closes the **open Export dropdown** (Section 10.7 spec) — add it.
- **tsconfig**: now that ESLint will catch unused vars, flip `noUnusedLocals` / `noUnusedParameters` to `true` in `tsconfig.json` so the build (`tsc --noEmit`) also catches them. Add to Section 12.
- **Vitest environment**: `vite.config.ts` has `test.environment: 'node'`. If any of the new tests need DOM (e.g. for the Variables panel "still shows Test Inputs" assertion), switch to `jsdom` per-file or globally. Note in Section 11 or 12.

## Recommendation

The plan is mergeable after:

1. Section 11.2's spec deviation is resolved (suggest keeping `AppSettings.autosaveLayout`).
2. Section 10.2's CSS is made buildable.
3. The group-header `(N)` count is added as an explicit work item.
4. The focus-trap implementation is added as an explicit work item rather than only a manual-test check.

Everything else above is polish. Once those four items are folded in, the plan is comprehensive enough that the implementer shouldn't need to make design judgment calls — which was the original ambiguity rule in the spec.
