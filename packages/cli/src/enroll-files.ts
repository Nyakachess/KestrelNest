import { isSeq, parseDocument } from 'yaml'

export type FileChange = { text: string; changed: boolean }

/** Adds the handle to the members list of a cohort.yml, keeping the list sorted and free of duplicates. */
export function addCohortMember(yamlText: string, handle: string): FileChange {
  const doc = parseDocument(yamlText)
  const members = doc.get('members', true)
  const current: string[] = isSeq(members)
    ? members.items.map((m) => String((m as { value?: unknown }).value ?? m))
    : []
  const next = [...new Set([...current, handle].map((m) => m.toLowerCase()))].sort()
  if (next.join('|') === current.join('|')) return { text: yamlText, changed: false }
  doc.set('members', next)
  return { text: doc.toString(), changed: true }
}

export const CODEOWNERS_SECTION =
  '# Contributor directories, one line each, kept sorted. Added by nest enroll.'

const ownerLine = (handle: string) => `/contributors/${handle}/ @${handle}`
const OWNER_LINE = /^\/contributors\/([a-z0-9-]+)\/ @([A-Za-z0-9-]+)\s*$/

/** Ensures CODEOWNERS has the owner line for the handle, in a sorted block at the end, with no duplicates. */
export function addCodeownersLine(text: string, handle: string): FileChange {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const owners = new Map<string, string>()
  const rest: string[] = []
  for (const line of lines) {
    const m = OWNER_LINE.exec(line)
    if (m) owners.set(m[1] as string, line.trim())
    else if (line.trim() !== CODEOWNERS_SECTION) rest.push(line)
  }
  const before = [...owners.keys()].sort().join('|')
  owners.set(handle, ownerLine(handle))
  const after = [...owners.keys()].sort().join('|')
  if (before === after) return { text, changed: false }
  while (rest.length > 0 && rest[rest.length - 1]?.trim() === '') rest.pop()
  const block = [...owners.keys()].sort().map((h) => owners.get(h) as string)
  return { text: [...rest, '', CODEOWNERS_SECTION, ...block, ''].join('\n'), changed: true }
}
