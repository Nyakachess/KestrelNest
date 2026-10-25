import type { ZodError } from 'zod'

/** One problem in one file, readable by a first-time contributor. */
export type ValidationIssue = {
  /** Path relative to the repository root, with forward slashes. */
  file: string
  /** 1-based line, when known. */
  line?: number
  /** Dotted field path such as visibility.page or projects[1].url, or the file itself. */
  field: string
  /** A plain sentence. */
  message: string
}

export function formatIssue(issue: ValidationIssue): string {
  const where = issue.line === undefined ? issue.file : `${issue.file}:${issue.line}`
  return `${where} ${issue.field}: ${issue.message}`
}

export function fieldName(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(file)'
  return path
    .map((part, i) => (typeof part === 'number' ? `[${part}]` : i === 0 ? String(part) : `.${String(part)}`))
    .join('')
}

type Issue = ZodError['issues'][number]

const isMissing = (issue: Issue) => issue.code === 'invalid_type' && /received undefined$/.test(issue.message)

function plainMessage(issue: Issue, field: string): string {
  switch (issue.code) {
    case 'invalid_type': {
      if (isMissing(issue)) return 'is required.'
      const expected =
        issue.expected === 'array'
          ? 'a list'
          : issue.expected === 'object'
            ? 'a mapping of fields'
            : `a ${issue.expected}`
      return `must be ${expected}.`
    }
    case 'too_small': {
      if (issue.origin === 'string')
        return issue.minimum === 1 ? 'must not be empty.' : `must be at least ${issue.minimum} characters.`
      if (issue.origin === 'array')
        return `needs at least ${issue.minimum} item${issue.minimum === 1 ? '' : 's'}.`
      return `must be at least ${issue.minimum}.`
    }
    case 'too_big': {
      if (issue.origin === 'string') return `must be at most ${issue.maximum} characters.`
      if (issue.origin === 'array')
        return `may have at most ${issue.maximum} item${issue.maximum === 1 ? '' : 's'}.`
      return `must be at most ${issue.maximum}.`
    }
    case 'invalid_format': {
      if (issue.format === 'date') return 'must be a date written as YYYY-MM-DD, for example 2027-01-12.'
      if (issue.format === 'datetime') return 'must be a timestamp written like 2027-01-12T09:30:00Z.'
      if (issue.format === 'url') return 'must be a full web address starting with https://.'
      if (issue.format === 'regex' && field === 'cohort')
        return 'must be a year and month written as YYYY-MM, for example 2027-01.'
      if (issue.format === 'regex' && field.endsWith('.repo'))
        return 'must be written as owner/name, for example kestrel-collective/nest.'
      return 'is not in the expected format.'
    }
    case 'invalid_value': {
      const values = issue.values.map((v) => JSON.stringify(v)).join(' or ')
      return `must be ${values}.`
    }
    case 'custom':
      return issue.message
    default:
      return issue.message
  }
}

function basename(file: string): string {
  return file.slice(file.lastIndexOf('/') + 1)
}

/**
 * Turns zod issues into plain-sentence issues with a file and, when the caller can find one,
 * a line number. Unknown keys become one issue per key so the spelling mistake is named.
 */
export function fromZodError(
  error: ZodError,
  file: string,
  lineOf: (path: readonly PropertyKey[]) => number | undefined,
  keyLineOf: (path: readonly PropertyKey[], key: string) => number | undefined,
): ValidationIssue[] {
  const out: ValidationIssue[] = []
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        const line = keyLineOf(issue.path, key)
        out.push({
          file,
          ...(line === undefined ? {} : { line }),
          field: fieldName([...issue.path, key]),
          message: `is not a field in ${basename(file)}. Check the spelling.`,
        })
      }
      continue
    }
    const field = fieldName(issue.path)
    const line = isMissing(issue) ? lineOf(issue.path.slice(0, -1)) : lineOf(issue.path)
    out.push({ file, ...(line === undefined ? {} : { line }), field, message: plainMessage(issue, field) })
  }
  return out
}
