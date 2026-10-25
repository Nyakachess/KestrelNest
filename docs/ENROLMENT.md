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

Their stage issues are created while the invitation is still pending, and GitHub drops an assignee who has no access yet. Every half hour (or at once on a `repository_dispatch` of type `upkeep`) the Onboarding workflow's `stage-upkeep` job assigns each open, unassigned stage issue to its owner once they are a collaborator.

## The invitation token

The workflow's own token is not allowed to read or send repository invitations ("Resource not accessible by integration"). Add a repository secret `NEST_ADMIN_TOKEN`: a fine-grained token from a repository admin, limited to this repository, with **Administration: read and write**. `enroll.yml` uses it for the invitation and nothing else, so issues and pull requests are still opened by the bot. Without it, step c fails with a message that names the secret.

## Re-running safely

Run the workflow or the command again for the same handle. Steps that are done are skipped; only what is missing is performed. If a run fails, an issue titled "Enrolment failed for @<handle>" labelled `maintainers` is opened with the job log, and it is closed automatically when a later run for that handle succeeds.

## Withdrawing someone

Use it when a person leaves before finishing, or to start someone again from Stage 1 (a new Kestrel account for the same GitHub login, for example). Re-enrolment alone cannot do that, because it skips every stage issue whose title already exists, open or closed.

`nest withdraw <handle> --gh` (or Actions tab, "Withdraw", with the handle; Kestrel can send a `repository_dispatch` of type `withdraw` with `client_payload: { "handle": "a-login" }`) does, idempotently:

- closes the person's open stage issues as not planned, with one comment saying a new enrolment opens fresh ones;
- renames every stage issue of theirs, open or closed, by appending ` [withdrawn YYYY-MM-DD]`, so the title no longer ends `(@handle)`: enrolment and the Onboarding upkeep no longer see it, and Kestrel withdraws a ticket whose issue is closed as not planned;
- closes an open pull request from `scaffold/<handle>` or `bot/enroll-<handle>`;
- cancels a pending invitation, when the `NEST_ADMIN_TOKEN` secret is there (otherwise it says it left the invitation as it is).

It leaves in place, on purpose: collaborator access, the person's `contributors/<handle>/` directory and their `CONTRIBUTORS.md` line. A second run finds nothing to do. Enrol the person again afterwards to open six fresh stage issues.

## The kestrel-ticket block

Every stage issue ends with a fenced `kestrel-ticket` block that Kestrel reads to create a ticket on the person's board. Kestrel validates it strictly (its decision D-38), so the block has exactly these keys: `competency` (a rubric slug: debugging, automated-testing or technical-communication), `level` (guided, supported or independent), `difficulty` (starter, standard or stretch), `kp` (0 to 3), `evidence_kind` (practice, shared_project or proposal), `reserved_for` (the handle, or null for a shared issue), `stage`, `steps` (1 to 8, each with `title` and `guide`), `acceptance_criteria` (1 to 8 sentences) and `resources` (0 to 5 https URLs). The text above the block is for people; the block is for the platform. Keep them in step.

When a template's block changes, nothing needs to be run by hand: every half hour the Onboarding workflow's `stage-upkeep` job puts the current block into every open stage issue created from an older one, and leaves current ones untouched. Kestrel can also start that job at once with a `repository_dispatch` of type `upkeep`:

```
POST https://api.github.com/repos/kestrel-collective/nest/dispatches
{ "event_type": "upkeep" }
```

## Two limits worth knowing

- Pull requests created with the workflow's own token do not trigger workflows, so the bot's cohort pull request does not get CI or auto-merge until a maintainer pushes to it or closes and reopens it. Setting a fine-grained token with Contents, Pull requests and Issues write as the repository secret `NEST_BOT_TOKEN` and using it in `enroll.yml` lifts that limit.
- Individual joiners (`cohort: none`) have no cohort file to change and no milestone; their profile has no `cohort` field until they join one.
