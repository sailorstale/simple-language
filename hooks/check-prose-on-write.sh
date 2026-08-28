#!/bin/bash
# Проверка текста сразу после записи документа.
# Вставляется в контекст модели через PostToolUse → additionalContext.
#
# Устройство. Проверка запускается руками, а руками её никто не запускает: автор
# своих ошибок не видит и про команду не вспоминает. Этот хук ловит момент, когда
# Claude записал файл .md, сам прогоняет проверку нужного языка и отдаёт находки
# обратно Claude. Дальше Claude чинит их, не дожидаясь просьбы.
#
# Язык выбирается по самому тексту: больше кириллицы — русская проверка, иначе
# английская. Если скила нет, node не установлен или находок нет, хук молчит.
#
# Настройки через переменные окружения:
#   SIMPLE_LANGUAGE_CHECK=off  — не проверять ничего

SL_INPUT=$(cat)
export SL_INPUT

[ "${SIMPLE_LANGUAGE_CHECK:-}" = "off" ] && exit 0
command -v python3 >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

python3 <<'PYEOF'
import json, os, re, subprocess, sys

try:
    data = json.loads(os.environ.get('SL_INPUT') or '{}')
except Exception:
    sys.exit(0)

if data.get('tool_name') not in ('Write', 'Edit', 'MultiEdit', 'NotebookEdit'):
    sys.exit(0)

path = (data.get('tool_input') or {}).get('file_path') or ''
if not path.endswith('.md') or not os.path.isfile(path):
    sys.exit(0)

try:
    text = open(path, encoding='utf-8').read()
except Exception:
    sys.exit(0)

cyr = len(re.findall(r'[А-Яа-яёЁ]', text))
lat = len(re.findall(r'[A-Za-z]', text))
skill = 'pishi-prosto' if cyr > lat else 'plain-english'
script = os.path.expanduser(f'~/.claude/skills/{skill}/scripts/prose-check.mjs')
if not os.path.isfile(script):
    sys.exit(0)

try:
    run = subprocess.run(['node', script, path], capture_output=True, text=True, timeout=20)
except Exception:
    sys.exit(0)

out = (run.stdout or '').strip()
if not out or 'Нарушений не нашёл' in out or 'No findings' in out:
    sys.exit(0)

if len(out) > 3000:
    out = out[:3000] + '\n…(отчёт обрезан)'

head = (
    f'Проверка письма нашла места в файле {os.path.basename(path)}. '
    'Посмотри их и почини те, где она права; часть находок бывает ложной тревогой, '
    'и тогда оставь как есть.\n\n'
)
print(json.dumps({'hookSpecificOutput': {
    'hookEventName': 'PostToolUse',
    'additionalContext': head + out,
}}, ensure_ascii=False))
PYEOF
