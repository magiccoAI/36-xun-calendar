---
description: Supervised bug-fix process — impact analysis → scoped fix → verification → regression check
---

# Safe Fix Workflow

Use this workflow BEFORE and DURING any bug fix to prevent introducing new bugs.

## Phase 1 — Pre-Fix Impact Analysis

1. **Identify the bug**: State the exact bug, its location (file:line), and the P-level from the bug registry.
2. **Find all dependents**: Search for all files that `import` or reference the affected module/function.
   - Use `grep_search` for import statements and function name references.
3. **Classify scope**:
   - `isolated` — 1 file only → proceed normally
   - `local` — 2-3 files → proceed with caution
   - `cross-cutting` — shared module (State.js, Calendar.js, app.js, Modal.js) → **STOP and flag for user approval before proceeding**
4. **List downstream consumers**: For `cross-cutting` or `local` scope, enumerate every consumer that could break.

## Phase 2 — Baseline Capture

1. **Check existing test coverage**: Look in `src/core/*.test.js` and `src/**/*.test.js` for relevant tests.
2. **If no test exists for the affected area**: Write a minimal characterization test FIRST that captures current behavior (even if buggy). This is the safety net.
3. **Run existing tests**: Execute `npm test` and confirm green baseline before making any change.

## Phase 3 — Scoped Fix

1. **Make the MINIMUM change** to fix the bug. No refactoring, no style improvements, no "while I'm here" changes.
2. **Each edit must include**: a clear `old_string` → `new_string` with a one-line justification.
3. **If the fix requires touching >3 files**: pause, report to user, and reconsider approach.
4. **Never change these without explicit user approval**:
   - `State.js` data shape or persistence logic
   - `Calendar.js` date calculation methods
   - `CONFIG.STORAGE_KEYS` or localStorage key names
   - Any `export` signature that other modules depend on

## Phase 4 — Post-Fix Verification

1. **Re-run all tests**: `npm test` — must pass.
2. **Verify the specific bug is fixed**: Describe what was tested and how.
3. **Check downstream consumers**: For each dependent identified in Phase 1, confirm it still works:
   - State.js changes → verify data persistence (save/reload cycle)
   - Calendar.js changes → verify date boundaries (month-end, year-end, Feb 29)
   - Modal.js changes → verify open/save/close/delete cycle
   - View changes → verify render with both empty and populated data
4. **Manual smoke test checklist** (if dev server available):
   - [ ] Page loads without console errors
   - [ ] Can switch between 36旬 and 全景 views
   - [ ] Can open and save a daily record
   - [ ] Pixel farm renders correctly
   - [ ] Year progress bar displays

## Phase 5 — Regression Checklist

After every fix, verify ALL of the following:

- [ ] No new `!important` added to any CSS
- [ ] No new global `window.*` exposure
- [ ] No new hardcoded color values (must use design tokens or Tailwind classes)
- [ ] No new inline `onclick` handlers in HTML
- [ ] localStorage keys follow `CONFIG.STORAGE_KEYS` pattern (no raw string keys)
- [ ] No new infinite CSS animations without `@media (prefers-reduced-motion: reduce)` guard
- [ ] Responsive behavior verified at 375px, 768px, 1024px widths
- [ ] No new dead code, unused imports, or commented-out code blocks
- [ ] No new `new Date(dateString)` usage — must use `Calendar.parseDateStrToLocalDate()`
- [ ] No duplicate event binding (app.js + component JS on same element)

## Quick Reference: Project Risk Zones

| Risk Level | Modules | Rule |
|-----------|---------|------|
| 🔴 High | `State.js`, `Calendar.js`, `Modal.js`, `app.js` | Any change requires Phase 1 cross-cutting analysis + user approval |
| 🟡 Medium | `MacroView.js`, `DetailView.js`, `SummaryView.js`, `OverviewView.js`, `MoneyAwarenessModule.js` | Check all consumers before editing |
| 🟢 Low | `BodyStateSelector.js`, `SleepSlider.js`, `BackupModal.js`, `SettingsModal.js`, `CompleteSleepModule.js` | Standard caution |
