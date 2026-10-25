import { ALLOWED_CONTRIBUTOR_FILE, CONTRIBUTORS_DIR, explainHandle, PRACTICE_FILE } from '@nest/schema'
import { BOT_LOGIN } from './gh.js'

export type OwnDirectoryCheck = { ok: true; handle: string } | { ok: false; reason: string }

/** Files the enrolment bot may change on its own: a cohort's member list and the owners file. */
const BOT_FILE = /^(cohorts\/\d{4}-\d{2}\/cohort\.yml|\.github\/CODEOWNERS)$/

const normalize = (file: string) => file.split(String.fromCharCode(92)).join('/')

/**
 * Decides whether a pull request may merge on its own. Two cases:
 * 1. Every changed file sits in the author's own contributor directory, is a file that belongs
 *    there, and is not the workflow-owned counts file.
 * 2. The author is the workflow bot and every changed file is a cohort member list or CODEOWNERS,
 *    which is what nest enroll changes.
 * Used by the auto-merge workflow on the base branch, never on the pull request's own code.
 */
export function checkOwnDirectoryChange(files: readonly string[], author: string): OwnDirectoryCheck {
  if (files.length === 0) return { ok: false, reason: 'The pull request changes no files.' }
  if (author === BOT_LOGIN) {
    const outside = files.map(normalize).find((f) => !BOT_FILE.test(f))
    if (outside)
      return { ok: false, reason: `${outside} is not a file the enrolment bot may change on its own.` }
    return { ok: true, handle: BOT_LOGIN }
  }
  const handle = author.toLowerCase()
  const why = explainHandle(handle)
  if (why) return { ok: false, reason: `The author's login ${why}` }
  const prefix = `${CONTRIBUTORS_DIR}/${handle}/`
  for (const file of files) {
    const normalized = normalize(file)
    if (!normalized.startsWith(prefix)) {
      return {
        ok: false,
        reason: `${normalized} is outside ${prefix}, so a maintainer reviews this pull request.`,
      }
    }
    const name = normalized.slice(prefix.length)
    if (name.includes('/'))
      return {
        ok: false,
        reason: `${normalized} is in a subdirectory, which a contributor directory does not have.`,
      }
    if (name === PRACTICE_FILE)
      return {
        ok: false,
        reason: `${normalized} is written by a workflow and is not edited in pull requests.`,
      }
    if (!ALLOWED_CONTRIBUTOR_FILE.test(name))
      return { ok: false, reason: `${normalized} is not a file that belongs in a contributor directory.` }
  }
  return { ok: true, handle }
}
