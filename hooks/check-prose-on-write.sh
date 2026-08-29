#!/bin/bash
# Проверка текста сразу после записи документа.
# Вставляется в контекст модели через PostToolUse → additionalContext.
#
# Устройство. Проверка запускается руками, а руками её никто не запускает: автор
# своих ошибок не видит и про команду не вспоминает. Этот хук ловит момент, когда
# Claude записал файл .md, сам прогоняет проверку нужного языка и отдаёт находки
# обратно Claude. Дальше Claude чинит их, не дожидаясь просьбы.
#
# Показывает только те находки, которые попали в изменённые строки: иначе правка
# одной строки в старом документе вываливает отчёт по всему файлу. Границы правки
# берутся из git. Если файл не под git или ещё не отслеживается, показывается всё.
#
# Язык выбирается по самому тексту: больше кириллицы — русская проверка, иначе
# английская. Если скила нет, node не установлен или находок нет, хук молчит.
#
# Настройки через переменные окружения:
#   SIMPLE_LANGUAGE_CHECK=off   — не проверять ничего
#   SIMPLE_LANGUAGE_CHECK=full  — показывать находки по всему файлу, а не только в правке

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
ru = cyr > lat
skill = 'pishi-prosto' if ru else 'plain-english'
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


def changed_lines(file_path):
    """Номера строк, которые правка тронула. None — границы неизвестны."""
    folder = os.path.dirname(os.path.abspath(file_path)) or '.'
    def git(*args):
        return subprocess.run(['git', '-C', folder, *args], capture_output=True, text=True, timeout=10)
    try:
        if git('rev-parse', '--is-inside-work-tree').returncode != 0:
            return None
        if not git('ls-files', '--error-unmatch', file_path).returncode == 0:
            return None                      # новый файл: показываем весь отчёт
        diff = git('diff', '-U0', '--', file_path).stdout
        if not diff.strip():
            diff = git('diff', '-U0', 'HEAD', '--', file_path).stdout
        if not diff.strip():
            return None
    except Exception:
        return None
    lines = set()
    for m in re.finditer(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@', diff, re.M):
        start = int(m.group(1))
        count = int(m.group(2) or 1)
        lines.update(range(start, start + max(count, 1)))
    return lines or None


# Находки из отчёта: номер строки, фрагмент, подсказка.
label_line = 'строка' if ru else 'line'
arrow = '↳' if ru else '->'
# Отчёт печатает строку один раз, а под ней все подсказки к ней, поэтому
# читаем подсказки до следующей строки, а не только первую.
found = []
line_no = None
fragment = ''
for row in out.split('\n'):
    m = re.match(rf'^\s+{label_line} (\d+): (.*)$', row)
    if m:
        line_no = int(m.group(1))
        fragment = m.group(2)
        continue
    h = re.match(rf'^\s+{re.escape(arrow)} (.*)$', row)
    if h and line_no is not None:
        found.append((line_no, fragment, h.group(1)))

only_changed = os.environ.get('SIMPLE_LANGUAGE_CHECK') != 'full'
changed = changed_lines(path) if only_changed else None
scope = ''
if changed and found:
    kept = [f for f in found if f[0] in changed]
    if not kept:
        sys.exit(0)
    if len(kept) < len(found):
        scope = (' Показаны только строки, которые ты правил.' if ru
                 else ' Only the lines you touched are shown.')
    found = kept

if not found:
    sys.exit(0)

name = os.path.basename(path)
if ru:
    head = (f'Проверка письма нашла места в файле {name}.{scope} Посмотри их и почини те, '
            'где она права; часть находок бывает ложной тревогой, и тогда оставь как есть.\n')
else:
    head = (f'The prose check found spots in {name}.{scope} Look at them and fix the ones it gets '
            'right; some findings are false alarms, and those you leave alone.\n')

body = []
last = None
for n, fragment, hint in found[:25]:
    if n != last:
        body.append(f'\n  {label_line} {n}: {fragment}')
        last = n
    if hint:
        body.append(f'    {arrow} {hint}')
if len(found) > 25:
    tail = f'\n  …и ещё {len(found) - 25}' if ru else f'\n  …and {len(found) - 25} more'
    body.append(tail)

print(json.dumps({'hookSpecificOutput': {
    'hookEventName': 'PostToolUse',
    'additionalContext': head + '\n'.join(body),
}}, ensure_ascii=False))
PYEOF
