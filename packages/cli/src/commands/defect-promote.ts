import { relative } from 'node:path'
import { UsageError } from '../args.js'
import { promote } from '../defect-bank/promote.js'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

/** Moves a candidate that passed the gate into the bank with the next number from 6. */
export function runDefectPromote(config: RepoConfig, id: string | undefined, io: Io): number {
  if (!id) throw new UsageError('defect-promote needs a candidate id: nest defect-promote <id>')
  const { number, files } = promote(config.root, id)
  io.out(`Promoted ${id} as defect ${number}.`)
  for (const f of files) io.out(`  ${relative(config.root, f).replace(/\\/g, '/')}`)
  io.out('Run npm test and npm run typecheck, then commit the files above.')
  return 0
}
