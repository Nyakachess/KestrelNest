# 4. Every scaffold carries one planted defect that validation does not catch

Status: accepted, 2026-10-24

## Context

Stage 3 asks a contributor to reproduce, hypothesise and fix a defect. Stage 4 asks for the test that would have caught it. A defect that CI rejects is fixed before the contributor ever sees it, which teaches nothing.

## Decision

The scaffold plants one of five defects, chosen from the handle so re-runs are stable. All five pass `nest validate`, so the scaffold pull request is green. All five are visible on the live page. Detectors for each live in the CLI package so maintainers can check a fix.

## Consequences

- Defects sit only in fields the scaffold pre-fills, so Stage 2 edits do not erase them.
- The stage issue tells the contributor a defect exists but not which one.
- Adding a sixth defect means adding its detector and a test in the same change.
