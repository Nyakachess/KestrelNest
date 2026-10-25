# Privacy

Nest publishes what you choose to publish and nothing else.

## What is published

- Your page, only while `visibility.page` in your `profile.yml` says `public`. It shows the name, intro, skills, sections and external projects you wrote, and counts of merged pull requests.
- Your GitHub login, as the page address and in the pages feed at `/api/pages.json`, only while your page is public.
- A cohort page lists the published pages of its members and the number of members who have not published. It never names them.

## What is not published

- Anything in a private directory. Private directories are still in the repository, which is public on GitHub, so write only what you are happy to have in a public git history.
- Your email address, location or anything not in your directory.

## Counts

Counts come from merged pull requests in this repository, computed by a workflow and committed to `.practice.json` in your directory. External contributions are listed by you, not verified by anyone, and the page says so.

## Taking a page down

Set `visibility.page` to `private` in one pull request. The page and the feed entry disappear at the next deploy. To remove your directory entirely, open a pull request that deletes it; git history keeps the past versions, as it does for every public repository.

## Tracking

The site sets no cookies and loads no analytics. Fonts load from Fontshare, which sees the request like any web font provider.

Questions: hello@kestrelcollective.org.
