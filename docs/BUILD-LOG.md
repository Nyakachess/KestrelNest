# Build log

One line per step: what was done, what was skipped, and any decision the guide did not cover.

## Standing rules

- One stack: Astro + TypeScript, Node 20, npm workspaces. No Python, no second framework.
- No em dashes anywhere, including code comments, docs and issue templates. Use a comma, full stop or colon instead.
- No fictional contributors committed to the repo. The only contributor directory is `contributors/_example/` with `visibility.page: private`. The site must build and look right with zero public pages.
- No GitHub API calls during the site build. Counts come from committed `.practice.json` files written by a workflow.
- Every evidence marker shows an icon plus a text label. Never colour alone.
- Do not stub or fake the Kestrel profile API. It is not shipped. External evidence in v0 comes only from `profile.yml` projects.
- Keep commits small and conventional (feat:, fix:, chore:, docs:, test:). Commit at the end of every step with the step number in the message. Do not push unless told to.
- When a check fails, fix it before moving on. If a check cannot be run in this environment, say so, do the closest verification possible, and record what was skipped here.
- Keep this log updated: one line per step. When a decision is needed that the guide does not cover, choose the simpler option and log it. Only ask when the choice is irreversible.
- Addition to Step 2: a fifth CLI command, `nest open-cohort <id> [--gh] [--dry-run]`. It reads `cohorts/<id>/cohort.yml` and, for each member handle: runs the scaffold if `contributors/<handle>/` does not exist and opens a draft PR titled "Scaffold for @<handle>"; then creates the personal issues for stages 1, 2, 3, 4, 6 and 7 using `nest new-task`, with labels `onboarding`, `cohort:<id>`, `stage:<n>`, assignee `<handle>`, milestone `<id>`. Stage 5 is never a personal issue; it is claimed from the `good-shared-issue` pool. Idempotent: skips any issue whose title already exists for that handle, creates the milestone and labels if missing. `--dry-run` prints what it would do. Without `--gh` it only prints the issue bodies. Tests cover the idempotency logic with a fake gh client.

## Inputs that were not available

- `docs/BUILD-STEPS.md` (the build guide, `kestrel-nest-repo-steps.md`) was not on this machine, in Google Drive or in the Claude artifacts list when the build started on 2026-10-24. The step names, order and checks below are reconstructed from the prompts document and the per-step prompts in it. When the guide turns up, drop it in as `docs/BUILD-STEPS.md` and diff the decisions below against it.
- `nest-v0-pages/screens/*.png` were not supplied. The three HTML pages in `docs/design/` are the reference.
- The GitHub remote of this clone is `Nyakachess/KestrelNest`, not `kestrel-collective/nest`. The repo slug is read from the root `package.json` `repository` field everywhere, so changing it is one edit.

## Steps
- Step 0, repo skeleton: npm workspaces (`packages/schema`, `packages/cli`), TypeScript project references built by `tsc -b` on install, vitest, prettier, `scripts/check-dashes.mjs`, MIT license, README, `.gitattributes` forcing LF. Checks: `npm install`, `npm run build`, `npm test` (no tests yet), `npm run lint` pass; `npx nest --version` prints 0.1.0. Decisions: Astro 5.18 because Astro 6 and later need Node 22 and the rule is Node 20; vitest 3.2 because npm 10.2 on this machine crashes resolving vitest 4's optional peers; TypeScript 5.9 rather than the 7.x native compiler. The repo slug and site URL live in the root `package.json` `repository` and `homepage` fields and nowhere else. Skipped: nothing.
