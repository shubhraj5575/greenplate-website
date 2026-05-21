# Form NaN-on-empty fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop every `NumberField` in the calculator wizards from showing the user "Invalid input: expected number, received NaN" when its input is empty. Replace it with the standard Zod "Required" message, and only after the user has touched the field.

**Architecture:** Pull the empty→number coercion into a pure helper in `lib/utils.ts`. Unit-test it directly (no component test runtime needed). Wire it into the shared `NumberField` in `components/calc/inputs/Field.tsx` via React Hook Form's `setValueAs`. No schema changes. No new dependencies.

**Tech Stack:** React Hook Form 7.x · Zod 3.x · Vitest 4.x · TypeScript 5.x · Tailwind v4.

**Correction vs. spec:** The spec said `components/auth/OnboardingForm.tsx` also needed fixing. Investigation showed that file is a server-action form (native `<form action>` + FormData), not React Hook Form. It cannot hit the NaN bug. The spec will be amended in the final commit. Net plan: **one file changed**, one helper added, one test file added.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/utils.ts` | Modify (append helper) | Add `emptyToNumberOrUndefined(v)` pure function. |
| `__tests__/utils.test.ts` | Create | Unit tests for the helper. |
| `components/calc/inputs/Field.tsx` | Modify (`NumberField` only) | Use the helper in `register(name, { setValueAs })`. |
| `docs/superpowers/specs/2026-05-21-form-nan-fix-design.md` | Modify | Strike the OnboardingForm section; record this correction. |

All other forms (`IndividualWizard`, `OrgWizard`, every step component) consume `NumberField` and inherit the fix automatically. They are not modified.

---

## Task 1: Add the empty→number helper with TDD

**Files:**
- Modify: `lib/utils.ts` (append at end of file)
- Create: `__tests__/utils.test.ts`

- [ ] **Step 1.1: Write the failing test**

Create `__tests__/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { emptyToNumberOrUndefined } from "@/lib/utils";

describe("emptyToNumberOrUndefined", () => {
  it("returns undefined for empty string", () => {
    expect(emptyToNumberOrUndefined("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(emptyToNumberOrUndefined(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(emptyToNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("returns undefined for NaN input", () => {
    expect(emptyToNumberOrUndefined(NaN)).toBeUndefined();
  });

  it("returns undefined for non-numeric strings", () => {
    expect(emptyToNumberOrUndefined("abc")).toBeUndefined();
  });

  it("parses integer strings", () => {
    expect(emptyToNumberOrUndefined("42")).toBe(42);
  });

  it("parses decimal strings", () => {
    expect(emptyToNumberOrUndefined("3.14")).toBeCloseTo(3.14);
  });

  it("parses negative decimal strings", () => {
    expect(emptyToNumberOrUndefined("-0.5")).toBeCloseTo(-0.5);
  });

  it("passes finite numbers through unchanged", () => {
    expect(emptyToNumberOrUndefined(7)).toBe(7);
    expect(emptyToNumberOrUndefined(0)).toBe(0);
  });

  it("returns undefined for Infinity", () => {
    expect(emptyToNumberOrUndefined(Infinity)).toBeUndefined();
    expect(emptyToNumberOrUndefined(-Infinity)).toBeUndefined();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(emptyToNumberOrUndefined(" 12 ")).toBe(12);
    expect(emptyToNumberOrUndefined("   ")).toBeUndefined();
  });
});
```

- [ ] **Step 1.2: Run the test to confirm it fails**

```bash
cd greenplate-website
pnpm vitest run __tests__/utils.test.ts
```

Expected: FAIL — `emptyToNumberOrUndefined is not a function` (or `not exported`).

- [ ] **Step 1.3: Implement the helper**

Read the current end of `lib/utils.ts` first to know where to append. Then append:

```ts
/**
 * Coerce a form input value to a finite number, or undefined.
 *
 * React Hook Form's built-in `valueAsNumber: true` produces `NaN` from
 * empty inputs, which then fails Zod's `z.number()` with the developer-
 * facing message "Invalid input: expected number, received NaN".
 *
 * Use this with `register(name, { setValueAs: emptyToNumberOrUndefined })`
 * so the form state holds `undefined` for empty fields. Zod's `z.number()`
 * will then reject empty as "Required" — which is what users expect.
 */
export function emptyToNumberOrUndefined(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : undefined;
  }
  return undefined;
}
```

- [ ] **Step 1.4: Run the test to confirm it passes**

```bash
pnpm vitest run __tests__/utils.test.ts
```

Expected: PASS (11 assertions).

- [ ] **Step 1.5: Run the full test suite to confirm nothing else broke**

```bash
pnpm vitest run
```

Expected: PASS — 50 prior tests still pass + 11 new ones = **61 total**.

---

## Task 2: Wire the helper into NumberField

**Files:**
- Modify: `components/calc/inputs/Field.tsx:31` (the `<input>` inside `NumberField`)

- [ ] **Step 2.1: Update the import block at the top of the file**

Read the top of `components/calc/inputs/Field.tsx`. The current imports are:

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
```

Change to:

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { cn, emptyToNumberOrUndefined } from "@/lib/utils";
```

- [ ] **Step 2.2: Replace `valueAsNumber: true` with the helper**

Find this block in `NumberField` (around line 30):

```tsx
<input
  type="number"
  inputMode="decimal"
  step={step ?? "any"}
  min={min}
  max={max}
  {...register(name, { valueAsNumber: true })}
  className={cn(
    "w-full rounded-pill border bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700",
    err ? "border-danger" : "border-forest-700/15",
  )}
/>
```

Change the `register` call:

```tsx
<input
  type="number"
  inputMode="decimal"
  step={step ?? "any"}
  min={min}
  max={max}
  {...register(name, { setValueAs: emptyToNumberOrUndefined })}
  className={cn(
    "w-full rounded-pill border bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700",
    err ? "border-danger" : "border-forest-700/15",
  )}
/>
```

- [ ] **Step 2.3: Build to catch any type errors**

```bash
pnpm build
```

Expected: PASS. Build completes without TypeScript errors. (Build is faster than typecheck here because it does the full type pass anyway and surfaces issues in compiled output.)

If errors surface (most likely a schema-level type mismatch where some field's Zod inferred type was `number` and now `number | undefined`), inspect the failing file and confirm whether the user really wanted that field optional. For required fields, no schema change is needed — the form-level `z.number()` will still reject `undefined` with "Required" at submit time. If the build fails on something else, STOP and report rather than guess.

- [ ] **Step 2.4: Run the test suite again**

```bash
pnpm vitest run
```

Expected: PASS — 61 total. The wizard logic tests in `__tests__/individual.test.ts` and `__tests__/organization.test.ts` should still pass because the schemas are unchanged.

---

## Task 3: Amend the spec to reflect the discovery

**Files:**
- Modify: `docs/superpowers/specs/2026-05-21-form-nan-fix-design.md`

- [ ] **Step 3.1: Remove the OnboardingForm section from the spec**

Open the spec and find section **"### 2. `components/auth/OnboardingForm.tsx`"**. Replace it with:

```markdown
### 2. ~~`components/auth/OnboardingForm.tsx`~~ — no change needed

**Correction noted during implementation:** OnboardingForm uses a native
HTML `<form action={...}>` with FormData and a server action, not React
Hook Form. Its `<input type="number">` fields submit as raw strings to
the server action. There is no `valueAsNumber` coercion path and
therefore no NaN bug. The original spec was wrong on this point.
```

Also strike the matching row from the "Files touched" list — it's now only one file.

- [ ] **Step 3.2: Update the success-criteria section**

In the "Success criteria" section, remove item 6 (the OnboardingForm/household_size verification step). Leave the others.

---

## Task 4: Commit

**Files:**
- Stage: `lib/utils.ts`, `__tests__/utils.test.ts`, `components/calc/inputs/Field.tsx`, `docs/superpowers/specs/2026-05-21-form-nan-fix-design.md`

- [ ] **Step 4.1: Verify the staged diff is exactly what's expected**

```bash
git add lib/utils.ts __tests__/utils.test.ts components/calc/inputs/Field.tsx docs/superpowers/specs/2026-05-21-form-nan-fix-design.md
git diff --cached --stat
```

Expected output (line counts approximate, signs/files MUST match exactly):

```
 __tests__/utils.test.ts                                | 50 ++++++++++
 components/calc/inputs/Field.tsx                       |  4 +-
 docs/superpowers/specs/2026-05-21-form-nan-fix-design.md | ~16 lines changed
 lib/utils.ts                                           | 22 +++++
 4 files changed, ...
```

If a different set of files is staged, STOP and fix.

- [ ] **Step 4.2: Commit**

```bash
git commit -m "$(cat <<'EOF'
Workstream A: fix NumberField NaN-on-empty bug

NumberField was registered with `valueAsNumber: true`, which RHF coerces
via Number("") → NaN on an empty input. Zod's z.number() then rejects
with the developer-facing "expected number, received NaN" message.

Fix: replace `valueAsNumber: true` with `setValueAs: emptyToNumberOrUndefined`,
a pure helper that returns undefined for empty/null/whitespace/non-finite
inputs and the parsed number otherwise. Form state now holds undefined
for empty fields, so Zod surfaces "Required" — which is the right UX.

11 unit tests cover the helper's edge cases (empty, null, NaN, Infinity,
whitespace, integer/decimal/negative strings).

Also: amend the original spec to drop the OnboardingForm fix that
investigation showed isn't needed (OnboardingForm is a server-action
form, not RHF — no NaN code path).

Closes Workstream A.
EOF
)"
```

- [ ] **Step 4.3: Push**

```bash
git push "https://shubhraj5575:${GH_PAT}@github.com/shubhraj5575/greenplate-website.git" main
```

Expected: push succeeds, prints the new commit hash.

---

## Task 5: Redeploy and verify in production

**Files:** none (deploys the pushed commit).

- [ ] **Step 5.1: Trigger a Netlify production redeploy**

```bash
cd greenplate-website
NETLIFY_AUTH_TOKEN="${NETLIFY_PAT}" \
  pnpm --package=netlify-cli dlx netlify deploy --build --prod
```

Expected: build runs, "Deploy is live!" message, new deploy URL printed.

- [ ] **Step 5.2: Run the manual smoke check on the deployed URL**

Open https://greenplate-website.netlify.app/org/calculate in a browser (signed in as your org account). Walk through:

1. Go to **Scope 3a · Menu items**. The first menu-item row's "kg CO₂e / serving" shows `0` — no red error text.
2. Click that field, select the `0`, delete. Field is empty. **No error text appears** (because the field is touched but mode is onBlur, so error waits for blur).
3. Tab out of the field. Error appears, reads **"Required"** (or similar Zod-default Required message) — NOT "Invalid input: expected number, received NaN".
4. Click back in, type `0.9`, tab out. Error disappears.
5. Go to https://greenplate-website.netlify.app/calculate (individual). On the Consumption step, repeat the same with **Electricity** (kWh) — empty → blur → "Required"; type `300` → blur → no error.

If any of those five checks fails, STOP and capture which one + a screenshot of what the page shows.

- [ ] **Step 5.3: Mark workstream A complete in the task list**

```
TaskUpdate({ taskId: "11", status: "completed" })
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Covered by |
|---|---|
| Empty NumberField shows no error on first paint | Task 2.2 (mode stays onBlur, setValueAs returns undefined, no error fired until touched) |
| Empty NumberField after interaction shows "Required" | Task 2.2 + Task 5.2 step 3 verifies |
| Filled valid number shows no error | Task 5.2 step 4 |
| Filled invalid non-numeric (e.g. paste "abc") handled | Task 1.1 covers the helper; the browser type=number filters most non-numeric input anyway |
| `pnpm vitest run` passes | Task 1.5, Task 2.4 |
| OnboardingForm fix | **Withdrawn** in Task 3 — investigation showed it's not affected |

All other spec requirements are satisfied by the design itself (no schema changes, no mode change, no new dependencies).

**Placeholder scan:** Zero placeholders. Every step has the exact code, command, or expected output an engineer needs.

**Type consistency:** Helper signature `emptyToNumberOrUndefined(v: unknown): number | undefined` is used consistently in test, definition, and the Field.tsx import.

**Risk recheck:** The one risk is a Zod schema somewhere assumed `NaN` would propagate. The schemas in `lib/calc/individual.ts` and `lib/calc/organization.ts` use `z.number()` with no NaN-specific branch — they'll just reject undefined with "Required", which is the desired UX. Task 2.3 (build) will catch any inferred-type mismatch before deploy.
