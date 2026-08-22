#!/usr/bin/env node
// Проверяет наши документы на нарушения свода «Пиши просто.md».
//
// Зачем это нужно. Правила Claude знает и всё равно их нарушает: образы и обрубленные
// фразы на глаз выглядят складно, а вслух звучат плохо. Глаз их пропускает, поиск — нет.
//
// Проверка ничего не чинит. Она только показывает места и говорит, что с ними не так.
// Решает всегда человек: часть находок — ложная тревога, и это нормально.
//
//   node .claude/scripts/prose-check.mjs                    — проверить все наши документы
//   node .claude/scripts/prose-check.mjs путь/к/файлу.md    — проверить один файл или несколько
//   node .claude/scripts/prose-check.mjs --строго           — вернуть ошибку, если есть строгие находки
//   node .claude/scripts/prose-check.mjs --всё              — показать и подозрения тоже
//
// Список слов лежит рядом: prose-rules.json. Его пополняют руками.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const ROOT = BASE
const args = process.argv.slice(2)
const STRICT = args.includes('--строго') || args.includes('--strict')
const SHOW_ALL = args.includes('--всё') || args.includes('--all')
const paths = args.filter((a) => !a.startsWith('--'))

// Файл правил ищем сначала рядом со скриптом (бандл в скиле), потом по проектному пути.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const rulesPath = existsSync(join(SCRIPT_DIR, 'prose-rules.json'))
  ? join(SCRIPT_DIR, 'prose-rules.json')
  : join(BASE, '.claude/scripts/prose-rules.json')
const rules = JSON.parse(readFileSync(rulesPath, 'utf8'))

// Где лежат документы, которые мы пишем сами. Код, служебные папки и сам файл
// правил (в нём нарочно есть примеры «плохо») из проверки исключаем.
const SKIP_DIRS = new Set(['.git', '.claude', '.claude-sessions', '.playwright-mcp', 'data', 'node_modules', 'wiki/raw'])
const SKIP_FILES = new Set(['Пиши просто.md'])

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
    } else if (e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) {
      out.push(rel)
    }
  }
  return out
}

function targets() {
  if (paths.length) return paths.map((p) => relative(ROOT, resolve(process.cwd(), p)))
  // Все документы: корень проекта + папка wiki (рекурсивно).
  const out = []
  for (const e of readdirSync(ROOT, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isFile() && e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) out.push(e.name)
  }
  collect('wiki', out)
  return out
}

// ── Подготовка текста ───────────────────────────────────────────────────────
// Из проверки убираем то, к чему свод не относится: шапку файла, куски кода,
// адреса ссылок и текст в обратных кавычках. Иначе половина находок будет из URL.

function clean(line) {
  return line
    .replace(/\]\([^)]*\)/g, ']()')      // адрес ссылки
    .replace(/`[^`]*`/g, '`код`')        // код в строке
    .replace(/https?:\/\/\S+/g, 'ссылка')
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
    out.push({ n: i + 1, text: clean(line), raw: line })
  }
  return out
}

// ── Правила ─────────────────────────────────────────────────────────────────

const findings = []
const add = (file, n, rule, strict, fragment, hint) =>
  findings.push({ file, n, rule, strict, fragment: fragment.trim().slice(0, 110), hint })

const wordRe = (w) => new RegExp(`(^|[^А-Яа-яёЁA-Za-z-])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^А-Яа-яёЁA-Za-z-]|$)`, 'i')

function checkWords(file, { n, text }) {
  for (const w of rules['образы']) {
    if (wordRe(w).test(text)) add(file, n, 'образ', true, text, `слово «${w}» — образ, напиши буквально, что происходит`)
  }
  for (const [w, replace] of Object.entries(rules['жаргон'])) {
    if (wordRe(w).test(text)) add(file, n, 'жаргон', true, text, `«${w}» → ${replace}`)
  }
  if (SHOW_ALL) {
    for (const w of rules['образы-подозрение']) {
      if (wordRe(w).test(text)) add(file, n, 'подозрение', false, text, `«${w}» бывает образом — посмотри глазами`)
    }
  }
}

function checkLinks(file, { n, text }) {
  // Свод: «не строй фразы через "не X, а Y"».
  const m = text.match(/[^.!?]*,\s+(а|но)\s+не\s+[^.!?]*/i) || text.match(/\bне\s+[^,.!?]{2,40},\s+а\s+[^.!?]*/i)
  if (m) add(file, n, 'связка', true, m[0], 'разверни в два предложения: сначала что верно, потом что неверно')
}

// Свод 6и: текст ссылки должен называть, куда она ведёт.
// Ловим ссылки, у которых весь видимый текст — пустое слово вроде «здесь» или «подробнее».
// Работаем по raw: картинки (![alt](url)) исключаем, у них [alt] это не текст ссылки.
const emptyLinks = new Set((rules['ссылки-пустые'] || []).map((w) => w.toLowerCase()))
function checkLinkText(file, { n, raw }) {
  const re = /(^|[^!])\[([^\]]+)\]\(/g
  let m
  while ((m = re.exec(raw))) {
    const label = m[2].trim().toLowerCase().replace(/[.,;:!?»«"'`()]/g, '').trim()
    if (emptyLinks.has(label))
      add(file, n, 'ссылка-текст', true, m[2], `текст ссылки «${m[2].trim()}» ничего не говорит о цели — назови, куда она ведёт`)
  }
}

// Похоже ли слово на глагол. Точного разбора русского тут нет и не нужно:
// достаточно понять, есть ли справа от тире хоть какое-то действие.
const VERBISH = /(ть|ться|ет|ёт|ит|ут|ют|ат|ят|ся|ешь|ишь|ем|им|ете|ите|ал|ял|ил|ел|ала|яла|ила|ела|ало|ело|али|яли|или|ели|нет|есть|был|была|было|были|будет|будут|может|могут|надо|нужно|стоит)$/i
// Повелительное наклонение по окончанию не ловится, поэтому частые формы перечислены.
const ORDERS = new Set(['поясни', 'разбей', 'добавь', 'убери', 'ставь', 'пиши', 'сделай', 'возьми',
  'скажи', 'проверь', 'смотри', 'читай', 'собери', 'напиши', 'спроси', 'сначала', 'бери', 'дай'])
const hasVerb = (s) => s.split(/[\s,;:()«»"]+/).filter(Boolean)
  .some((w) => VERBISH.test(w) || ORDERS.has(w.toLowerCase()))

function checkStubs(file, { n, text, raw }) {
  const t = raw.trim()
  if (t.startsWith('|')) return          // таблицы живут по своим правилам
  if (t.startsWith('>')) return          // цитаты и примеры внутри свода правил
  if (/[🚫✅❌]/.test(t)) return          // строки-примеры «плохо / хорошо»
  const cyr = (text.match(/[А-Яа-яёЁ]/g) || []).length
  const lat = (text.match(/[A-Za-z]/g) || []).length
  if (lat > cyr) return                  // английский текст свод не проверяет
  // Тире вместо сказуемого: короткое подлежащее, тире, дальше строчная буква.
  // «— это» пропускаем: в русском это нормальная связка, а не пропущенный глагол.
  const dash = text.match(/(^|[.!?]\s|\*\*)([А-ЯЁ][^.!?—|]{2,45})\s+—\s+([а-яё][^.!?]{0,80})/)
  if (dash && !/^—\s+это\b/.test(dash[0].slice(dash[0].indexOf('—'))) && !hasVerb(dash[3]))
    add(file, n, 'обрубок', true, dash[0], 'поставь глагол вместо тире: «X это Y» или «X делает Y»')
  // Двоеточие вместо сказуемого в короткой фразе.
  const colon = text.match(/(^|[.!?]\s)([А-ЯЁ][а-яё]{2,20}):\s+([а-яё][^.!?]{0,45})\./)
  if (colon) add(file, n, 'обрубок', true, colon[0], 'разверни в законченное предложение с подлежащим и сказуемым')
}

function checkLong(file, { n, text, raw }) {
  if (raw.trim().startsWith('|') || raw.trim().startsWith('#')) return
  // Точка перед закрывающим жирным шрифтом («**Зачин.** Дальше текст») тоже кончает предложение.
  for (const s of text.replace(/([.!?…])\*\*/g, '$1** ').split(/(?<=[.!?…])(?:\*\*)?\s+/)) {
    const words = s.trim().split(/\s+/).filter(Boolean)
    if (words.length > 30) add(file, n, 'длинно', true, s, `${words.length} слов в одном предложении — разбей на два-три`)
    const which = (s.match(/котор[а-яё]+/gi) || []).length
    if (which >= 2) add(file, n, 'длинно', true, s, 'два «который» в одном предложении — переставь части')
  }
}

function checkPercent(file, { n, text }) {
  const m = text.match(/\d+([.,]\d+)?\s*%/)
  if (m) add(file, n, 'проценты', true, m[0], 'свод просит доли: «4 из 10» вместо «39%»')
}

function checkList(file, { n, text, raw }) {
  const t = raw.trim()
  if (!/^[-*]\s|^\d+\.\s/.test(t)) return
  const body = t.replace(/^[-*]\s|^\d+\.\s/, '')
  if (/\b(поэтому|потому что|но |а значит|сначала|затем|после этого)\b/i.test(body))
    add(file, n, 'список', true, body, 'между пунктами есть связь — это был абзац, собери обратно в текст')
  const sentences = body.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 3)
  if (sentences.length > 1)
    add(file, n, 'список', true, body, 'пункт не помещается в одно предложение — это был абзац')
}

// ── Прогон ──────────────────────────────────────────────────────────────────

const files = targets()
for (const file of files) {
  if (!existsSync(join(ROOT, file))) { console.log(`не нашёл файл: ${file}`); continue }
  for (const line of readLines(file)) {
    checkWords(file, line)
    checkLinks(file, line)
    checkLinkText(file, line)
    checkStubs(file, line)
    checkLong(file, line)
    checkPercent(file, line)
    checkList(file, line)
  }
}

// ── Отчёт ───────────────────────────────────────────────────────────────────

const NAMES = {
  образ: 'Образы и метафоры',
  жаргон: 'Жаргон без пояснения',
  связка: 'Запрещённая связка «не X, а Y»',
  'ссылка-текст': 'Пустой текст ссылки («здесь», «тут»)',
  обрубок: 'Обрубленная фраза без глагола',
  длинно: 'Слишком длинное предложение',
  проценты: 'Проценты вместо долей',
  список: 'Список, который был абзацем',
  подозрение: 'Возможный образ (проверь глазами)',
}

const byFile = new Map()
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, [])
  byFile.get(f.file).push(f)
}

if (!findings.length) {
  console.log(`Проверено файлов: ${files.length}. Нарушений не нашёл.`)
  process.exit(0)
}

for (const [file, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${file} — находок: ${list.length}`)
  const byRule = new Map()
  for (const f of list) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, [])
    byRule.get(f.rule).push(f)
  }
  for (const [rule, items] of byRule) {
    console.log(`\n  ${NAMES[rule] || rule} — ${items.length}`)
    for (const f of items.slice(0, 12)) {
      console.log(`    строка ${f.n}: ${f.fragment}`)
      console.log(`      ↳ ${f.hint}`)
    }
    if (items.length > 12) console.log(`    …и ещё ${items.length - 12}`)
  }
}

const counts = new Map()
for (const f of findings) counts.set(f.rule, (counts.get(f.rule) || 0) + 1)
console.log('\n' + '─'.repeat(60))
console.log(`Проверено файлов: ${files.length}. Всего находок: ${findings.length}.`)
for (const [rule, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${NAMES[rule] || rule}`)
}
console.log('\nПроверка ничего не чинит и не всегда права. Решает человек.')

if (STRICT && findings.some((f) => f.strict)) process.exit(1)
