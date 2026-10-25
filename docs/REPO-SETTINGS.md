# Repository settings

Everything that cannot be a file in the repository. Follow it top to bottom in the GitHub UI; it takes under ten minutes. Tick each box as you go.

## Organisation (once)

- [ ] Create the `kestrel-collective` organisation if it does not exist.
- [ ] Teams: create `maintainers` (closed) and add every maintainer. CODEOWNERS refers to it.

## Repository: General

- [ ] Features: Issues on. Wiki off. Projects off. Discussions off for now.
- [ ] Pull requests: allow squash merging only. Default commit message: pull request title. Untick merge commits and rebase merging.
- [ ] Tick "Allow auto-merge". The own-directory workflow depends on it.
- [ ] Tick "Automatically delete head branches".

## Repository: Rules, branch `main`

- [ ] Add a ruleset (or classic protection) for `main`: require a pull request before merging, 1 approval, dismiss stale approvals.
- [ ] Require status checks to pass: `checks` (the CI workflow job). Require branches to be up to date.
- [ ] Require review from code owners.
- [ ] Block force pushes and deletions.
- [ ] Bypass list: add the `github-actions[bot]` actor (or "Repository admin" if the actor option is missing) so the practice-counts workflow can push its commit to `main`. Nothing else bypasses.

## Repository: Actions

- [ ] Actions permissions: allow all actions and reusable workflows (the workflows use `actions/*` only).
- [ ] Workflow permissions: "Read repository contents and packages permissions". Each workflow raises its own permissions in its file.
- [ ] Tick "Allow GitHub Actions to create and approve pull requests".

## Repository: Code security

- [ ] Enable private vulnerability reporting (SECURITY.md points people there).
- [ ] Dependabot alerts on. Dependabot version updates come from `.github/dependabot.yml`.

## Labels

- [ ] Run the "Sync labels" workflow once from the Actions tab (workflow_dispatch). It creates onboarding, good-shared-issue, proposal, bug and stage:1 to stage:7. Cohort labels are created by `nest open-cohort`.

## Cloudflare Pages (the site)

- [ ] Workers and Pages: create a Pages project connected to this repository, production branch `main`.
- [ ] Build command: `npm ci && npm run build`. Build output directory: `site/dist`. Root directory: `/` (the repository root, not `site/`).
- [ ] Environment variable `NODE_VERSION` = `20`.
- [ ] Preview deployments: all branches (pull requests get a preview link).
- [ ] Custom domain: `nest.kestrelcollective.org`.

## DNS

- [ ] At the DNS provider for `kestrelcollective.org`: CNAME `nest` to the Pages project hostname (`<project>.pages.dev`), proxied if the zone is on Cloudflare.
- [ ] Wait for `curl -f https://nest.kestrelcollective.org/api/pages.json` to answer.
- [ ] Only then set `NEXT_PUBLIC_NEST_URL` in the landing site and redeploy it.

## Secrets

None. Every workflow uses the built-in `GITHUB_TOKEN`. Cloudflare Pages deploys through its git integration.

## Enrolment

- [ ] Settings, Actions, General, "Workflow permissions": tick "Allow GitHub Actions to create and approve pull requests". Without it the Enrol workflow cannot open the scaffold and cohort pull requests.
- [ ] Give Kestrel a fine-grained token with repository access to `nest` only and Contents read and write, stored on the Kestrel side as `NEST_DISPATCH_TOKEN` with `NEST_REPO=kestrel-collective/nest`.
- [ ] Optional: a second fine-grained token with Contents, Pull requests and Issues read and write as the repository secret `NEST_BOT_TOKEN`, so bot pull requests get CI and auto-merge (see docs/ENROLMENT.md).
- [ ] Run the Enrol workflow once by hand with a test handle you control, check the scaffold pull request, the invitation and the six issues, then delete them.
