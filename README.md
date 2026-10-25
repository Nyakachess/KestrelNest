# Nest

Nest is Kestrel Collective's open-source onboarding project. It is a real, maintained codebase whose purpose is to be the first open-source project a new contributor works in. Every contributor gets a page here that they build themselves, pull request by pull request, and that keeps growing with every verified contribution they make anywhere.

The site is published at https://nest.kestrelcollective.org.

## The ladder

Seven stages. An invitation, not a gate. Experienced already? Skip to Stage 5 or straight to the Kestrel board.

| Stage | Name                | What you do                                                   |
| ----- | ------------------- | ------------------------------------------------------------- |
| 1     | Make it run         | Clone, install, run the tests, open your first pull request.  |
| 2     | Your page exists    | Fill in your profile. Your page goes live from a preview.     |
| 3     | Fix your defect     | Your scaffold ships with a defect. Reproduce it, then fix it. |
| 4     | Write the test      | A test that fails before your fix and passes after it.        |
| 5     | Ship to shared code | Claim a real issue in Nest's shared code. Real review.        |
| 6     | Review a peer       | Review another contributor's pull request.                    |
| 7     | Propose something   | Write a short proposal. Then: any repo you like.              |

## Quick start

```bash
git clone https://github.com/kestrel-collective/nest.git
cd nest
npm install
npm test
```

Node 20 or newer. The install step also builds the `nest` command, so `npx nest --version` works straight after it.

## Repository map

| Path                     | What lives there                                                           |
| ------------------------ | -------------------------------------------------------------------------- |
| `contributors/<handle>/` | One directory per contributor: `profile.yml`, `page.md`, `.practice.json`. |
| `cohorts/<id>/`          | One `cohort.yml` per cohort.                                               |
| `packages/schema/`       | The schemas and loaders every other part of the repo uses.                 |
| `packages/cli/`          | The `nest` command: validate, scaffold, new-task, feed, open-cohort.       |
| `site/`                  | The Astro site, built from the directories above. No network at build.     |
| `stages/`                | The issue body for each stage of the ladder.                               |
| `docs/`                  | Contributing guide, decisions, privacy, roadmap, build log.                |

## How evidence is labelled

Pages keep three kinds of work apart and never dress one up as another:

- external: work accepted by projects outside Nest, listed by the page owner
- shared: contributions merged into Nest's own shared code
- practice: pull requests to the owner's own directory

Every marker on the site carries an icon and a text label. Colour alone is never the signal.

## Contributing

Start with [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). It is written for someone who has never opened a pull request.

## License

MIT. See [LICENSE](LICENSE).
