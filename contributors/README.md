# contributors/

One directory per contributor, named after their GitHub login in lower case. Each directory is owned by one person: only its owner edits it, everyone else reviews.

What a directory holds:

- `profile.yml`: who you are. Validated on every pull request by `nest validate`.
- `page.md`: your page. Four short sections under fixed headings.
- `profile.test.ts`: tests that guard your page. The scaffold ships one; Stage 4 adds another.
- `.practice.json`: counts written by a workflow after merges. Never edit it by hand.
- `README.md`: optional.

Nothing else belongs here. Pictures, drafts and notes live elsewhere.

`_example/` is the template every new directory is made from. It is private, it is never published, and it is regenerated with `npx nest scaffold _example --template --cohort 2027-01` when the template changes. Do not edit it by hand.

Your page is published only when `visibility.page` in your `profile.yml` says `public`. You can set it back to `private` with one pull request at any time.
