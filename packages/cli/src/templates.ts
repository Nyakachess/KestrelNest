import { PAGE_SECTIONS, type PageSectionTitle } from '@nest/schema'

/** Everything the scaffold needs to render a contributor directory. Defects edit this before rendering. */
export type ScaffoldPlan = {
  handle: string
  /** null for an individual joiner with no cohort. */
  cohort: string | null
  joined: string
  name: string
  next: string | null
  skills: string[]
  visibility: 'public' | 'private'
  sectionOrder: PageSectionTitle[]
}

export function defaultPlan(handle: string, cohort: string | null, joined: string): ScaffoldPlan {
  return {
    handle,
    cohort,
    joined,
    name: 'Replace this with the name you want on your page',
    next: null,
    skills: [],
    visibility: 'private',
    sectionOrder: [...PAGE_SECTIONS],
  }
}

const yamlString = (s: string) =>
  /[:#'"{}[\],&*?|<>=!%@`]/.test(s) || s !== s.trim() ? JSON.stringify(s) : s

export function renderProfile(plan: ScaffoldPlan): string {
  const lines = [
    '# Your profile. Fill in name, intro and skills_developing in your own words.',
    '# Leave handle, cohort and joined as they are; they are set for you. docs/CONTRIBUTING.md explains every field.',
    `handle: ${plan.handle}`,
    `name: ${yamlString(plan.name)}`,
    ...(plan.cohort === null
      ? ['# cohort: none. Set it when you join one, as YYYY-MM.']
      : [`cohort: ${plan.cohort}`]),
    `joined: ${plan.joined}`,
    'intro: Replace this with one or two sentences about where you are now, not where you want to be.',
    plan.skills.length === 0 ? 'skills_developing: []' : 'skills_developing:',
    ...plan.skills.map((s) => `  - ${yamlString(s)}`),
    ...(plan.next === null ? [] : [`next: ${yamlString(plan.next)}`]),
    'visibility:',
    '  # private until Stage 2. Change it to public when your page is ready; change it back any time.',
    `  page: ${plan.visibility}`,
    '# Work accepted by other projects goes here, newest first, with the merged pull request address. Leave it empty until there is some.',
    'projects: []',
    '',
  ]
  return lines.join('\n')
}

const PLACEHOLDERS: Record<PageSectionTitle, string> = {
  'Where I started':
    'Replace this paragraph with where you were when you joined: what you could already do, and what brought you here. Two or three sentences are plenty.',
  'What I learned':
    'Replace this paragraph with one thing you learned that you did not expect to, or delete this section until you have one.',
  'What I built':
    'Replace this paragraph with what you built, starting with this page, or delete this section for now.',
  'What I am working on next':
    'Replace this paragraph with what you are working on next and why, or delete this section for now.',
}

export function renderPage(plan: ScaffoldPlan): string {
  return plan.sectionOrder.map((title) => `## ${title}\n\n${PLACEHOLDERS[title]}\n`).join('\n')
}

export function renderReadme(plan: ScaffoldPlan, repoUrl: string): string {
  return [
    `# contributors/${plan.handle}`,
    '',
    `This directory belongs to @${plan.handle}. Only its owner edits it; everyone else reviews.`,
    '',
    'What is here and what to do with it:',
    '',
    '- `profile.yml`: who you are. Fill it in during Stage 2. Checked on every pull request.',
    '- `page.md`: your page, four short sections. Fill in "Where I started" during Stage 2.',
    '- `profile.test.ts`: the tests that guard your page. Stage 4 adds one.',
    '- `.practice.json`: counts written by a workflow after your pull requests merge. Never edit it by hand.',
    '',
    'Before you push: `npm run validate` tells you the file, the line and the field of anything that needs changing. To see your page, run `npm run dev` and open http://localhost:4321/p/' +
      plan.handle +
      '/ (once it is public).',
    '',
    `Your issues, in order: ${repoUrl}/issues?q=is%3Aopen+assignee%3A${plan.handle}+label%3Aonboarding`,
    '',
  ].join('\n')
}

export function renderTest(plan: ScaffoldPlan): string {
  return [
    "import { fileURLToPath } from 'node:url'",
    "import { describe, expect, it } from 'vitest'",
    "import { validateContributor } from '@nest/schema'",
    '',
    '// The repository root, two directories up from this file.',
    "const root = fileURLToPath(new URL('../../', import.meta.url))",
    `const handle = '${plan.handle}'`,
    '',
    `describe('contributors/${plan.handle}', () => {`,
    "  it('validates without problems', () => {",
    '    const result = validateContributor(root, handle)',
    '    expect(result.issues).toEqual([])',
    '  })',
    '',
    '  // Stage 4: add the test that would have caught the defect you fixed in Stage 3.',
    '  // Start from the shape of the test above. It should fail with the defect and pass without it.',
    '})',
    '',
  ].join('\n')
}

export type ScaffoldFiles = {
  'profile.yml': string
  'page.md': string
  'README.md': string
  'profile.test.ts': string
}

export function renderAll(plan: ScaffoldPlan, repoUrl: string): ScaffoldFiles {
  return {
    'profile.yml': renderProfile(plan),
    'page.md': renderPage(plan),
    'README.md': renderReadme(plan, repoUrl),
    'profile.test.ts': renderTest(plan),
  }
}
