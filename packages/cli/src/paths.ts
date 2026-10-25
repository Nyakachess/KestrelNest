import { ALLOWED_CONTRIBUTOR_FILE, CONTRIBUTORS_DIR, explainHandle, PRACTICE_FILE } from '@nest/schema'

export type OwnDirectoryCheck = { ok: true; handle: string } | { ok: false; reason: string }

/**
 * Decides whether a pull request may merge on its own: every changed file must sit in the
 * author's own contributor directory, be a file that belongs there, and not be the
 * workflow-owned counts file. Used by the auto-merge workflow on the base branch, never on
 * the pull request's own code.
 */
export function checkOwnDirectoryChange(files: readonly string[], author: string): OwnDirectoryCheck {
  const handle = author.toLowerCase()
  const why = explainHandle(handle)
  if (why) return { ok: false, reason: `The author's login ${why}` }
  if (files.length === 0) return { ok: false, reason: 'The pull request changes no files.' }
  const prefix = `${CONTRIBUTORS_DIR}/${handle}/`
  for (const file of files) {
    const normalized = file.split(String.fromCharCode(92)).join('/')
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
