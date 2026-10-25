export type Stage = {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7
  slug: string
  title: string
  short: string
}

/** The onboarding ladder. Stage 5 is the only stage worked in shared code. */
export const STAGES: readonly Stage[] = [
  { number: 1, slug: 'make-it-run', title: 'Make it run', short: 'Clone, test, first PR' },
  { number: 2, slug: 'your-page-exists', title: 'Your page exists', short: 'Profile, preview, live' },
  { number: 3, slug: 'fix-your-defect', title: 'Fix your defect', short: 'Reproduce, hypothesise, fix' },
  { number: 4, slug: 'write-the-test', title: 'Write the test', short: 'Fails before, passes after' },
  { number: 5, slug: 'ship-to-shared-code', title: 'Ship to shared code', short: 'Real issue, real review' },
  { number: 6, slug: 'review-a-peer', title: 'Review a peer', short: 'Both sides of review' },
  { number: 7, slug: 'propose-something', title: 'Propose something', short: 'Then: any repo you like' },
]

export const STAGE_COUNT = 7

/** Stages that become a personal issue for every cohort member. */
export const PERSONAL_STAGES: readonly number[] = [1, 2, 3, 4, 6, 7]

/** The stage claimed from the good-shared-issue pool instead of a personal issue. */
export const SHARED_STAGE = 5

export function stageByNumber(n: number): Stage | undefined {
  return STAGES.find((s) => s.number === n)
}
