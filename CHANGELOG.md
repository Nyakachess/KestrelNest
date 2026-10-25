# Changelog

All notable changes to Nest. The format follows Keep a Changelog, the versions follow semantic versioning. Contributors are credited by handle.

## Unreleased

Nothing yet.

## 0.1.0, 2026-10-24

The ladder exists. First release, built from the design in `docs/design/` and the build log in `docs/BUILD-LOG.md`.

### Added

- `packages/schema`: schemas for `profile.yml`, `page.md`, `cohort.yml` and `.practice.json`, a handle rule that keeps template directories private, and validation messages that name the file, the line, the field and what to change.
- `packages/cli`, the `nest` command: `validate`, `scaffold` (with one planted defect per directory), `new-task`, `feed` and `open-cohort` (idempotent, dry-run, prints bodies without `--gh`).
- `site`: the Astro site with its zero-pages state, contributor pages, cohort pages, a 404 and the pages feed at `/api/pages.json`.
- `contributors/_example/`, the template every directory is made from, and `CONTRIBUTORS.md` for Stage 1.
- `stages/`: issue bodies for the seven stages of the ladder.
- GitHub configuration as code: CI, auto-merge for own-directory pull requests, nightly practice counts, label sync, templates, CODEOWNERS and `docs/REPO-SETTINGS.md`.
- Documentation: contributing guide for a first pull request, seven architecture decision records, privacy, governance, roadmap, feed contract, and a ten-issue Stage 5 backlog seed.

### Contributors

- @Nyakachess
