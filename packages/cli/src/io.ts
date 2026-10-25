/** Where command output goes. Tests collect it; the CLI prints it. */
export type Io = {
  out: (line: string) => void
  err: (line: string) => void
}

export const consoleIo: Io = {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
}

export function collectIo(): Io & { lines: string[]; errors: string[] } {
  const lines: string[] = []
  const errors: string[] = []
  return { lines, errors, out: (l) => lines.push(l), err: (l) => errors.push(l) }
}
