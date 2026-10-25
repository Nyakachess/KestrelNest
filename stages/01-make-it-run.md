Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}, for cohort {{cohort}}.

## Why this stage exists

Before you change anything, you get the project running on your own machine and make one tiny change that goes through the whole process: branch, commit, push, pull request, review, merge. The change is deliberately small so the process is the only new thing.

## Steps

1. Read [docs/CONTRIBUTING.md]({{repo_url}}/blob/main/docs/CONTRIBUTING.md) once, top to bottom. It explains every word used below.
2. Clone the repository and install it:

   ```bash
   git clone {{repo_url}}.git
   cd nest
   npm install
   npm test
   ```

   Every test should pass. If one does not, say so in a comment here with the output; that is a real finding.

3. Make a branch: `git switch -c stage-1-{{handle}}`.
4. Open `CONTRIBUTORS.md` and add this line at the end: `- @{{handle}}`.
5. Run `npm run lint`. If it complains, run `npm run format` and look at what it changed.
6. Commit: `git commit -am "docs: add {{handle}} to CONTRIBUTORS"`.
7. Push and open a pull request: `git push -u origin stage-1-{{handle}}`, then follow the link git prints. In the description write `Closes #` followed by this issue's number.
8. Watch the checks. Green: wait for a maintainer to review and merge. Red: open the failed job, read the first error, fix it, push again.

A separate draft pull request titled "Scaffold for @{{handle}}" already exists. A maintainer merges it; you do not need to touch it. After it merges, `contributors/{{handle}}/` is yours.

## Done when

- [ ] `npm test` passes on your machine.
- [ ] Your pull request is merged and your handle is in `CONTRIBUTORS.md` on `main`.
- [ ] You can say, in one sentence each, what a branch, a commit and a pull request are.

## If you get stuck

Comment here with the exact command you ran and the exact text it printed. Being stuck at this stage is normal; the question helps the next person too.
