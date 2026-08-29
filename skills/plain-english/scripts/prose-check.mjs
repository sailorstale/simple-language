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

const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules', 'tests'])

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
  let skipping = false
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i]
    if (inFront) {
      if (i > 0 && line.trim() === '---') inFront = false
      continue
    }
    if (line.trim().startsWith('```')) { inCode = !inCode; continue }
    if (inCode) continue
    // Markers for places where poor writing stands on purpose: a quote, an example, a critique.
    // Block: <!-- prose-check: off --> … <!-- prose-check: on -->
    if (/<!--\s*(prose-check|plain-english)\s*:\s*off\s*-->/i.test(line)) { skipping = true; continue }
    if (/<!--\s*(prose-check|plain-english)\s*:\s*on\s*-->/i.test(line)) { skipping = false; continue }
    if (skipping) continue
    // One line: <!-- prose-check: skip -->
    if (/<!--\s*(prose-check|plain-english)\s*:\s*skip\s*-->/i.test(line)) continue
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
  // Обратная кавычка и жирный текст тоже начинают предложение: "…contract. `Need to` marks…"
  for (const s of text.split(/(?<=[.!?])\s+(?=[A-Z"'(`*])/)) {
    const words = s.trim().split(/\s+/).filter(Boolean)
    if (words.length > 25)
      add(file, n, 'long', true, s, `${words.length} words in one sentence — split it (GOV.UK: check anything over 25)`)
  }
}

// Runs of ALL-CAPS words (shouting, hard to read). Single acronyms are fine.
// Три слова подряд заглавными — это крик; два подряд обычно название вроде W3C WAI.
const capsRe = /\b([A-Z][A-Z0-9]{2,}(?:[ \t]+[A-Z][A-Z0-9]{2,}){2,})\b/
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

// Google, tone: never call the reader's work easy — if it fails, the word blames them.
function checkEasy(file, { n, text }) {
  for (const w of rules['easy'] || []) {
    if (!phraseRe(w).test(text)) continue
    // After a negation the word means "merely", not "with little effort":
    // "a user does not simply have a role" says nothing about the reader's work.
    if (/\b(not|never|cannot|n't)\s+(\w+\s+){0,2}simply\b/i.test(text)) continue
    add(file, n, 'easy', true, text, `"${w}" states no fact — say how many steps or how long it takes`)
  }
}

// Microsoft bias-free, Google inclusive documentation.
function checkLoaded(file, { n, text }) {
  for (const [w, rep] of Object.entries(rules['loaded'] || {})) {
    if (phraseRe(w).test(text)) add(file, n, 'loaded', true, text, `"${w}" -> ${rep}`)
  }
}

// Federal PL Guidelines, GOV.UK: write Latin abbreviations out.
function checkLatin(file, { n, text }) {
  const low = text.toLowerCase()
  for (const [w, rep] of Object.entries(rules['latin'] || {})) {
    if (low.includes(w.toLowerCase())) add(file, n, 'latin', true, text, `"${w}" -> ${rep}`)
  }
}

// Google, tone: no exclamation marks, no "let's", no internet shorthand.
function checkChatty(file, { n, text, raw }) {
  if (raw.trim().startsWith('|')) return
  const low = text.toLowerCase()
  for (const w of rules['chatty'] || []) {
    if (low.includes(w)) add(file, n, 'chatty', true, text, `"${w.trim()}" — say it plainly; the reader acts alone`)
  }
  if (/!(\s|$)/.test(text) && !/^\s*[-*]?\s*!\[/.test(text))
    add(file, n, 'chatty', true, text, 'an exclamation mark adds pressure, not a fact')
}

// GOV.UK, Microsoft global communications: an idiom is lost on a reader in translation.
function checkIdioms(file, { n, text }) {
  if (!SHOW_ALL) return
  for (const w of rules['idioms'] || []) {
    if (text.toLowerCase().includes(w)) add(file, n, 'idiom', false, text, `"${w}" is an idiom — say the thing plainly`)
  }
}

// Federal PL Guidelines: a slash pushes the choice of meaning onto the reader.
function checkSlash(file, { n, text }) {
  const both = text.match(/\band\/or\b/i)
  if (both) {
    add(file, n, 'slash', true, both[0], 'write it out: "or", "and", or "X, Y, or both"')
    return
  }
  // A slash between two words is often a fixed pair the field already uses
  // (`home/away`, `Mon/Wed`), so it is a hint rather than a breach.
  if (!SHOW_ALL) return
  const pair = text.match(/(^|[^\w/.-])[A-Za-z]{3,}\/[A-Za-z]{3,}(?![\w/.-])/)
  if (pair) add(file, n, 'slash', false, pair[0], 'a slash asks the reader to pick the meaning — write the words out if this is prose')
}

// Google, dates and times: 12/02/2027 reads as two different days.
function checkDate(file, { n, text }) {
  const m = text.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})\b/)
  if (m && +m[1] <= 31 && +m[2] <= 12)
    add(file, n, 'date', true, m[0], 'spell the month: "19 January 2027", or use ISO YYYY-MM-DD for machines')
}

// Microsoft top-10 tips: an empty opener eats the most visible slot in the line.
function checkEmptyOpener(file, { n, text, raw }) {
  if (raw.trim().startsWith('#')) return
  // The rule is about an opener, so the phrase has to start a sentence: "there is"
  // inside a clause ("before there is a second club") is ordinary English.
  for (const [w, hint] of Object.entries(rules['empty-openers'] || {})) {
    if (!phraseRe(w).test(text)) continue
    if (/\bthere (is|are) (no|nothing|nobody)\b/i.test(text)) continue
    const opens = new RegExp(`(^|[.!?]\\s+|^\\s*[-*>]\\s*|\\*\\*\\s*)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (!opens.test(text.trim())) continue
    add(file, n, 'opener', true, text, `"${w}" — ${hint}`)
  }
}

// Microsoft global communications: more than two parts strung with and/or/but read heavily.
function checkConjunctions(file, { n, text, raw }) {
  if (raw.trim().startsWith('|') || raw.trim().startsWith('#')) return
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    const c = (s.match(/\s(and|or|but)\s/gi) || []).length
    if (c >= 3) add(file, n, 'conjunctions', true, s, `${c} conjunctions in one sentence — move the third part to its own sentence`)
  }
}

// A paragraph is scanned from its first word, so a connector there sends the reader back.
function checkParagraphStart(file, { n, raw }, prevBlank) {
  if (!prevBlank) return
  const t = raw.trim()
  if (!t || /^[#>|\-*\d]/.test(t)) return
  const first = t.replace(/^\*\*/, '').toLowerCase().match(/^[a-z]+/)
  if (first && (rules['paragraph-openers'] || []).includes(first[0]))
    add(file, n, 'para-opener', true, t, `a paragraph does not open with "${first[0]}" — put the meaningful word first`)
}

// Microsoft, writing for all abilities: a screen reader skips or misreads these signs.
function checkSpecialChars(file, { n, text, raw }) {
  if (raw.trim().startsWith('|') || raw.trim().startsWith('#')) return
  // Inside quotation marks the sign can be part of a name, so leave it alone.
  const outside = text.replace(/"[^"]*"/g, '""').replace(/«[^»]*»/g, '«»')
    .replace(/\*\*[^*]*\*\*/g, '**')
  // A screen reader always skips "&", so that one is strict. "+" and "~" read
  // fine in working notes, so they are advisory.
  const amp = outside.match(/\s(&)\s/)
  if (amp) {
    add(file, n, 'sign', true, text, 'replace "&" with the word "and": a screen reader skips the sign')
    return
  }
  if (!SHOW_ALL) return
  const other = outside.match(/\s([+~])\s/)
  if (other) add(file, n, 'sign', false, text, `replace "${other[1]}" with a word in prose: "plus", "about"`)
}

// GOV.UK: no full stops inside an abbreviation.
function checkAbbrDots(file, { n, text }) {
  const m = text.match(/(^|[^A-Za-z])(([A-Z]\.){2,})/)
  if (m) add(file, n, 'abbr', true, m[2], 'drop the stops inside an abbreviation: write it as solid capitals')
}

// NNG chunking: an unbroken run of digits cannot be read or checked at a glance.
function checkLongNumber(file, { n, text, raw }) {
  if (raw.trim().startsWith('|')) return
  const m = text.match(/(^|[^\d.,/:v-])(\d{6,})(?!\d|[.,:/-]\d)/)
  if (m) add(file, n, 'digits', true, m[2], 'group the digits: "4111 1111 1111 1111", not one unbroken run')
}

// GOV.UK: a hyphen in a range reads as a minus sign and a screen reader skips it.
function checkRange(file, { n, text, raw }) {
  if (raw.trim().startsWith('|') || raw.trim().startsWith('#')) return
  // A unit stuck to the number makes it a technical value ("12-14px"), where the
  // hyphen is the usual notation rather than prose.
  const m = text.match(/(^|[^\w-])(\d{1,4})\s?[-–]\s?(\d{1,4})(?![\d-])(?!(?:px|em|rem|pt|mm|cm|kg|ms|kb|mb|gb|dp|vh|vw)\b)/i)
  if (m) add(file, n, 'range', true, `${m[2]}-${m[3]}`, `write the range with a word: "${m[2]} to ${m[3]}"`)
}

// Federal PL Guidelines: readers get two negatives in one sentence wrong about half the time.
function checkDoubleNegative(file, { n, text }) {
  if (!SHOW_ALL) return
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    let c = (s.match(/\b(not|no|never|n't)\b/gi) || []).length
    for (const w of rules['hidden-negatives'] || []) if (phraseRe(w).test(s)) c++
    if (c >= 2) add(file, n, 'negatives', false, s, `${c} negatives in one sentence — fold them into one positive statement`)
  }
}

// Google, procedures: a numbered list carries a sequence, and one step has none.
function checkSingleStepList(file, lines) {
  let start = -1
  let count = 0
  const flush = () => {
    if (count === 1 && start >= 0)
      add(file, start, 'one-step', true, 'numbered list with a single item', 'a single step belongs in a bullet or a paragraph')
    start = -1
    count = 0
  }
  for (const { n, raw } of lines) {
    const t = raw.trim()
    if (/^\d+[.)]\s/.test(t)) {
      if (start < 0) start = n
      count++
    } else if (t.startsWith('#')) {
      flush()
    }
  }
  flush()
}

// Is this an English document? Count letters: a Russian file is mostly Cyrillic.
function isEnglish(lines) {
  let cyr = 0
  let lat = 0
  for (const { text } of lines) {
    cyr += (text.match(/[А-Яа-яёЁ]/g) || []).length
    lat += (text.match(/[A-Za-z]/g) || []).length
  }
  return lat >= cyr
}

// SKILL.md, "Cut intensifiers and filler": these strengthen an opinion and add no
// checkable fact, and readers skip them.
function checkIntensifiers(file, { n, text, raw }) {
  if (raw.trim().startsWith('#')) return
  for (const w of rules['intensifiers'] || []) {
    if (!phraseRe(w).test(text)) continue
    // "really a paragraph" and "really was" mean "in fact", not "to a high degree".
    if (/\breally\s+(a|an|the|was|were|is|are|do|does|did)\b/i.test(text)) continue
    add(file, n, 'intensifier', true, text, `"${w}" adds no fact — put a number, an action, or a comparison there`)
  }
}

// SKILL.md: a list shows that several equal things belong together, so a list of
// one item is a paragraph. The numbered case is checked separately; this is bullets.
function checkSingleBullet(file, lines) {
  let start = -1
  let count = 0
  let onlyLink = false
  const flush = () => {
    if (count === 1 && start >= 0 && !onlyLink)
      add(file, start, 'one-bullet', true, 'bulleted list with a single item', 'a list of one item does not exist — make it a paragraph')
    start = -1
    count = 0
    onlyLink = false
  }
  for (const { n, raw } of lines) {
    const t = raw.trim()
    if (/^[-*]\s/.test(t) && !/^\s/.test(raw)) {
      if (start < 0) start = n
      count++
      // Пункт-ссылка целиком — это строка оглавления, а не список из одного пункта.
      if (/^[-*]\s*\[[^\]]+\]\([^)]*\)\s*$/.test(t)) onlyLink = true
    } else if (t === '' || /^\s/.test(raw)) {
      // a blank line or a nested sub-item does not break the list
    } else {
      flush()
    }
  }
  flush()
}

// Headings: do not skip levels (Google, W3C WAI), and two headings in a row with no
// text between them is a mistake. Both checks are purely structural.
function checkHeadings(file) {
  // Читаем файл целиком: readLines выбрасывает примеры, код и помеченные куски,
  // и без них два заголовка кажутся идущими подряд.
  let raws
  try {
    raws = readFileSync(join(ROOT, file), 'utf8').split('\n')
  } catch {
    return
  }
  const lines = raws.map((raw, i) => ({ n: i + 1, raw }))
  let prevLevel = 0
  let topLevel = 0
  let prevHeading = null
  let sawText = false
  for (const { n, raw } of lines) {
    const m = raw.match(/^(#{1,6})\s+(.*)$/)
    if (!m) {
      if (raw.trim()) sawText = true
      continue
    }
    const level = m[1].length
    if (prevHeading && !sawText)
      add(file, n, 'headings', true, m[2], 'two headings in a row with no text between them — either the subheading has no job or they repeat each other')
    if (prevLevel && level > prevLevel + 1)
      add(file, n, 'headings', true, m[2], `heading level skipped: ${'#'.repeat(level)} follows ${'#'.repeat(prevLevel)}`)
    if (level === 1) {
      topLevel++
      if (topLevel > 1)
        add(file, n, 'headings', true, m[2], 'a document has one top-level heading — its title')
    }
    if (/[.,;]$/.test(m[2].trim()))
      add(file, n, 'headings', true, m[2], 'a heading does not end with a period; a question mark is fine where the sense needs it')
    prevLevel = level
    prevHeading = m[2]
    sawText = false
  }
}

// Formatting: a paragraph runs three to seven lines (Microsoft); past that it is a wall.
// Counted on raw lines, since a Markdown paragraph is one line between blanks.
function checkParagraphLength(file) {
  let raws
  try {
    raws = readFileSync(join(ROOT, file), 'utf8').split('\n')
  } catch {
    return
  }
  let inCode = false
  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i]
    if (raw.trim().startsWith('```')) { inCode = !inCode; continue }
    if (inCode) continue
    const t = raw.trim()
    if (!t || /^[#>|\-*\d]/.test(t) || /[🚫✅❌]/.test(t)) continue
    const sentences = clean(t).split(/(?<=[.!?])\s+(?=[A-Z"'(`*])/).filter((s) => s.trim().length > 3)
    if (sentences.length > 5)
      add(file, i + 1, 'paragraph', true, t, `${sentences.length} sentences in one paragraph — split it into two or three`)
  }
}

// Link text: keep it to about four words, and give different destinations different
// text, since a reader takes two links worded alike to lead to the same place.
function checkLinkQuality(file) {
  let raws
  try {
    raws = readFileSync(join(ROOT, file), 'utf8').split('\n')
  } catch {
    return
  }
  const seen = new Map()
  raws.forEach((raw, i) => {
    // A bullet that is nothing but a link is a table-of-contents line, where the
    // label repeats a section title and is long for a reason.
    const tocLine = /^\s*(?:[-*]|\d+[.)])\s*\[[^\]]+\]\([^)]*\)\s*$/.test(raw)
    const re = /(^|[^!])\[([^\]]+)\]\(([^)]*)\)/g
    let m
    while ((m = re.exec(raw))) {
      const label = m[2].trim()
      const target = m[3].trim()
      const words = tocLine ? 0 : label.split(/\s+/).filter(Boolean).length
      if (words > 8)
        add(file, i + 1, 'link-quality', true, label, `link text of ${words} words — keep it to about four so it reads at a glance`)
      const key = label.toLowerCase()
      const before = seen.get(key)
      if (before && before !== target)
        add(file, i + 1, 'link-quality', true, label, 'the same link text points at two different pages — a reader takes them for one')
      else if (!before) seen.set(key, target)
    }
  })
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
  const lines = readLines(file)
  // Sweeping the whole project, skip a file in another language: Russian prose
  // follows its own norms, and this check would only raise false alarms there.
  if (!paths.length && !isEnglish(lines)) continue
  let prevBlank = true
  for (const line of lines) {
    checkFormal(file, line)
    checkHidden(file, line)
    checkLinkText(file, line)
    checkLong(file, line)
    checkCaps(file, line)
    checkPassive(file, line)
    checkHype(file, line)
    checkEasy(file, line)
    checkLoaded(file, line)
    checkLatin(file, line)
    checkChatty(file, line)
    checkIdioms(file, line)
    checkIntensifiers(file, line)
    checkSlash(file, line)
    checkDate(file, line)
    checkEmptyOpener(file, line)
    checkConjunctions(file, line)
    checkParagraphStart(file, line, prevBlank)
    checkSpecialChars(file, line)
    checkAbbrDots(file, line)
    checkLongNumber(file, line)
    checkRange(file, line)
    checkDoubleNegative(file, line)
    prevBlank = line.raw.trim() === ''
  }
  checkSingleStepList(file, lines)
  checkSingleBullet(file, lines)
  checkHeadings(file)
  checkParagraphLength(file)
  checkLinkQuality(file)
}

// ── Report ───────────────────────────────────────────────────────────────────

const NAMES = {
  formal: 'Formal or long word (use a plain one)',
  hidden: 'Hidden verb (nominalization)',
  link: 'Empty link text ("here", "click here")',
  'link-quality': 'Link text too long or repeated',
  long: 'Sentence over 25 words',
  caps: 'ALL-CAPS run',
  passive: 'Possible passive voice (advisory)',
  hype: 'Subjective / hype adjective (advisory)',
  easy: "The reader's work called easy",
  loaded: 'Biased or imprecise term',
  latin: 'Latin abbreviation instead of words',
  chatty: 'Exclamation mark, "let\'s", or shorthand',
  slash: 'Slash instead of a word',
  date: 'All-digit date reads two ways',
  opener: 'Empty opener instead of the action',
  conjunctions: 'Three or more conjunctions in a sentence',
  'para-opener': 'Paragraph opens with a connector',
  sign: 'Sign instead of a word',
  abbr: 'Full stops inside an abbreviation',
  digits: 'Long number not grouped',
  range: 'Range written with a hyphen',
  negatives: 'Double negative (advisory)',
  'one-step': 'Numbered list with a single item',
  'one-bullet': 'List with a single item',
  headings: 'Heading structure mistake',
  paragraph: 'Paragraph too long',
  idiom: 'Idiom or cultural reference (advisory)',
  intensifier: 'Intensifier with no fact',
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
    if (!items[0].strict && !SHOW_ALL) {
      console.log('    (advisory — run with --all to see the places)')
      continue
    }
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
