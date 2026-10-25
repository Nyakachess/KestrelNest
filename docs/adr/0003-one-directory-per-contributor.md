# 3. One directory per contributor, owned by one person

Status: accepted, 2026-10-24

## Context

A page has to be safe to edit without coordination, safe to review by anyone, and safe to take down.

## Decision

Each contributor owns `contributors/<handle>/`, named after their GitHub login in lower case. Only the owner changes it; CODEOWNERS enforces this. `visibility.page` in `profile.yml` decides whether the page is built. Directories whose name starts with an underscore are templates and can never publish.

## Consequences

- Practice is clearly separated from shared code: it is the directory boundary.
- A page is unpublished with a one-line pull request.
- The handle pattern rejects a leading underscore, so `_example` stays a template whatever its profile says.
