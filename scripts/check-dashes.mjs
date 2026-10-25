#!/usr/bin/env node
// Fails when any tracked text file contains an em dash (U+2014).
// The rule for this repo: use a comma, full stop or colon instead.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const EM_DASH = '—'
const SKIP = [/^docs\/design\//, /\.(png|jpg|ico|woff2)$/]

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && !SKIP.some((re) => re.test(f)))

let failures = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(EM_DASH)) continue
  text.split('\n').forEach((line, i) => {
    if (line.includes(EM_DASH)) {
      failures += 1
      console.error(`${file}:${i + 1}: em dash found. Use a comma, full stop or colon instead.`)
    }
  })
}

if (failures > 0) {
  console.error(`\n${failures} em dash${failures === 1 ? '' : 'es'} found.`)
  process.exit(1)
}
console.log(`No em dashes in ${files.length} tracked files.`)
