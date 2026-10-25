Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}, for cohort {{cohort}}.

## Why this stage exists

Your page is the thing that grows for as long as you contribute, anywhere. This stage makes it exist, in your words, and puts it live through the same checks every other change goes through.

## Steps

1. Make sure the "Scaffold for @{{handle}}" pull request has merged and pull `main`: `git switch main && git pull`. Your directory is `contributors/{{handle}}/`.
2. Make a branch: `git switch -c stage-2-{{handle}}`.
3. Open `contributors/{{handle}}/profile.yml`. Fill in `name`, `intro` (one or two sentences about where you are, not where you want to be) and up to eight `skills_developing`. `next` is optional. Leave `handle`, `cohort` and `joined` exactly as they are, even if something about them looks odd. That is Stage 3.
4. Open `contributors/{{handle}}/page.md`. Write a few sentences under "Where I started". Replace or delete the other three placeholder sections; a public page may not keep template text.
5. Run `npm run validate`. It names the file, the line and the field of anything that is not right. Fix it and run it again until it says "no problems".
6. Set `visibility.page` to `public` in `profile.yml`.
7. Run `npm test`, then commit and push: `git commit -am "feat: publish the page for {{handle}}"`, `git push -u origin stage-2-{{handle}}`, open the pull request, write `Closes #` and this issue's number.
8. The checks run and a preview of the site is built from your branch. Open the preview link and look at your page.
9. This pull request changes only your own directory, so it merges on its own once the checks are green. A few minutes later your page is live at {{site}}/p/{{handle}}/.

## Done when

- [ ] `npm run validate` reports no problems.
- [ ] Your pull request merged without anyone else pressing a button.
- [ ] {{site}}/p/{{handle}}/ shows your name, your intro and your first section.

## If you get stuck

Paste the validate output here. The message tells you what to change; if it does not, that is a bug in Nest and worth an issue of its own.
