/**
 * A contributor handle is the GitHub login, written in lower case: letters, digits and
 * single hyphens, 1 to 39 characters, no leading or trailing hyphen.
 *
 * A leading underscore is rejected on purpose. Template directories such as
 * contributors/_example/ are named with one so that they can never publish a page,
 * whatever their profile says.
 */
export const HANDLE_PATTERN = /^[a-z0-9](?:-?[a-z0-9]){0,38}$/

export const HANDLE_MAX_LENGTH = 39

/** Cohort ids are a year and a month: 2027-01. */
export const COHORT_ID_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export function isHandle(value: string): boolean {
  return value.length <= HANDLE_MAX_LENGTH && HANDLE_PATTERN.test(value)
}

export function isCohortId(value: string): boolean {
  return COHORT_ID_PATTERN.test(value)
}

/** Directories whose name starts with an underscore are templates, never contributors. */
export function isTemplateDir(name: string): boolean {
  return name.startsWith('_')
}

/** Why a value is not a valid handle, in one plain sentence, or null when it is valid. */
export function explainHandle(value: string): string | null {
  if (value.length === 0) return 'must not be empty.'
  if (value.startsWith('_'))
    return 'must not start with an underscore. Directories that start with one are templates and never publish.'
  if (value !== value.toLowerCase()) return 'must be in lower case.'
  if (value.length > HANDLE_MAX_LENGTH) return `must be at most ${HANDLE_MAX_LENGTH} characters.`
  if (/^-|-$/.test(value)) return 'must not start or end with a hyphen.'
  if (value.includes('--')) return 'must not contain two hyphens in a row.'
  if (!/^[a-z0-9-]+$/.test(value)) return 'may only contain lower-case letters, digits and hyphens.'
  if (!HANDLE_PATTERN.test(value)) return 'is not a valid handle.'
  return null
}
