# Form NaN-on-empty fix — design

**Date:** 2026-05-21
**Workstream:** A of three (A: form bug fixes · C: food data expansion · B: visual polish)
**Status:** Awaiting user approval

## Problem

The screenshot at https://greenplate-website.netlify.app/org/calculate shows
a fresh menu-item row with the **kg CO₂e / serving** field empty and the
inline error **"Invalid input: expected number, received NaN"** below it.

This message is technically accurate but reads as a developer error message
to end users, and the field hasn't been filled in once — Zod is rejecting
what it just received from React Hook Form.

### Root cause

`components/calc/inputs/Field.tsx` registers every `<NumberField>` with
`{ valueAsNumber: true }`:

```tsx
<input type="number" {...register(name, { valueAsNumber: true })} />
```

When the user clears the input (or it starts empty), RHF coerces the empty
string with `Number("")`, which is `NaN`. The wizard runs with
`mode: 'onBlur'`, so on blur Zod's `z.number()` validator sees `NaN` and
rejects with that exact developer-facing message.

### Why it surfaces here

- `useFieldArray` appends new `menu_items` with `kgco2e_per_serving: 0`
  (OrgWizard.tsx:144). The first paint shows `0`.
- User clicks the field, selects the `0`, deletes it intending to type
  their own number. Mid-typing the field is empty.
- On blur (intentional or via tab) the empty state triggers the NaN
  validation.

This affects **every** `NumberField` in the app, in all three forms:

| File | Forms |
|---|---|
| `components/calc/IndividualWizard.tsx` | Individual calculator (5 steps × ~10 number fields) |
| `components/calc/OrgWizard.tsx` | Org calculator (4 steps × ~12 number fields, incl. dynamic menu/transport arrays) |
| `components/auth/OnboardingForm.tsx` | Onboarding household-size, employees, seats — **uses raw `<input type="number">`, not NumberField** |

## Goal

After the fix:

- An empty `NumberField` shows no error on first paint.
- An empty `NumberField` after the user has interacted with it shows
  the message **"Required"** (or context-specific equivalent from the Zod
  schema), **not** "expected number, received NaN".
- A filled `NumberField` with a valid number shows no error.
- A filled `NumberField` with a non-numeric value (impossible via
  `type=number` but possible via paste of "abc") shows a sensible message.

## Approach (chosen: A from brainstorm)

Two changes, deliberately small:

### 1. `components/calc/inputs/Field.tsx`

Replace `valueAsNumber: true` with a `setValueAs` that maps empty/null
strings to `undefined` and otherwise to `Number(v)`:

```tsx
{...register(name, {
  setValueAs: (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? undefined : n;
  },
})}
```

This means the form state holds `undefined` for empty fields, not `NaN`.

### 2. ~~`components/auth/OnboardingForm.tsx`~~ — no change needed

**Correction noted during implementation:** OnboardingForm uses a native
HTML `<form action={...}>` with FormData and a server action, not React
Hook Form. Its `<input type="number">` fields submit as raw strings to
the server action (`completeOnboarding`). There is no `valueAsNumber`
coercion path and therefore no NaN bug. The original spec was wrong on
this point.

### 3. Schema messages (lib/calc/individual.ts, lib/calc/organization.ts)

When a `z.number()` validates against `undefined`, the default error is
"Required" — already good. **No schema changes needed** unless a specific
field benefits from a custom message. Verify during implementation.

### What we are NOT changing

- `mode: 'onBlur'` stays as-is (it's already correct — errors only fire
  after the user interacts).
- `useFieldArray` defaults (`kgco2e_per_serving: 0`, etc.) stay as-is.
  These are reasonable initial values; the fix lives at the form level.
- No new dependencies.
- No restructuring of file boundaries.

## Files touched

1. `components/calc/inputs/Field.tsx` — `NumberField` register options.
2. `lib/utils.ts` — new `emptyToNumberOrUndefined` helper (added during
   implementation to make the fix unit-testable).
3. `__tests__/utils.test.ts` — 11 unit tests for the helper (added).

That's it. One product file + one new helper + its test.

## Success criteria

Manual verification on https://greenplate-website.netlify.app/org/calculate
after deploy:

1. Open Scope 3a · Menu items. The default first row's
   **kg CO₂e / serving** field shows `0`, no error.
2. Select the `0`, delete it. Field is empty. **No error appears.**
3. Tab away from the field (blur). Error appears, reads **"Required"** —
   not "Invalid input: expected number, received NaN".
4. Click back into the field, type `0.9`. Tab away. Error disappears.
5. Repeat for IndividualWizard's `electricity_kwh` field on /calculate.

Net behaviour: no field ever surfaces the string "NaN" to the user.

(OnboardingForm's number fields are not part of this verification —
investigation during implementation showed they don't have the bug;
see the amended section 2 above.)

## Out of scope

- Loading states on submit (deferred to Workstream B).
- Toast on API failure (deferred to Workstream B).
- aria-* attributes, focus order, required indicators (deferred to
  Workstream B).
- Replacing the form library (rejected — RHF + Zod is the right stack).

## Risk

Low. The fix is mechanical, the form code is small and well-isolated,
and behaviour is verifiable with manual smoke tests. Worst case is
that a Zod schema somewhere assumed `NaN` and we surface a different
error — unlikely given the schemas all use `z.number()`.

## Verification before completion

`pnpm vitest run` must pass (50 tests). Then redeploy and re-run the
manual checks above. No success claim before evidence in hand.
