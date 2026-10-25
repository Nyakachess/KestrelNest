# 7. Validation errors name the file, the line, the field and one plain sentence

Status: accepted, 2026-10-24

## Context

The first thing many contributors see from CI is a validation failure. A stack trace or a schema path teaches them to give up.

## Decision

`nest validate` reports every problem as `file:line field: sentence`, sorted by file and line. Schema failures are translated into sentences; unknown keys are named so a spelling mistake is obvious; YAML line numbers come from the parsed document.

## Consequences

- The message format is tested, so a change that degrades it fails CI.
- Each new rule has to say what to change, not only what is wrong.
- The same messages appear locally and in CI, because both run the same command.
