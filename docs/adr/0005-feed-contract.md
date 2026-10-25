# 5. The pages feed is a fixed contract with the landing site

Status: accepted, 2026-10-24

## Context

The Kestrel landing site shows the most active Nest pages. It reads one JSON file and must keep working when Nest is unreachable or empty.

## Decision

The site publishes `/api/pages.json` with the shape `{ generated_at, release, pages[] }`, where each page has `handle`, `name`, `intro`, `cohort`, `stage`, `counts { external, shared, practice }` and `url`. Only publishable pages appear, sorted by handle. Field names are never renamed; new fields may be added.

## Consequences

- An empty site produces `pages: []`, which the landing site renders as its empty state.
- `release` is the root package version, so the landing site can say which release it read.
- The same builder produces the CLI's `nest feed` output and the site endpoint.
