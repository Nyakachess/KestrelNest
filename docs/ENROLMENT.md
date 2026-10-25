# Enrolment

How a person gets their directory, their invitation and their stage issues with no maintainer involved.

## What happens

`nest enroll <handle> --name "<Name>" --cohort <id|none>` performs four idempotent steps and prints one line per step (created, updated, skipped or failed):

- a. Cohort files: the handle is added to `cohorts/<id>/cohort.yml` and `/contributors/<handle>/ @<handle>` to `.github/CODEOWNERS`, through one pull request from `bot/enroll-<handle>` titled `chore(cohort): add @<handle> to <id>`. Skipped when the cohort is `none`.
- b. Scaffold: if `contributors/<handle>/` is not on `main` and no pull request exists from `scaffold/<handle>`, the directory is scaffolded with its planted defect and a draft pull request "Scaffold for @<handle>" is opened, assigned to the person, with the body from `.github/PR_TEMPLATE_SCAFFOLD.md`.
- c. Invitation: the handle is invited as a collaborator with push permission, unless already a collaborator or already invited.
- d. Stage issues: stages 1, 2, 3, 4, 6 and 7, labelled `onboarding`, `stage:<n>` and `cohort:<id>` when there is one, assigned to the person, in the cohort milestone. Any title that already exists, open or closed, is skipped.

Every GitHub call is retried three times with exponential backoff, waiting for the rate-limit reset when GitHub names one. The command exits non-zero only when a step still fails after that. `nest open-cohort <id>` runs the same thing for every member of a cohort.

## How Kestrel triggers it

Kestrel sends a `repository_dispatch` event to this repository:

```
POST https://api.github.com/repos/kestrel-collective/nest/dispatches
{ "event_type": "enroll", "client_payload": { "handle": "a-login", "name": "Display Name", "cohort": "2027-01" } }
```

`cohort` is `none` for an individual joiner. The token Kestrel uses needs Contents read and write on this repository only. The Enrol workflow (`.github/workflows/enroll.yml`) picks the event up, builds the CLI and runs `nest enroll` with `--gh`. A concurrency group per handle means two dispatches for the same person cannot run at the same time.

## Running it by hand

Actions tab, "Enrol", "Run workflow": handle, name, cohort (or `none`). Or locally with the GitHub CLI signed in:

```bash
npx nest enroll a-login --name "Display Name" --cohort 2027-01 --dry-run   # prints the plan, no GitHub calls
npx nest enroll a-login --name "Display Name" --cohort 2027-01 --gh        # does it
```

Without `--gh` or `--dry-run` the command prints the pull request bodies and the issue bodies and touches nothing.

## What the learner does themselves

1. Accept the collaborator invitation GitHub emailed them. Nothing else works before this.
2. Stage 1: clone, run the tests, add their handle to `CONTRIBUTORS.md`.
3. Stage 2: finish the scaffold pull request that is already open in their name.

A week after enrolment with no commit from them, the Onboarding workflow leaves one comment, ever, on their Stage 1 issue with those two steps.

## Re-running safely

Run the workflow or the command again for the same handle. Steps that are done are skipped; only what is missing is performed. If a run fails, an issue titled "Enrolment failed for @<handle>" labelled `maintainers` is opened with the job log, and it is closed automatically when a later run for that handle succeeds.

## The kestrel-ticket block

Every stage issue ends with a fenced `kestrel-ticket` block that Kestrel reads to create a ticket on the person's board: `stage`, `reserved_for` (the handle), `cohort`, `evidence` (practice, shared_project, review or proposal), `title`, `steps` and `done_when`. The text above the block is for people; the block is for the platform. Keep them in step.

## Two limits worth knowing

- Pull requests created with the workflow's own token do not trigger workflows, so the bot's cohort pull request does not get CI or auto-merge until a maintainer pushes to it or closes and reopens it. Setting a fine-grained token with Contents, Pull requests and Issues write as the repository secret `NEST_BOT_TOKEN` and using it in `enroll.yml` lifts that limit.
- Individual joiners (`cohort: none`) have no cohort file to change and no milestone; their profile has no `cohort` field until they join one.
