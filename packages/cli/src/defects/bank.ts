// Written by `nest defect-promote` (docs/P2-defect-bank.md, ADR 0009). Do not edit by hand.
import type { BankDefect } from '../defect-bank/types.js'

/** Promoted defects, numbered from 6. The first five live in defects.ts. */
export const PROMOTED: readonly { number: number; defect: BankDefect }[] = []
