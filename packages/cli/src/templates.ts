import { PAGE_SECTIONS, type PageSectionTitle } from '@nest/schema'

/** Everything the scaffold needs to render a contributor directory. Defects edit this before rendering. */
export type ScaffoldPlan = {
  handle: string
  cohort: string
  joined: string
  name: string
  next: string | null
  skills: string[]
  visibility: 'public' | 'private'
  sectionOrder: PageSectionTitle[]
}

export function defaultPlan(handle: string, cohort: string, joined: string): ScaffoldPlan {
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
    '# Your profile. Every field is explained in docs/CONTRIBUTING.md.',
    '# Keep handle, cohort and joined as they are. Fill in the rest in your own words.',
    `handle: ${plan.handle}`,
    `name: ${yamlString(plan.name)}`,
    `cohort: ${plan.cohort}`,
    `joined: ${plan.joined}`,
    'intro: Replace this with one or two sentences about yourself.',
    plan.skills.length === 0 ? 'skills_developing: []' : 'skills_developing:',
    ...plan.skills.map((s) => `  - ${yamlString(s)}`),
    ...(plan.next === null ? [] : [`next: ${yamlString(plan.next)}`]),
    'visibility:',
    '  # Change to public when your page is ready to be seen. You can change it back any time.',
    `  page: ${plan.visibility}`,
    '# Work accepted by other projects goes here, newest first. Leave it empty until there is some.',
    'projects: []',
    '',
  ]
  return lines.join('\n')
}

const PLACEHOLDERS: Record<PageSectionTitle, string> = {
  'Where I started':
    'Replace this paragraph with where you were when you joined: what you could already do, and what brought you here.',
  'What I learned': 'Replace this paragraph with one thing you learned that you did not expect to.',
  'What I built': 'Replace this paragraph with what you built, starting with this page.',
  'What I am working on next': 'Replace this paragraph with what you are working on next and why.',
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
    '- `profile.yml`: who you are. Validated on every pull request.',
    '- `page.md`: your page, four short sections.',
    '- `profile.test.ts`: the tests that guard your page. Stage 4 adds one.',
    '- `.practice.json`: counts written by a workflow. Never edit it by hand.',
    '',
    `Run \`npx nest validate\` before you push. Start with the Stage 1 issue: ${repoUrl}/issues?q=is%3Aopen+label%3Astage%3A1+assignee%3A${plan.handle}`,
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
    '  // It should fail on the broken profile and pass on the fixed one.',
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
