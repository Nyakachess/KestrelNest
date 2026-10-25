import { LineCounter, isMap, isSeq, parseDocument, type Node, type Pair } from 'yaml'
import type { ValidationIssue } from './issues.js'

export type YamlFile = {
  data: unknown
  /** Syntax problems, already in plain words. Empty when the file parsed. */
  syntaxIssues: ValidationIssue[]
  lineOf: (path: readonly PropertyKey[]) => number | undefined
  keyLineOf: (path: readonly PropertyKey[], key: string) => number | undefined
}

/** Parses YAML and keeps enough of the document to point at lines in error messages. */
export function readYaml(text: string, file: string): YamlFile {
  const lineCounter = new LineCounter()
  const doc = parseDocument(text, { lineCounter, prettyErrors: false })

  const syntaxIssues: ValidationIssue[] = doc.errors.map((e) => ({
    file,
    line: lineCounter.linePos(e.pos[0]).line,
    field: '(file)',
    message: `could not be read as YAML. ${e.message.split('\n')[0] ?? 'Check the indentation and punctuation.'}`,
  }))

  const nodeAt = (path: readonly PropertyKey[]): Node | undefined => {
    if (path.length === 0) return doc.contents ?? undefined
    const node: unknown = doc.getIn(path as (string | number)[], true)
    return node && typeof node === 'object' ? (node as Node) : undefined
  }

  const lineOf = (path: readonly PropertyKey[]): number | undefined => {
    const start = nodeAt(path)?.range?.[0]
    return start === undefined ? undefined : lineCounter.linePos(start).line
  }

  const keyLineOf = (path: readonly PropertyKey[], key: string): number | undefined => {
    const node = nodeAt(path)
    if (!node || !isMap(node)) return undefined
    const pair = node.items.find((p: Pair) => String((p.key as { value?: unknown })?.value ?? p.key) === key)
    const start = (pair?.key as Node | undefined)?.range?.[0]
    return start === undefined ? undefined : lineCounter.linePos(start).line
  }

  let data: unknown = undefined
  if (syntaxIssues.length === 0) data = doc.toJS()
  if (syntaxIssues.length === 0 && (data === null || typeof data !== 'object' || isSeq(doc.contents))) {
    syntaxIssues.push({
      file,
      line: 1,
      field: '(file)',
      message: 'must contain a mapping of fields, one per line, like name: Your Name.',
    })
    data = undefined
  }
  return { data, syntaxIssues, lineOf, keyLineOf }
}
