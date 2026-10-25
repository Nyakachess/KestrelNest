import { z } from 'zod'
import { COHORT_ID_PATTERN } from './handle.js'

export const REPO_SLUG_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

/** One piece of external evidence: work accepted by a project outside Nest, listed by the owner. */
export const ProjectSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  repo: z.string().regex(REPO_SLUG_PATTERN),
  url: z.url(),
  merged: z.iso.date(),
})

export const ProfileSchema = z.strictObject({
  handle: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  cohort: z.string().regex(COHORT_ID_PATTERN),
  joined: z.iso.date(),
  intro: z.string().trim().min(1).max(280),
  skills_developing: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  next: z.string().trim().max(200).optional(),
  visibility: z.strictObject({
    page: z.enum(['public', 'private']),
  }),
  projects: z.array(ProjectSchema).max(50).default([]),
})

export type Profile = z.infer<typeof ProfileSchema>
export type ProfileInput = z.input<typeof ProfileSchema>
export type Project = z.infer<typeof ProjectSchema>

/** Text the scaffold puts in a profile. A public page may not still contain it. */
export const PLACEHOLDER_PREFIX = 'Replace this'

export function isPlaceholder(text: string): boolean {
  return text.trim().startsWith(PLACEHOLDER_PREFIX)
}

/** Initials for the avatar: first letter of the first two words, upper-cased. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}
