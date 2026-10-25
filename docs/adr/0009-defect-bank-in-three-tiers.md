# 9. A bank of planted defects in three tiers

Status: accepted, 2026-10-26

## Context

ADR 0004 plants one of five defects per scaffold. With five, contributors in one cohort compare notes and the Stage 3 search turns into copying. A larger bank, spread over difficulty, keeps Stage 3 a real investigation for every cohort (docs/P2-defect-bank.md).

## Decision

Defects live in a bank. Each has a tier (1 easy, 2 medium, 3 hard) and a competency; the first five are tier 1. A model may write candidates (`nest defect-request`, then `nest defect-import`), but nothing a model writes reaches a contributor unreviewed: a candidate enters the bank only when `nest defect-check` passes (it validates, it is detected and visible, its Stage 4 test fails with it and passes without) and a maintainer runs `nest defect-promote`, which numbers it from 6 and records the model, prompt version, generation time, promoter and promotion time in its header.

A scaffold's defect comes from the handle, within the tier `cohort.yml` names in `defect_tier` (default 1), never one already used in the cohort while the tier has another.

## Consequences

- ADR 0004 still holds for every defect in the bank: it passes validation, shows on the page, has a detector and a test in the same change.
- "Used" is the gitignored `cohorts/<id>/.defects.json` plus every bank defect still detectable in a member's directory, so a scaffold pull request never carries a shared file.
- Stage 3 and 4 issues say a defect exists, never which; a test fails if a template names a defect id.
