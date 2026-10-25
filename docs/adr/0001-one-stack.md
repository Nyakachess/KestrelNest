# 1. One stack: Astro, TypeScript, npm workspaces

Status: accepted, 2026-10-24

## Context

Nest is the first codebase many contributors work in. Every extra language or framework is another thing to install, learn and explain before the first pull request.

## Decision

Astro for the site, TypeScript everywhere else, npm workspaces to hold the schema, the CLI and the site in one repository. Node 20 is the floor. No Python, no second framework, no build tool beyond what Astro and `tsc` provide.

## Consequences

- `npm install` and `npm test` are the whole setup.
- The CLI, the site and the tests share one schema package, so a rule changes in one place.
- Astro 5 is pinned because Astro 6 and later need Node 22.
