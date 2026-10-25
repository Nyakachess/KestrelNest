# cohorts/

One directory per cohort, holding a single `cohort.yml`. A cohort is named by its year and month (`2027-01`) or, when Kestrel opens one every two weeks, by its start date (`2027-01-12`); both forms are valid and can sit side by side.

```yaml
id: 2027-01
name: January 2027 cohort
starts: 2027-01-12
ends: 2027-04-30
members:
  - a-github-login
  - another-login
```

Rules:

- `id` must match the directory name.
- `members` are GitHub logins in lower case, each listed once.
- A contributor's `profile.yml` must name a cohort that exists here, once any cohort exists.
- `defect_tier` is optional: 1 (the default), 2 or 3, the tier of planted defect this cohort's scaffolds draw from (ADR 0009). Scaffolding records each planted defect in `.defects.json` next to `cohort.yml`, a local file git ignores, so no two members get the same one while the tier has another.

Opening a cohort is one command once the file is merged:

```bash
npx nest open-cohort 2027-01 --dry-run   # shows what would happen
npx nest open-cohort 2027-01 --gh        # scaffolds every member and opens their stage issues
```

The command is safe to run again. Anything that already exists is skipped.
