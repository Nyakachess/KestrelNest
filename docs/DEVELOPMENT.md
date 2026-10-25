# Development

How to get Nest running on your own machine. For the full first-pull-request walk-through see [CONTRIBUTING.md](CONTRIBUTING.md).

## Prerequisites

- Git.
- Node 20 or newer (`node --version`). The `.nvmrc` file says `20` for version managers.
- A GitHub account that has accepted its collaborator invitation, if you are a cohort member. The invitation arrives by email and also shows at the repository's invitations page.

## Setup

```bash
git clone https://github.com/Nyakachess/KestrelNest.git
cd nest
npm install
npm test
```

`npm install` also builds the `nest` command, so `npx nest --version` works straight after it.

## Everyday commands

| Command            | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `npm run validate` | Checks every contributor and cohort file; CI runs the same thing. |
| `npm test`         | Runs every test, including the ones in contributor directories.   |
| `npm run lint`     | Formatting check and the em dash check.                           |
| `npm run format`   | Fixes formatting.                                                 |
| `npm run build`    | Builds the packages and the site into `site/dist`.                |
| `npm run dev`      | Runs the site locally with live reload.                           |

## Layout

- `packages/schema`: the rules every file follows.
- `packages/cli`: the `nest` command.
- `site`: the Astro site.
- `contributors/`, `cohorts/`, `stages/`: the data the site and the issues are built from.

## If something fails

Read the first error, not the last. `nest validate` names the file, the line and the field. Test failures show the file and line. If you are stuck for more than thirty minutes, say so on your stage issue.
