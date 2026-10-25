Hello {{name}}. Welcome to Stage {{stage_number}}, {{stage_title}}{{cohort_phrase}}.

## In one line

Notice one thing that should change, look into it, and make the case for it. Then any repository you like.

## Why this matters

Until now every task was handed to you. The last rung is seeing a problem nobody assigned, scoping it, and asking for a decision. That is what contributors do in every project after this one. Maintainer acceptance is not required for this to count; a clear proposal that is declined with reasons is a real outcome.

## Steps

1. Pick. Look back over Stages 1 to 6 and choose one thing that was harder, slower or more confusing than it needed to be: a tool, a document, a check, a message, a step in an issue. Small is good.
2. Investigate before writing (10 minutes). Where does it live? What would have to be true for it to be a real problem and not a one-off? Note the evidence: the pull request where it bit you, the message you did not understand, the minutes it took.
3. Open a proposal: [new proposal]({{repo_url}}/issues/new?template=proposal.yml). Three parts: the problem (who it affects and how), the proposal (what you would change), and what it costs (what gets harder or has to be maintained). Link your evidence.
4. Answer the comments. Be ready to shrink the proposal; most good ones get smaller before they are accepted.
5. Get a decision. One of three things happens: accepted, and it becomes a decision record under `docs/adr/` or a good-shared-issue you can take yourself; declined, with reasons; or waiting on something named. All three count.
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
  - Pick one thing that was harder than it needed to be and look into it
  - Open a proposal with the problem, the proposal and the cost, with evidence
  - Answer the comments and shrink it if needed
done_when:
  - Your proposal has all three parts and evidence
  - It has a decision
```
