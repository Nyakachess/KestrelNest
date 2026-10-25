Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}{{cohort_phrase}}.

## Why this stage exists

A fix without a test is a fix that can come back. In Stage 3 you found something the checks did not cover. Now you write the check, and you prove it works by watching it fail first.

## Steps

1. Open `contributors/{{handle}}/profile.test.ts`. The first test there loads your directory with `validateContributor(root, handle)` and asserts that there are no problems. Your new test goes after it and uses the same `result`.
2. Decide what the test asserts. It should be the one sentence from Stage 3 turned into code. For example, if the problem was a date, the test compares `result.contributor.profile.joined` with something it must be before or after. If the problem was the order of sections, the test compares `result.contributor.page.sections.map((s) => s.title)` with the order you expect. `validateCohort(root, '{{cohort}}')` gives you the cohort's dates if you need them.
3. Make it fail first. On a branch `stage-4-{{handle}}`, put the Stage 3 defect back temporarily (one line in `profile.yml` or `page.md`), then run:

   ```bash
   npx vitest run contributors/{{handle}}
   ```

   Your new test must be the one that fails. If it passes, it is not testing the defect yet.

4. Remove the defect again. Run the same command. Everything passes.
5. Commit the test alone: `git commit -am "test: guard against <the defect> on my page"`. The commit should not contain the defect, only the test.
6. Open a pull request. In the description, paste the failing output from step 3 and the passing output from step 4. `Closes #` and this issue's number. It merges on its own once the checks are green.

## Done when

- [ ] Your test fails when the defect is present and passes when it is not, and the pull request shows both.
- [ ] The test is merged and runs in CI for every future change to your directory.
- [ ] You can say what the test guards and what it does not.

## If you get stuck

Paste your test and the output here. Common snags: forgetting `await` is not needed here (everything is synchronous), or asserting the fix instead of the rule behind it.
