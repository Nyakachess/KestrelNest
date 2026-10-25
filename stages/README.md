# Stage issue bodies

One Markdown file per stage of the ladder. `nest new-task <stage> --handle <handle>` fills in the placeholders and prints or creates the issue. `nest open-cohort` does it for a whole cohort.

Placeholders: `{{handle}}`, `{{name}}`, `{{cohort}}` (or `none`), `{{cohort_phrase}}` (", for cohort <id>" or empty), `{{repo}}`, `{{repo_url}}`, `{{site}}`, `{{stage_number}}`, `{{stage_title}}`.

Stage 5 has a body too, but it is never opened as a personal issue. Members claim an issue labelled `good-shared-issue` instead.
