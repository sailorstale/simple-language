#!/usr/bin/env node
// Checks English documents against the "plain-english" skill.
//
// Why this exists. The model knows the rules and still breaks them: a passive
// sentence or a formal word looks fine at a glance. The eye slides over them; a
// search does not.
//
// The check fixes nothing. It only shows the spots and says what is wrong. A
// person always decides — some findings are false alarms, and that is normal.
//
//   node prose-check.mjs                  — check every .md under the project
//   node prose-check.mjs path/to/file.md  — check one file or several
//   node prose-check.mjs --strict         — exit 1 if there are strict findings
//   node prose-check.mjs --all            — also show advisories (passive, hype)
//
// Word lists live next to this file in prose-rules.json and are edited by hand.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const ROOT = BASE
const args = process.argv.slice(2)
const STRICT = args.includes('--strict')
const SHOW_ALL = args.includes('--all')
const paths = args.filter((a) => !a.startsWith('--'))

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const rulesPath = existsSync(join(SCRIPT_DIR, 'prose-rules.json'))
  ? join(SCRIPT_DIR, 'prose-rules.json')
  : join(BASE, '.claude/scripts/prose-rules.json')
const rules = JSON.parse(readFileSync(rulesPath, 'utf8'))

const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules'])

function collect(dir, out = []) {
  let entries
  try {
    entries = readdirSync(join(ROOT, dir), { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = dir ? join(dir, e.name) : e.name
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(e.name)) continue
      collect(rel, out)
    } else if (e.name.endsWith('.md')) {
      out.push(rel)
    }
  }
  return out
}

function targets() {
  if (paths.length) return paths.map((p) => relative(ROOT, resolve(process.cwd(), p)))
  return collect('')
}

// ── Prepare text ─────────────────────────────────────────────────────────────
// Strip what the rules do not cover: the file's front matter, code blocks, link
// targets, and text in backticks. Otherwise half the findings come from URLs.

function clean(line) {
  return line
    .replace(/\]\([^)]*\)/g, ']()') // link target
    .replace(/`[^`]*`/g, '`code`') // inline code
    .replace(/https?:\/\/\S+/g, 'link')
}

function readLines(file) {
  const raw = readFileSync(join(ROOT, file), 'utf8').split('\n')
  const out = []
  let inCode = false
  let inFront = raw[0]?.trim() === '---'
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i]
    if (inFront) {
      if (i > 0 && line.trim() === '---') inFront = false
      continue
    }
    if (line.trim().startsWith('```')) { inCode = !inCode; continue }
    if (inCode) continue
    if (/[🚫✅❌]/.test(line)) continue // intentional "poor / better" example lines
    out.push({ n: i + 1, text: clean(line), raw: line })
  }
  return out
}

// ── Rules ────────────────────────────────────────────────────────────────────

const findings = []
const add = (file, n, rule, strict, fragment, hint) =>
  findings.push({ file, n, rule, strict, fragment: fragment.trim().slice(0, 110), hint })

const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const phraseRe = (w) => new RegExp(`(^|[^A-Za-z-])(${esc(w)})([^A-Za-z-]|$)`, 'i')

function checkFormal(file, { n, text }) {
  for (const [w, rep] of Object.entries(rules['formal'])) {
    if (phraseRe(w).test(text)) add(file, n, 'formal', true, text, `"${w}" -> ${rep}`)
  }
}

function checkHidden(file, { n, text }) {
  for (const [w, rep] of Object.entries(rules['hidden-verbs'])) {
    if (phraseRe(w).test(text)) add(file, n, 'hidden', true, text, `"${w}" -> ${rep}`)
  }
}

// Plain-english: link text must name where it goes, not "here" or a bare URL.
const emptyLinks = new Set((rules['empty-links'] || []).map((w) => w.toLowerCase()))
function checkLinkText(file, { n, raw }) {
  const re = /(^|[^!])\[([^\]]+)\]\(/g
  let m
  while ((m = re.exec(raw))) {
    const shown = m[2].trim()
    const label = shown.toLowerCase().replace(/[.,;:!?"'`()]/g, '').trim()
    if (emptyLinks.has(label) || /^https?:\/\//i.test(shown))
      add(file, n, 'link', true, shown, `link text "${shown}" says nothing about the target — name the destination`)
  }
}

// Sentence over 25 words (GOV.UK threshold).
function checkLong(file, { n, text, raw }) {
  const t = raw.trim()
  if (t.startsWith('|') || t.startsWith('#')) return
  for (const s of text.split(/(?<=[.!?])\s+(?=[A-Z"'(])/)) {
    const words = s.trim().split(/\s+/).filter(Boolean)
    if (words.length > 25)
      add(file, n, 'long', true, s, `${words.length} words in one sentence — split it (GOV.UK: check anything over 25)`)
  }
}

// Runs of ALL-CAPS words (shouting, hard to read). Single acronyms are fine.
const capsRe = /\b([A-Z][A-Z0-9]{2,}(?:[ \t]+[A-Z][A-Z0-9]{2,})+)\b/
function checkCaps(file, { n, text }) {
  const m = text.match(capsRe)
  if (m) add(file, n, 'caps', true, m[1], 'a run of ALL-CAPS text reads as shouting and is hard to read')
}

// Advisory: possible passive voice. Noisy, so shown but never fails --strict.
const PARTICIPLE =
  '(?:\\w+ed|written|done|made|given|taken|shown|held|built|known|seen|found|kept|sent|left|put|set|read|told|brought|thought|caught|taught|bought|paid|met|won|lost|drawn|grown|chosen|driven|broken|spoken|beaten|hidden)'
const passiveRe = new RegExp(`\\b(is|are|was|were|be|been|being|gets|got)\\s+(?:\\w+ly\\s+)?${PARTICIPLE}\\b`, 'i')
function checkPassive(file, { n, text }) {
  const m = text.match(passiveRe)
  if (m) add(file, n, 'passive', false, m[0], 'possible passive voice — name the actor and use the active verb')
}

// Advisory (--all): subjective / hype adjectives.
function checkHype(file, { n, text }) {
  if (!SHOW_ALL) return
  for (const w of rules['hype'] || []) {
    if (phraseRe(w).test(text)) add(file, n, 'hype', false, text, `"${w}" is a subjective adjective — replace it with a fact`)
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

const files = targets()
let missing = 0
for (const file of files) {
  if (!existsSync(join(ROOT, file))) {
    console.error(`file not found: ${file}`)
    missing++
    continue
  }
  for (const line of readLines(file)) {
    checkFormal(file, line)
    checkHidden(file, line)
    checkLinkText(file, line)
    checkLong(file, line)
    checkCaps(file, line)
    checkPassive(file, line)
    checkHype(file, line)
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const NAMES = {
  formal: 'Formal or long word (use a plain one)',
  hidden: 'Hidden verb (nominalization)',
  link: 'Empty link text ("here", "click here")',
  long: 'Sentence over 25 words',
  caps: 'ALL-CAPS run',
  passive: 'Possible passive voice (advisory)',
  hype: 'Subjective / hype adjective (advisory)',
}

const byFile = new Map()
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, [])
  byFile.get(f.file).push(f)
}

const checked = files.length - missing

if (missing) {
  console.error(`\nMissing files: ${missing}. The check is INCOMPLETE — do not treat it as passed.`)
}

if (!findings.length) {
  if (missing) process.exit(2)
  console.log(`Checked ${checked} file(s). No findings.`)
  process.exit(0)
}

for (const [file, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${file} — ${list.length} finding(s)`)
  const byRule = new Map()
  for (const f of list) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, [])
    byRule.get(f.rule).push(f)
  }
  for (const [rule, items] of byRule) {
    console.log(`\n  ${NAMES[rule] || rule} — ${items.length}`)
    for (const f of items.slice(0, 12)) {
      console.log(`    line ${f.n}: ${f.fragment}`)
      console.log(`      -> ${f.hint}`)
    }
    if (items.length > 12) console.log(`    …and ${items.length - 12} more`)
  }
}

const counts = new Map()
for (const f of findings) counts.set(f.rule, (counts.get(f.rule) || 0) + 1)
console.log('\n' + '─'.repeat(60))
console.log(`Checked ${checked} file(s). ${findings.length} finding(s).`)
for (const [rule, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${NAMES[rule] || rule}`)
}
console.log('\nThe check fixes nothing and is not always right. A person decides.')

if (STRICT && findings.some((f) => f.strict)) process.exit(1)
