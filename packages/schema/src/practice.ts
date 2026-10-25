import { z } from 'zod'
import { STAGE_COUNT } from './stages.js'

/**
 * .practice.json is written by a workflow, never by hand. It holds the counts the site shows
 * without calling GitHub at build time.
 */
export const PracticeSchema = z.strictObject({
  updated_at: z.iso.datetime(),
  /** Merged pull requests to the owner's own directory. */
  practice: z.int().min(0),
  /** Merged pull requests by the owner to Nest's shared code. */
  shared: z.int().min(0),
  /** Stage numbers whose personal issue is closed, or stage 5 when a shared PR merged. */
  stages_done: z.array(z.int().min(1).max(STAGE_COUNT)).max(STAGE_COUNT),
})

export type Practice = z.infer<typeof PracticeSchema>

export const EMPTY_PRACTICE: Practice = {
  updated_at: '1970-01-01T00:00:00Z',
  practice: 0,
  shared: 0,
  stages_done: [],
}

/** Number of distinct stages completed, 0 to 7. This is the "stage" every page and the feed report. */
export function stagesDone(practice: Practice): number {
  return new Set(practice.stages_done).size
}
