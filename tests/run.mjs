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

let failed = 0
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
