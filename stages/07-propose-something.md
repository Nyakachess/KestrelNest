Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}{{cohort_phrase}}.

## Why this stage exists

Until now every task was handed to you. The last rung is noticing something that should change and making the case for it. After this, the ladder ends and any repository you like begins.

## Steps

1. Look back over Stages 1 to 6 and pick one thing that was harder, slower or more confusing than it needed to be. It can be a tool, a document, a check, a message, a step in an issue. Small is good.
2. Open a new issue with the Proposal template: [new proposal]({{repo_url}}/issues/new?template=proposal.yml). Three parts: the problem (who it affects and how), the proposal (what you would change), and what it costs (what gets harder or has to be maintained).
3. Link to evidence: the pull request where it bit you, the message you did not understand, the minutes it took. A proposal with evidence gets a faster answer.
4. Maintainers and cohort members comment. Answer them. Be ready to shrink the proposal; most good ones get smaller before they are accepted.
5. One of three things happens: it is accepted and becomes an architecture decision record under `docs/adr/` or a good-shared-issue you can take yourself; it is declined with reasons; or it needs more evidence. All three count.
6. If it is accepted and you implement it, that is another shared-project contribution.

## Done when

- [ ] Your proposal issue has all three parts and at least one link to evidence.
- [ ] It has a decision: accepted, declined, or waiting on something named.
- [ ] You have picked the next repository you want to contribute to. Say which one in a comment here.

## What happens next

Nothing here is required for anything else. Your page keeps growing from merged work anywhere you do it, listed in your `profile.yml`. Come back whenever you like: Stage 5 issues are always open, and the people who follow you will need reviewers.

<!-- Machine-readable summary read by the Kestrel platform. Keep it in step with the text above. -->

```kestrel-ticket
stage: 7
reserved_for: {{handle}}
cohort: {{cohort}}
evidence: proposal
title: {{stage_title}}
steps:
  - Pick one thing that was harder than it needed to be
  - Open a proposal issue with the problem, the proposal and the cost
  - Answer the comments and shrink it if needed
done_when:
  - Your proposal has all three parts and evidence
  - It has a decision
```
