# 2. Counts come from committed files, never from GitHub at build time

Status: accepted, 2026-10-24

## Context

Pages show how many pull requests merged into a contributor's directory, into shared code, and how many stages are done. Asking GitHub for this during the site build would make every build depend on a token, a rate limit and the network, and would make previews from forks fail.

## Decision

A workflow on `main` computes the counts after merges and commits them to `contributors/<handle>/.practice.json`. The site build reads only files in the repository. If the file is missing, counts are zero.

## Consequences

- Builds are reproducible from a checkout alone, including on a laptop with no network.
- Counts lag merges by one workflow run.
- `.practice.json` is never edited by hand; validation rejects malformed files.
