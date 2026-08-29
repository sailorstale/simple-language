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

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

// Установка и удаление: ставим набор в песочницу, смотрим файлы и настройки,
// потом убираем и проверяем, что чужие записи целы, а наши ушли.
function checkInstall() {
  const box = join(tmpdir(), `simple-language-test-${process.pid}`)
  const settings = join(box, '.claude', 'settings.json')
  const problems = []
  try {
    rmSync(box, { recursive: true, force: true })
    mkdirSync(join(box, '.claude'), { recursive: true })
    writeFileSync(settings, JSON.stringify({
      model: 'opus',
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'chuzhoy.sh' }] }] },
    }))
    execFileSync('bash', [join(ROOT, 'install.sh')], {
      input: '3\n1\n1\n', encoding: 'utf8', env: { ...process.env, HOME: box },
    })
    for (const f of ['skills/pishi-prosto/SKILL.md', 'skills/plain-english/SKILL.md',
                     'hooks/write-simply-reminder.sh', 'hooks/check-prose-on-write.sh']) {
      if (!existsSync(join(box, '.claude', f))) problems.push(`после установки нет файла ${f}`)
    }
    const after = JSON.parse(readFileSync(settings, 'utf8'))
    if (after.model !== 'opus') problems.push('установка затёрла чужие настройки')
    if (!after.hooks?.SessionStart) problems.push('установка убрала чужой хук')
    if (!after.hooks?.UserPromptSubmit) problems.push('установка не подключила напоминание')

    execFileSync('bash', [join(ROOT, 'uninstall.sh')], {
      encoding: 'utf8', env: { ...process.env, HOME: box },
    })
    if (existsSync(join(box, '.claude', 'skills', 'pishi-prosto'))) problems.push('удаление оставило скил')
    const cleaned = JSON.parse(readFileSync(settings, 'utf8'))
    if (cleaned.model !== 'opus') problems.push('удаление затёрло чужие настройки')
    if (!cleaned.hooks?.SessionStart) problems.push('удаление убрало чужой хук')
    if (cleaned.hooks?.UserPromptSubmit) problems.push('удаление оставило наш хук в настройках')
  } catch (e) {
    problems.push(`не отработало: ${e.message.split('\n')[0]}`)
  } finally {
    rmSync(box, { recursive: true, force: true })
  }
  if (problems.length) {
    console.log('✗ установка и удаление')
    for (const p of problems) console.log(`    ${p}`)
    return false
  }
  console.log('✓ установка и удаление — файлы на месте, чужие настройки целы')
  return true
}

let failed = 0
if (!checkInstall()) failed++
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
