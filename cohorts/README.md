# cohorts/

One directory per cohort, named by year and month, holding a single `cohort.yml`:

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

Opening a cohort is one command once the file is merged:

```bash
npx nest open-cohort 2027-01 --dry-run   # shows what would happen
npx nest open-cohort 2027-01 --gh        # scaffolds every member and opens their stage issues
```

The command is safe to run again. Anything that already exists is skipped.
