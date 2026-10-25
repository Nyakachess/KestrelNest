# Development

How to get Nest running on your own machine and see it in a browser. For the first-pull-request walk-through see [CONTRIBUTING.md](CONTRIBUTING.md).

## Prerequisites

- Git. On Windows install Git for Windows; on macOS run `xcode-select --install`; on Linux use your package manager.
- Node 20 or newer. Check with `node --version`. The `.nvmrc` file says `20` for version managers such as nvm.
- If you are a cohort member: the collaborator invitation GitHub emailed you, accepted. It also shows at the repository's invitations page.

## Setup

```bash
git clone https://github.com/Nyakachess/KestrelNest.git
cd KestrelNest
npm install
npm test
```

What you should see: `npm install` ends quietly after a minute or two; it also builds the `nest` command, so `npx nest --version` works straight after it. `npm test` ends with a line saying every test passed.

## See it in a browser

```bash
npm run dev
```

Open http://localhost:4321/. The site rebuilds in the background every time you save a file; reload if a change does not appear. Press Ctrl+C in the terminal to stop.

- Your own page: http://localhost:4321/p/your-handle/. It exists only while `visibility.page` in your `profile.yml` is `public`; private pages are not built.
- Cohorts: http://localhost:4321/cohorts/.
- The feed the landing site reads: http://localhost:4321/api/pages.json.
- Another port, if 4321 is taken: `npx astro dev --root site --port 4322`.
- Exactly what production serves: `npm run build`, then `npm run preview`, then http://localhost:4321/.

## Everyday commands

Every command starts with `npm run`, except `npm install` and `npm test`. `npm build` on its own prints "Unknown command".

| Command            | What it does                                                      | What you should see                         |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------- |
| `npm run dev`      | Runs the site locally with live reload.                           | A local address to open                     |
| `npm run validate` | Checks every contributor and cohort file; CI runs the same thing. | "no problems", or file:line and what to do  |
| `npm test`         | Runs every test, including the ones in contributor directories.   | "passed"                                    |
| `npm run lint`     | Formatting check and the em dash check.                           | "All matched files use Prettier code style" |
| `npm run format`   | Fixes formatting.                                                 | The files it changed, if any                |
| `npm run build`    | Builds the packages and the site into `site/dist`.                | "3 page(s) built" or more                   |
| `npm run preview`  | Serves the built site.                                            | A local address to open                     |
| `npx nest help`    | The `nest` command and its options.                               | A list of commands                          |

## Layout

- `packages/schema`: the rules every file follows, and the validation messages.
- `packages/cli`: the `nest` command.
- `site`: the Astro site. Pages are in `site/src/pages`, styles in `site/src/styles`.
- `contributors/`, `cohorts/`, `stages/`: the data the site and the issues are built from.

## If something fails

- Read the first error, not the last. `nest validate` names the file, the line and the field. Test failures show the file and line.
- `Unknown command`: you left out `run`. It is `npm run build`, `npm run dev`, and so on.
- `is not supported by Astro` or `Unsupported engine`: your Node is too old. Install Node 20 or newer and run `npm install` again.
- `Cannot find module` or `nest: command not found`: run `npm install` again.
- The site shows "There is no page here" for your page: it is still private, or the handle in the address differs from your directory name.
- Stuck for more than thirty minutes: say so on your stage issue, with the exact command and output. Asking never costs you anything.
