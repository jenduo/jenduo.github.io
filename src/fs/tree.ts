import type { Line } from '../commands/types'
import { ICONS } from './icons'
import type { Dir } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// This file is the entire content of the site. To update the site, edit here.
//
// Extensions are optional to type (see fs/resolve.ts), so filenames are bare
// words. `resume.pdf` keeps its extension because the extension is the point.
// ─────────────────────────────────────────────────────────────────────────────

/** Shown by `whoami`. Cropped to Jen alone: the original frame had someone
 *  else's face on a phone screen in it. */
export const portrait = { src: '/jen.jpg', alt: 'Jennifer Duong' }

/** Printed by `whoami`, so the intro is a command rather than a file. */
export const intro = `software engineer in Melbourne, currently at InvestorHub.

I work across the marketing suite there: newsflow distribution, a website builder, and webinar tooling wired into shareholder data.

Before that, HPC and applied ML research at the University of Melbourne and CSL. I parallelised machine learning workloads on the Spartan cluster and wrapped researchers' models in APIs so people outside the lab could run them. Two papers came out of it.

Try:  ls experience     ls publications     cat skills`

/**
 * Skill rows carry logos, so `skills` ships pre-built lines as well as a plain
 * body. The body is the fallback and keeps the file readable as text.
 */
const SKILL_ROWS: { label: string; items: [string, string?][] }[] = [
  {
    label: 'languages',
    items: [
      ['Python', 'python'],
      ['TypeScript', 'typescript'],
      ['JavaScript', 'javascript'],
      ['Elixir', 'elixir'],
      ['Java', 'java'],
    ],
  },
  {
    label: 'frontend',
    items: [
      ['React', 'react'],
      ['Next.js', 'nextjs'],
      ['Tailwind', 'tailwind'],
      ['HTML', 'html'],
      ['CSS', 'css'],
    ],
  },
  {
    label: 'backend',
    items: [
      ['Node.js', 'node'],
      ['FastAPI', 'fastapi'],
      ['GraphQL', 'graphql'],
    ],
  },
  {
    label: 'data',
    items: [
      ['PostgreSQL', 'postgresql'],
      ['MySQL', 'mysql'],
      ['Databricks', 'databricks'],
    ],
  },
  {
    label: 'infra',
    items: [
      ['GCP', 'gcp'],
      ['Docker', 'docker'],
      ['Git', 'git'],
      ['Posit Connect', 'posit'],
    ],
  },
  // Slurm has no logo in simple-icons, so this row is deliberately bare.
  { label: 'hpc', items: [['Spartan (SLURM)', undefined]] },
]

const skillLines: Line[] = SKILL_ROWS.map((row) => ({
  type: 'icons',
  label: row.label,
  items: row.items.map(([name, icon]) => ({ name, path: icon ? ICONS[icon] : undefined })),
}))

/** Plain-text form, kept so the file still reads as a file. */
const skills = SKILL_ROWS.map(
  (row) => row.label.padEnd(13) + row.items.map(([name]) => name).join(' \u00b7 '),
).join('\n')

const education = `University of Melbourne
Masters of Computer Science, Distributed Computing
Feb 2024 to Dec 2025 · First Class Honours (83%)

University of Melbourne
Bachelor of Science, Computer and Software Systems
Feb 2021 to Dec 2023 · Second Class Honours (79%)
`

const resume = `Jennifer Duong, curriculum vitae.

type 'open resume' to read it.
`

const email = `jenniferduong.aa@gmail.com

type 'open email' to send me an email.
`

const github = `github.com/jenduo

type 'open github' to see my repos.
`

const linkedin = `linkedin.com/in/jennifer-duong-b78933257

type 'open linkedin' to open my LinkedIn.
`

const investorhub = `# InvestorHub · Junior Software Engineer
## Melbourne CBD, VIC · Dec 2025 to present

- Built an in-house video recording tool on Chrome's MediaRecorder API, so companies can capture and embed video without leaving the platform.
- Consolidated a content block system that had duplicated code across every style variant, so adding a variant is cheap instead of copy-paste.
- Shipped full-stack features across the marketing suite: newsflow distribution to email, LinkedIn and Twitter, a flexible website builder, and webinar tooling wired into shareholder data.
`

const unimelbCsl = `# University of Melbourne & CSL · Technical Research Assistant
## Carlton, VIC · Aug 2024 to Nov 2025

- Wrote parallelised machine learning scripts in Python and ran them on Spartan, the university's HPC cluster, to speed up research workflows.
- Built FastAPI services that put PhD researchers' computational models into other people's hands, moving data in and out through Databricks and hosting on Posit Connect.
`

const allmediadesk = `# AllMediaDesk · Software Engineer Intern
## Melbourne CBD, VIC · Feb 2023 to Sept 2023

- Worked with the sales and release teams on performance and usability problems.
- Built a CRM portal: TypeScript front end, JavaScript back end.
- Containerised AdPerform and AdOptimize, cutting upgrade times.
`

const multifidelity = `# Doing More with Less: Multifidelity Optimization in the Biopharmaceutical Industry
## BioProcess International, 24(2) · February 2026

Golzarijalal M, Aickelin U, Duong QCT, Otte E.

Monoclonal antibodies are in high demand, but the experiments that improve how they are manufactured are slow and expensive, so process development runs on very little data. Multifidelity optimisation gets around that by pairing the few high-quality experiments you can afford with cheap simulation data. In our case study, four extra real experiments lifted antibody productivity by around 25% over the historical baseline.

type 'open multifidelity-optimisation' to read the article.
`

const choFedBatch = `# A Dynamic and Generalizable Modelling Framework Based on Genome-Scale Flux Balance Analysis for CHO Fed-Batch Culture
## SSRN preprint · August 2025 · doi:10.2139/ssrn.5591701

Golzarijalal M, et al. (incl. Duong QCT)

type 'open cho-fed-batch-modelling' to read the preprint.
`

const volunteer = `# University of Melbourne · Student Ambassador
## Mar 2025 to present

Representing the faculty at Open Day and other outreach events: panels, tours and content creation.

Melbourne Plus: People Leadership · Aug 2025
`

export const root: Dir = {
  kind: 'dir',
  name: '',
  // Ordered deliberately: publications sits ahead of other, and the work
  // comes before the loose files. Alphabetical would put other first.
  keepOrder: true,
  children: [
    {
      kind: 'dir',
      name: 'contact',
      // Jen's preferred order, not alphabetical.
      keepOrder: true,
      children: [
        {
          kind: 'file',
          name: 'linkedin',
          body: linkedin,
          href: 'https://www.linkedin.com/in/jennifer-duong-b78933257/',
        },
        {
          kind: 'file',
          name: 'email',
          body: email,
          href: 'mailto:jenniferduong.aa@gmail.com',
        },
        { kind: 'file', name: 'github', body: github, href: 'https://github.com/jenduo' },
      ],
    },
    {
      kind: 'dir',
      name: 'experience',
      // Newest first, as a CV reads. Alphabetical would bury the current job.
      keepOrder: true,
      children: [
        { kind: 'file', name: 'investorhub', body: investorhub },
        { kind: 'file', name: 'unimelb-csl', body: unimelbCsl },
        { kind: 'file', name: 'allmediadesk', body: allmediadesk },
      ],
    },
    {
      kind: 'dir',
      name: 'publications',
      // Newest first, same reasoning as experience.
      keepOrder: true,
      children: [
        {
          kind: 'file',
          name: 'multifidelity-optimisation',
          body: multifidelity,
          href: 'https://www.bioprocessintl.com/qa-qc/doing-more-with-less-multifidelity-optimization-in-the-biopharmaceutical-industry',
        },
        {
          kind: 'file',
          name: 'cho-fed-batch-modelling',
          body: choFedBatch,
          href: 'https://doi.org/10.2139/ssrn.5591701',
        },
      ],
    },
    {
      kind: 'dir',
      name: 'other',
      children: [{ kind: 'file', name: 'volunteer', body: volunteer }],
    },
    { kind: 'file', name: 'education', body: education },
    { kind: 'file', name: 'resume.pdf', body: resume, href: '/resume.pdf' },
    { kind: 'file', name: 'skills', body: skills, lines: skillLines },
  ],
}
