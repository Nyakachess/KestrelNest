import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { DEFECTS } from '../defects.js'
import {
  BANK_DIR,
  buildRequests,
  estimateTokens,
  PROMPT_VERSION,
  requestPath,
  writeRequests,
} from '../defect-bank/request.js'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

export type DefectRequestOptions = { round: number; count?: number | undefined; out?: string | undefined }

/** Writes the request file for one round. No model is called; Kestrel's runner sends it. */
export function runDefectRequest(config: RepoConfig, opts: DefectRequestOptions, io: Io): number {
  const lines = buildRequests(
    config.root,
    opts.round,
    DEFECTS.map((d) => d.id),
    opts.count ?? 20,
  )
  const path = opts.out ?? requestPath(config.root, opts.round)
  writeRequests(path, lines)
  const prompt = readFileSync(join(config.root, BANK_DIR, `${PROMPT_VERSION}.md`), 'utf8')
  const tokens = estimateTokens(lines, prompt)
  io.out(
    `Wrote ${lines.length} request(s) for round ${opts.round} to ${relative(config.root, path).replace(/\\/g, '/')}.`,
  )
  io.out(
    `Estimate: about ${tokens.toLocaleString('en-GB')} tokens (input from the characters sent, plus ${lines.length} x 2,500 output). No model was called.`,
  )
  io.out(
    `Before submitting, copy ${BANK_DIR}/${PROMPT_VERSION}.md to the Kestrel repository's api/app/prompts/, where the runner reads it.`,
  )
  return 0
}
