#!/usr/bin/env node
// Проверяет, что обе программы находят ровно то, что от них ждут.
//
// Зачем это нужно. Образцы поиска легко сломать незаметно: правишь одно правило,
// а перестаёт срабатывать соседнее. Тест держит ожидаемый список находок рядом
// с файлами-образцами и падает, как только результат разошёлся с ним.
//
//   node tests/run.mjs
//
// Ожидания лежат в tests/expected.json и правятся руками вместе с правилами.

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const expected = JSON.parse(readFileSync(join(HERE, 'expected.json'), 'utf8'))

const CHECKERS = {
  ru: join(ROOT, 'skills/pishi-prosto/scripts/prose-check.mjs'),
  en: join(ROOT, 'skills/plain-english/scripts/prose-check.mjs'),
}

// Из отчёта берём итоговую сводку: строки вида «     3  Название правила».
function summary(out) {
  const tail = out.split('─'.repeat(60)).pop() || ''
  const counts = {}
  for (const line of tail.split('\n')) {
    const m = line.match(/^\s+(\d+)\s{2}(.+?)\s*$/)
    if (m) counts[m[2]] = Number(m[1])
  }
  return counts
}

function run(lang, file, flags = []) {
  try {
    return execFileSync('node', [CHECKERS[lang], ...flags, join(HERE, 'fixtures', file)], { encoding: 'utf8' })
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '')
  }
}

// Хук читает отчёт проверки и пересобирает его для Claude. Формат отчёта и его
// разбор живут в разных файлах, поэтому правка одного молча ломает другой.
function checkHook() {
  const fixture = join(HERE, 'fixtures', 'ru-narusheniya.md')
  const input = JSON.stringify({ tool_name: 'Write', tool_input: { file_path: fixture } })
  let out
  try {
    out = execFileSync('bash', [join(ROOT, 'hooks', 'check-prose-on-write.sh')], { input, encoding: 'utf8' })
  } catch {
    console.log('✗ хук проверки — не запустился')
    return false
  }
  if (!out.trim()) {
    console.log('✗ хук проверки — промолчал на файле с нарушениями')
    return false
  }
  const hints = (JSON.parse(out).hookSpecificOutput.additionalContext.match(/↳/g) || []).length
  const report = execFileSync('node', [CHECKERS.ru, fixture], { encoding: 'utf8' })
  const total = (report.match(/↳/g) || []).length
  if (hints !== total) {
    console.log(`✗ хук проверки — показал ${hints} подсказок из ${total}`)
    return false
  }
  console.log(`✓ хук проверки — показал все ${hints} подсказок`)
  return true
}

// Хук напоминания: первый ход даёт полный свод, дальше короткое напоминание,
// а служебные сообщения не получают ничего.
function checkReminder() {
  const dir = join(ROOT, 'hooks', 'write-simply-reminder.sh')
  const session = `test-${process.pid}`
  const call = (prompt) => {
    const out = execFileSync('bash', [dir], {
      input: JSON.stringify({ session_id: session, prompt }),
      encoding: 'utf8',
    }).trim()
    return out ? JSON.parse(out).hookSpecificOutput.additionalContext.length : 0
  }
  const first = call('напиши документ')
  const second = call('поправь второй раздел')
  const service = call('да')
  const problems = []
  if (first < 1000) problems.push(`первый ход дал ${first} знаков вместо полного свода`)
  if (second < 200 || second > 600) problems.push(`второй ход дал ${second} знаков вместо короткого напоминания`)
  if (service !== 0) problems.push(`служебное сообщение получило ${service} знаков вместо тишины`)
  if (problems.length) {
    console.log('✗ хук напоминания')
    for (const p of problems) console.log(`    ${p}`)
    return false
  }
  console.log(`✓ хук напоминания — полный свод ${first}, короткое ${second}, служебное молчит`)
  return true
}

let failed = 0
if (!checkHook()) failed++
if (!checkReminder()) failed++
for (const [file, spec] of Object.entries(expected)) {
  const out = run(spec.lang, file, spec.flags || [])
  const got = summary(out)
  const want = spec.findings
  const names = new Set([...Object.keys(want), ...Object.keys(got)])
  const bad = []
  for (const name of names) {
    if ((want[name] || 0) !== (got[name] || 0)) bad.push(`${name}: жду ${want[name] || 0}, получил ${got[name] || 0}`)
  }
  if (bad.length) {
    failed++
    console.log(`✗ ${file}`)
    for (const b of bad) console.log(`    ${b}`)
  } else {
    const total = Object.values(want).reduce((a, b) => a + b, 0)
    console.log(`✓ ${file} — находок ${total}, как и ждали`)
  }
}

console.log('')
if (failed) {
  console.log(`Расхождений: ${failed}. Либо правило сломалось, либо надо обновить tests/expected.json.`)
  process.exit(1)
}
console.log('Все проверки сошлись с ожиданиями.')
