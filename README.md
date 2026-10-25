# Nest

Nest is Kestrel Collective's open-source onboarding project. It is a real, maintained codebase whose purpose is to be the first open-source project a new contributor works in. Every contributor gets a page here that they build themselves, pull request by pull request, and that keeps growing with every verified contribution they make anywhere.

The site is published at https://nest.kestrelcollective.org.

## Quick start

You need Git and Node 20 or newer (`node --version` to check). Then:

```bash
git clone https://github.com/kestrel-collective/nest.git
cd nest
npm install
npm test
```

`npm install` fetches everything and builds the `nest` command. `npm test` should end with a line saying all tests passed. If it does not, say so on your stage issue before changing anything.

## See the site in your browser

```bash
npm run dev
```

Then open http://localhost:4321/ in your browser. The page updates on its own every time you save a file. Your own page is at http://localhost:4321/p/your-handle/ once `visibility.page` in your `profile.yml` says `public`; private pages are not built, so they show the "no page here" screen until then. Press Ctrl+C in the terminal to stop.

If port 4321 is already in use, run it on another one: `npx astro dev --root site --port 4322`, then open http://localhost:4322/.

To see exactly what production will serve, build and preview it: `npm run build`, then `npm run preview`, then open http://localhost:4321/.

## Everyday commands

Every command here starts with `npm run`, except `npm install` and `npm test`. Typing `npm build` prints "Unknown command"; it is `npm run build`.

| Command            | What it does                                                                 | What you should see                         |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------- |
| `npm run dev`      | Runs the site locally with live reload.                                      | A local address to open; Ctrl+C stops it.   |
| `npm run validate` | Checks every contributor and cohort file. CI runs the same thing.            | "no problems", or file:line and what to do  |
| `npm test`         | Runs every test, including the ones in contributor directories.              | "passed"                                    |
| `npm run lint`     | Checks formatting and that no em dash slipped in.                            | "All matched files use Prettier code style" |
| `npm run format`   | Fixes formatting for you.                                                    | The files it changed, if any                |
| `npm run build`    | Builds the packages and the site into `site/dist`.                           | "3 page(s) built" or more                   |
| `npm run preview`  | Serves the built site, the way production will.                              | A local address to open                     |
| `npx nest help`    | The `nest` command: validate, scaffold, new-task, feed, enroll, open-cohort. | A list of commands                          |

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

Each stage arrives as an issue assigned to you, with the steps written out. Start with [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md); it is written for someone who has never opened a pull request.

## When something goes wrong

- `Unknown command: "build"`: you typed `npm build`. Use `npm run build`. The same goes for dev, lint, format, validate and preview.
- `Node.js v18... is not supported` or similar: install Node 20 or newer, then run `npm install` again.
- `nest: command not found` or `Cannot find module`: run `npm install` again; it builds the command.
- `Port 4321 is in use`: something else is using it. Run `npx astro dev --root site --port 4322` and open that port instead.
- `npm run validate` lists problems: each line is file, line number, field and what to change. Fix only what it names and run it again.
- A test fails: read the first failure, not the last. The file and line are in the output.
- Windows: use Git Bash or PowerShell; every command above works in both. If a path in an error has backslashes, that is normal.
- Anything else: ask on your stage issue with the exact command and the exact output. Asking never costs you anything.

## Repository map

| Path                     | What lives there                                                           |
| ------------------------ | -------------------------------------------------------------------------- |
| `contributors/<handle>/` | One directory per contributor: `profile.yml`, `page.md`, `.practice.json`. |
| `cohorts/<id>/`          | One `cohort.yml` per cohort.                                               |
| `packages/schema/`       | The schemas and loaders every other part of the repo uses.                 |
| `packages/cli/`          | The `nest` command.                                                        |
| `site/`                  | The Astro site, built from the directories above. No network at build.     |
| `stages/`                | The issue body for each stage of the ladder.                               |
| `docs/`                  | Contributing guide, decisions, privacy, roadmap, enrolment, build log.     |

## How evidence is labelled

Pages keep three kinds of work apart and never dress one up as another:

- external: work accepted by projects outside Nest, listed by the page owner
- shared: contributions merged into Nest's own shared code
- practice: pull requests to the owner's own directory

Every marker on the site carries an icon and a text label. Colour alone is never the signal.

## Documents

- [Contributing](docs/CONTRIBUTING.md): the first pull request, step by step. [Development](docs/DEVELOPMENT.md) for the setup alone.
- [Enrolment](docs/ENROLMENT.md): how a person gets their directory, invitation and stage issues.
- [Roadmap](docs/roadmap.md) and [decisions](docs/adr/).
- [Privacy](docs/PRIVACY.md), [governance](docs/GOVERNANCE.md), [code of conduct](CODE_OF_CONDUCT.md), [security](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
