# Security

Nest is a static site built from files in this repository. It has no accounts, no database and no server-side code in production.

## Reporting a problem

If you find a way to publish content that an owner did not mark public, to inject markup into a page, or anything else that looks like a security problem, please do not open a public issue. Use GitHub's private vulnerability reporting on this repository, or write to hello@kestrelcollective.org. You will get an answer within a week.

## What is in scope

- The site build: anything in a contributor directory reaching the HTML unescaped.
- The workflows: anything that lets a pull request from a contributor directory change shared code, secrets or other directories.
- The `nest` command when run on untrusted repository content.

## Supported versions

Only the latest release and `main`.
