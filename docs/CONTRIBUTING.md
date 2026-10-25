# Contributing to Nest

This guide assumes you have never opened a pull request. If you have, skim the headings and go straight to [Your directory](#your-directory).

## What you need

- A GitHub account. Your login, in lower case, is your handle here.
- Git. On Windows install Git for Windows; on macOS run `xcode-select --install`; on Linux use your package manager.
- Node 20 or newer. Check with `node --version`.
- A terminal and a text editor. Any editor is fine.

## Words you will see

- Repository: the project, with its whole history. Often shortened to repo.
- Clone: your own copy of the repository on your computer.
- Branch: a named line of work. You make changes on a branch, never on `main`.
- Commit: a saved step on your branch, with a one-line message saying what it does.
- Push: sending your commits from your computer to GitHub.
- Pull request (PR): asking for your branch to be merged into `main`. This is where review happens.
- CI: the checks that run on every pull request. Green means they passed.
- Merge: your change becomes part of `main`. Nothing is live until it merges.

## 1. Get the code

If you are a cohort member you have write access and can push branches directly. Otherwise fork the repository first (the Fork button on GitHub) and clone your fork instead.

```bash
git clone https://github.com/Nyakachess/KestrelNest.git
cd nest
npm install
npm test
```

`npm install` fetches the dependencies and builds the `nest` command. `npm test` should end with every test passing. If it does not, that is worth a question before you change anything.

## 2. Make a branch

```bash
git switch main
git pull
git switch -c stage-1-your-handle
```

Name the branch after what you are doing. One branch per pull request.

## 3. Make your change

For Stage 1 the change is one line: add `- @your-handle` to the end of `CONTRIBUTORS.md`. Later stages change files in your own directory under `contributors/your-handle/`.

Rules that apply to every change:

- Edit only your own directory, plus `CONTRIBUTORS.md` in Stage 1. Stage 5 is the first time you touch shared code, through an issue labelled `good-shared-issue`.
- No em dashes anywhere. Use a comma, a full stop or a colon.
- Never invent people or evidence. Your page lists what you did.

## 4. Check it before you push

```bash
npm run validate   # checks every profile.yml, page.md and cohort.yml
npm test           # runs every test, including the ones in your directory
npm run format     # fixes formatting
npm run lint       # confirms formatting and that no em dash slipped in
```

`nest validate` tells you the file, the line, the field and what to change, in that order. Fix what it names and run it again. CI runs exactly these commands, so if they pass here they pass there.

## 5. Commit

```bash
git add CONTRIBUTORS.md
git commit -m "docs: add your-handle to CONTRIBUTORS"
```

The message is one line, present tense, starting with a type: `feat:`, `fix:`, `docs:`, `test:` or `chore:`. Say what the change does, not what you did. Many small commits are better than one big one.

## 6. Push and open the pull request

```bash
git push -u origin stage-1-your-handle
```

Git prints a link. Open it, or go to the repository on GitHub and press "Compare and pull request". Fill in the template: what you changed, how you checked it, which stage issue it closes (write `Closes #123`). Then press "Create pull request".

A draft pull request is fine if you want early feedback. Mark it ready when you are.

## 7. What happens next

1. CI runs `nest validate`, the tests, the build and the formatting check. If something is red, open the failed job, read the first error, fix it on your branch, commit and push again. The pull request updates itself.
2. A preview of the site is built from your branch, so you can see your page before it is live.
3. Someone reviews. Comments are about the change, not about you. Reply to each one, make the change or say why not, and push again.
4. Merge. Changes that touch only your own directory merge automatically once CI is green. Anything else is merged by a maintainer after review.
5. The site redeploys from `main`. Your page is live within a few minutes, if it is public.

## Your directory

`contributors/your-handle/` is created for you by your cohort lead. It holds:

- `profile.yml`: `handle`, `cohort` and `joined` are set for you and stay as they are. Fill in `name`, `intro` (one or two sentences), `skills_developing` (up to eight), and `next` if you like. Set `visibility.page` to `public` when you want your page live; set it back to `private` any time. List work accepted by other projects under `projects`, newest first, with the merged pull request's address. Never list work that is not yours or not merged.
- `page.md`: four sections under fixed headings: Where I started, What I learned, What I built, What I am working on next. Plain text, a few sentences each. Links to `https://` addresses, bold, italics and inline code work; nothing else does.
- `profile.test.ts`: the tests that guard your page. The first one checks that your directory validates. Stage 4 adds the one that would have caught your Stage 3 defect.
- `.practice.json`: counts written by a workflow after your pull requests merge. Do not edit it.

Your scaffold has one defect planted on purpose. Finding it is Stage 3. Do not go looking for it before then; it is more useful as a surprise.

## Getting help

- Stuck on git or the terminal: say so in your stage issue. That is what it is for, and the question helps the next person.
- Found a bug in Nest itself: open an issue with what you did, what you expected and what happened. That is real open-source work, and if you fix it, it counts as shared code.
- Something uncomfortable happened: see [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).

## How you got here

Your directory, your collaborator invitation and your stage issues were created by [enrolment](ENROLMENT.md), either when Kestrel enrolled you or when a maintainer ran it for you. If any of them is missing, say so on any of your issues; the command is safe to run again.
