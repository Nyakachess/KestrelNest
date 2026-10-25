Hello {{name}}. This is Stage {{stage_number}} of the ladder, {{stage_title}}, for cohort {{cohort}}.

## Why this stage exists

Most real work is changing something that already exists without breaking it. That starts with a defect you did not write. Your scaffold was built with exactly one defect planted in it on purpose. It passes every automated check, which is the point: this one needs a person to look.

## Steps

1. Open your live page at {{site}}/p/{{handle}}/ and read every line as a stranger would. Something on it is wrong. It is not in the text you wrote in Stage 2; it is in something the scaffold filled in for you.
2. Reproduce. Write down, in this issue, what the page shows and what it should show instead. One sentence each. Do not change anything yet.
3. Hypothesise. Which file and which line could produce what you see? `profile.yml` and `page.md` are the only inputs to your page. Write your guess down before you check it. This is the habit the stage is really about.
4. Check the guess. Run `npm run validate` and `npm test`: both pass, so the problem is not something they cover. Compare the field or line you suspect with your cohort's dates in `cohorts/{{cohort}}/cohort.yml`, with the order of sections on other pages, with your own name and handle. When the guess is wrong, write down why and make the next one.
5. Fix it on a branch, `stage-3-{{handle}}`, with the smallest change that makes the page right. One line is a normal size for this.
6. Commit with a message that names the defect, for example `fix: joined date was in the wrong year`, and open a pull request. In the description, copy your three notes: what you saw, what you expected, what you found. `Closes #` and this issue's number.
7. It merges on its own once the checks are green. Look at your live page again.

## Done when

- [ ] This issue has your "what I saw, what I expected, what I found" notes.
- [ ] The fix merged and the page shows the right thing.
- [ ] You can explain, in one sentence, why the automated checks did not catch it. Keep that sentence: Stage 4 starts from it.

## If you get stuck

After thirty minutes of real looking, comment here with your notes so far. A maintainer will give you a narrower place to look, not the answer.
