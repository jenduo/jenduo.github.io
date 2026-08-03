import type { Dir } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// This file is the entire content of the site. To update the site, edit here.
//
// [TODO] markers are load-bearing: they mark claims that were inferred from
// public repos rather than confirmed. Fill them in or delete them — do not
// smooth them into confident prose.
// ─────────────────────────────────────────────────────────────────────────────

const about = `Jennifer Duong — software engineer
Melbourne, VIC

  Full-stack web development, high-performance computing and applied ML —
  building scalable systems across cloud, research and product environments.

  Right now I'm a Junior Software Engineer at InvestorHub, working across the
  marketing suite: newsflow distribution, a website builder, and webinar
  tooling wired into shareholder data.

  Before that I was a Technical Research Assistant at the University of
  Melbourne and CSL — parallelising machine learning workloads on the Spartan
  HPC cluster, and turning PhD researchers' models into FastAPI services other
  people could actually use. Two papers came out of that work.

  Masters of Computer Science in Distributed Computing (First Class Honours),
  and a Bachelor of Science in Computer and Software Systems — both at the
  University of Melbourne.

  Try:  ls projects     ls experience     cat skills.txt
`

const skills = `languages    TypeScript · JavaScript · Python · SQL
frontend     React · [TODO: confirm — Tailwind? plain CSS? something else?]
backend      [TODO: confirm — Node? Rails? Django?]
data / ML    PyTorch · BoTorch · Gaussian processes · Bayesian optimization
tooling      Git · [TODO: confirm — Docker? CI? cloud platforms?]

  [TODO: this list is inferred from your public repos, not from you. Delete
  anything you would not want to be interviewed on.]
`

const contact = `email      jenniferduong.aa@gmail.com
github     github.com/jenduo
linkedin   [TODO: your profile URL]

  Melbourne, VIC

  [Deliberately not here: your phone number. It is on your resume, which is
  fine — a resume goes to people you chose. A public page is scraped.]

  Try:  open resume.pdf
`

const resume = `[TODO: drop resume.pdf into public/, then set href: '/resume.pdf' on this
node in src/fs/tree.ts. Until then 'open resume.pdf' says it is not up yet.]
`

const investorhub = `# InvestorHub

  [TODO: your title] · [TODO: start date] – present

  InvestorHub builds investor relations software for listed companies —
  shareholder analytics, communications, and engagement tooling.

  What I work on:
    - [TODO]
    - [TODO]
    - [TODO]

  [TODO: keep this to what is public. When in doubt, describe the kind of
  problem rather than the internal system that solves it.]
`

const asxReadme = `# asx-company-info

  A tool for comparing ASX-listed companies side by side.

  People want two different things from a comparison tool: a fast throwaway
  look, and a way to keep the comparisons that matter. So it does both — quick
  comparisons need no setup, and any comparison can be saved as a favourite,
  backed by SQL.

  Comparisons are shareable as query URLs. That was a deliberate limit: a
  shared link is a read-only slice of the tool, which nudges the recipient
  toward running their own comparisons rather than living in someone else's.

  Ticker input is validated on entry rather than downstream, so bad input fails
  where the user can still see what they typed.

  open this file to go to the repo.
`

const mfboReadme = `# mfbo-framework

  A generalized multi-fidelity Bayesian optimization framework.

  Multi-fidelity optimization earns its complexity when the objective is
  expensive to evaluate: alongside the true function you sample cheap
  approximations, and let the model decide when a cheap look is good enough.

  Runs against four synthetic benchmarks — Forrester, Branin, Borehole and
  Hartmann — with EI, PI, UCB and KG acquisition functions, and either greedy
  or uncertainty-driven high-fidelity selection.

  Built for concurrent HPC experiments, so results stream to CSV with safe
  concurrent writes, and a new benchmark or acquisition strategy is a new
  module rather than an edit to the core.

  open this file to go to the repo.
`

const poketrackReadme = `# fleng-poketrack

  [TODO: what is this? The repo is JavaScript with no README, so there is
  nothing accurate to say about it yet.

  If it is not portfolio-worthy, delete this whole directory from
  src/fs/tree.ts — three strong projects beat four with a gap in them.]

  open this file to go to the repo.
`

function project(name: string, readme: string, stack: string): Dir {
  return {
    kind: 'dir',
    name,
    children: [
      {
        kind: 'file',
        name: 'README.md',
        body: readme,
        href: `https://github.com/jenduo/${name}`,
      },
      { kind: 'file', name: 'stack.txt', body: stack },
    ],
  }
}

export const root: Dir = {
  kind: 'dir',
  name: '',
  children: [
    { kind: 'file', name: 'about.txt', body: about },
    { kind: 'file', name: 'skills.txt', body: skills },
    { kind: 'file', name: 'contact.txt', body: contact },
    { kind: 'file', name: 'resume.pdf', body: resume },
    {
      kind: 'dir',
      name: 'experience',
      children: [{ kind: 'file', name: 'investorhub.md', body: investorhub }],
    },
    {
      kind: 'dir',
      name: 'projects',
      children: [
        project('asx-company-info', asxReadme, 'TypeScript · SQL · query-param state\n'),
        project('mfbo-framework', mfboReadme, 'Python · PyTorch · BoTorch · GPyTorch\n'),
        project('fleng-poketrack', poketrackReadme, 'JavaScript\n'),
      ],
    },
  ],
}
