Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}{{cohort_phrase}}.

This stage is not assigned to you as a personal issue. You claim it from the pool.

## Why this stage exists

Everything so far happened in your own directory, where only you are affected. Shared code is different: other pages, other people and the site itself depend on it. This is the first change you make there, with a real review.

## Steps

1. Open the pool: [issues labelled good-shared-issue]({{repo_url}}/issues?q=is%3Aopen+label%3Agood-shared-issue+no%3Aassignee). Each one has context, steps and acceptance criteria. Pick one that you understand after reading it twice.
2. Comment "I'll take this" on it. A maintainer assigns it to you. One at a time.
3. Reproduce the problem or the gap on your machine before changing anything, exactly as in Stage 3.
4. Make the change on a branch named after the issue number, with a test when the acceptance criteria ask for one. Run `npm run validate`, `npm test`, `npm run lint` and `npm run build`.
5. Open a pull request that says what the issue asked for, what you did, and how you checked each acceptance criterion. `Closes #` and the issue's number.
6. A maintainer reviews. Expect comments; answer every one, either with a change or with a reason. Push again. This can take a few rounds, and that is the normal shape of shared work.
7. When it merges, it is in the next release, credited to you in the changelog, and your page counts it as a shared-project contribution.

## Done when

- [ ] Your change to shared code is merged after a review.
- [ ] Every acceptance criterion on the issue was checked and the pull request says how.
- [ ] Your page shows one shared-project contribution after the next counts run.

## If you get stuck

Comment on the issue you claimed, not here. If the issue itself turned out to be wrong or unclear, say that: fixing the issue text is also a contribution.
