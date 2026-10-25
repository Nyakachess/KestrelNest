# 6. External evidence is listed by the owner in v0, with no Kestrel API

Status: accepted, 2026-10-24

## Context

The design shows contributions verified through Kestrel records. That service is not shipped. Stubbing or faking it would put unverifiable claims on pages that promise honesty.

## Decision

In v0 the only source of external evidence is the `projects` list in the owner's `profile.yml`. Every place it appears says "listed by owner". There is no verify link and no mock of the profile API.

## Consequences

- Pages are honest about what is checked (merged pull requests here) and what is claimed (external work).
- When Kestrel records exist, a later record will describe how verified items replace listed ones.
- The feed's `external` count is the length of that list.
