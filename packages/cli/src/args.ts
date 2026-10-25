export type ParsedArgs = {
  command: string | undefined
  positionals: string[]
  flags: Record<string, string | true>
}

/** Minimal argv parser: the first bare word is the command, `--key value` and `--flag` are flags. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = []
  const flags: Record<string, string | true> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq > 0) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1)
        continue
      }
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next
        i++
      } else flags[key] = true
      continue
    }
    positionals.push(arg)
  }
  const [command, ...rest] = positionals
  return { command, positionals: rest, flags }
}

export function flagString(flags: ParsedArgs['flags'], key: string): string | undefined {
  const v = flags[key]
  return typeof v === 'string' ? v : undefined
}

export function flagBool(flags: ParsedArgs['flags'], key: string): boolean {
  return flags[key] !== undefined
}

/** A mistake in how the command was called. Printed as one sentence, exit code 2. */
export class UsageError extends Error {
  override name = 'UsageError'
}
