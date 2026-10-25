import type { ValidationIssue } from './issues.js'
import { isPlaceholder } from './profile.js'

export const PAGE_SECTIONS = [
  'Where I started',
  'What I learned',
  'What I built',
  'What I am working on next',
] as const

export type PageSectionTitle = (typeof PAGE_SECTIONS)[number]

export type PageSection = {
  title: PageSectionTitle
  /** Markdown body with surrounding blank lines removed. */
  body: string
  /** 1-based line of the heading. */
  line: number
  placeholder: boolean
}

export type Page = {
  sections: PageSection[]
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/

const allowed = () => PAGE_SECTIONS.map((s) => `"## ${s}"`).join(', ')

/**
 * page.md is a short Markdown file with up to four level-two sections, one per heading in
 * PAGE_SECTIONS. Anything else is reported with its line.
 */
export function parsePage(text: string, file: string): { page: Page; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const sections: PageSection[] = []
  const seen = new Set<string>()
  let current: { title: PageSectionTitle | null; line: number; body: string[] } | null = null

  const flush = () => {
    if (current?.title) {
      const body = current.body.join('\n').trim()
      sections.push({ title: current.title, body, line: current.line, placeholder: isPlaceholder(body) })
    }
    current = null
  }

  text.split(/\r?\n/).forEach((raw, i) => {
    const lineNo = i + 1
    const m = HEADING.exec(raw)
    if (!m) {
      if (current) current.body.push(raw)
      else if (raw.trim() !== '') {
        issues.push({
          file,
          line: lineNo,
          field: 'page.md',
          message: `has text before the first heading. Every paragraph belongs under one of: ${allowed()}.`,
        })
      }
      return
    }
    const hashes = m[1] ?? ''
    const title = m[2] ?? ''
    const known = PAGE_SECTIONS.find((s) => s === title)
    flush()
    if (hashes.length === 2 && known) {
      if (seen.has(known)) {
        issues.push({
          file,
          line: lineNo,
          field: 'heading',
          message: `"## ${known}" appears twice. Keep one.`,
        })
      }
      seen.add(known)
      current = { title: known, line: lineNo, body: [] }
      return
    }
    const nearly = PAGE_SECTIONS.find((s) => s.toLowerCase() === title.toLowerCase())
    const message = known
      ? `heading must use two hashes: "## ${known}".`
      : nearly
        ? `heading must be written exactly as "## ${nearly}".`
        : `"${title}" is not a section of a contributor page. Use one of: ${allowed()}.`
    issues.push({ file, line: lineNo, field: 'heading', message })
    // Swallow the body under a bad heading so its paragraphs are not reported as stray text too.
    current = { title: null, line: lineNo, body: [] }
  })
  flush()

  return { page: { sections }, issues }
}

/** Problems that only matter once the owner wants the page published. */
export function publishIssues(page: Page, file: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!page.sections.some((s) => s.title === 'Where I started')) {
    issues.push({
      file,
      field: 'heading',
      message:
        'a public page needs a "## Where I started" section. Add it, then write a few sentences under it.',
    })
  }
  for (const s of page.sections) {
    if (s.placeholder) {
      issues.push({
        file,
        line: s.line,
        field: s.title,
        message: 'still has the template text. Write it in your own words, or remove the section.',
      })
    } else if (s.body === '') {
      issues.push({
        file,
        line: s.line,
        field: s.title,
        message: 'is empty. Write a few sentences under it, or remove the heading.',
      })
    }
  }
  return issues
}
