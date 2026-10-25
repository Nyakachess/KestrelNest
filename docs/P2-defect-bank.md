# P2: the Nest defect bank

Copied from the Kestrel repository's `docs/kestrel-ai-patterns-plan.md`, section P2, on 2026-10-26, so this repository holds the plan it implements. Section 0 of that plan (model output is a suggestion a person reviews; provenance on every asset) applies; in Kestrel it is decision D-39.

## The plan text

**Why.** Every Nest scaffold plants one of five defects, chosen from the handle
(ADR 0004, `packages/cli/src/defects.ts`). With five, contributors in one cohort compare
notes and the Stage 3 search turns into copying. A bank of about twenty, spread over
difficulty, keeps Stage 3 a real investigation for every cohort, indefinitely.

**The model writes candidates, not merges.** For each candidate defect the model
produces the same shape as the existing five: `id`, `symptom` (what the owner sees on the
live page), `apply` (a change to the scaffold plan), `detect` (one sentence naming the
problem, or null), a Vitest test that fails with the defect and passes without it, plus
a difficulty tier and the competency it exercises. The prompt carries ADR 0004's rules:
the defect passes `nest validate`, is visible on the live page, and sits only in fields
the scaffold pre-fills so Stage 2 edits do not erase it.

**Model.** Opus 5.5, with the schema package, `templates.ts`, `defects.ts` and ADR 0004
as context. About 40 candidates in two rounds; roughly 5 to 8 USD.

**Review and merge.** A maintainer runs each candidate through the existing gate: the
detector and the test in the same change (ADR 0004's consequence), CI green, the defect
visible on a built page. Expected keep rate about half. Kept defects get numbers 6 and
up. A new ADR (0008, "a bank of planted defects in three tiers") records the tiers and
how a defect is chosen: from the handle as today, within the tier the cohort's stage
plan asks for, never the same defect twice in one cohort when the bank allows it.

**Done when.**

- About 20 defects in the bank, each with a detector and a test, all passing
  `nest validate` and visible on the page.
- `nest enroll` spreads a cohort of 15 across at least 10 different defects (a test).
- The Stage 3 and 4 issue templates are unchanged: they say a defect exists, not which.
