#!/usr/bin/env bash
# Simple Language — ручная установка без плагина. Ставит оба скила и оба хука.
# Manual install without the plugin. Installs both skills and both hooks.
#
# Обычный путь — плагин: /plugin marketplace add sailorstale/simple-language
# The usual path is the plugin; this script is for people who install by hand.
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
SKILLS="$HOME/.claude/skills"
HOOKS="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"

echo "Simple Language — установка / install"
echo

mkdir -p "$SKILLS" "$HOOKS"
for s in pishi-prosto plain-english; do
  if [ -d "$SKILLS/$s" ]; then
    cp -R "$REPO/skills/$s" "$SKILLS/"
    echo "  скил обновлён / skill updated: $s"
  else
    cp -R "$REPO/skills/$s" "$SKILLS/"
    echo "  скил поставлен / skill installed: $s"
  fi
  # Finder сорит служебными файлами, и они не должны уезжать к человеку.
  find "$SKILLS/$s" -name ".DS_Store" -delete 2>/dev/null || true
done

for h in write-simply.sh check-prose-on-write.sh; do
  cp "$REPO/hooks/$h" "$HOOKS/"
  chmod +x "$HOOKS/$h"
  echo "  хук / hook: $h -> $HOOKS/"
done

# Старые хуки из прежних версий: их заменил один write-simply.sh.
for old in write-simply-reminder.sh write-simply-en.sh; do
  if [ -f "$HOOKS/$old" ]; then
    rm -f "$HOOKS/$old"
    echo "  убран старый хук / old hook removed: $old"
  fi
done

if command -v python3 >/dev/null 2>&1; then
  python3 - "$SETTINGS" <<'PY'
import json, os, shutil, sys
settings = sys.argv[1]
data = {}
if os.path.exists(settings):
    try:
        with open(settings, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        print("  settings.json не читается как JSON — добавь запись из settings-snippet.json вручную")
        print("  settings.json is not valid JSON — add the settings-snippet.json entry by hand")
        sys.exit(0)
    shutil.copy(settings, settings + ".bak")

hooks = data.setdefault("hooks", {})
old = ("/write-simply-reminder.sh", "/write-simply-en.sh")
wanted = {
    "UserPromptSubmit": (None, "$HOME/.claude/hooks/write-simply.sh", 5),
    "PostToolUse": ("Write|Edit|MultiEdit", "$HOME/.claude/hooks/check-prose-on-write.sh", 30),
}
added = 0
for event, (matcher, cmd, timeout) in wanted.items():
    entries = hooks.setdefault(event, [])
    # Записи прежних версий убираем, чтобы напоминание не приходило дважды.
    for e in entries:
        if isinstance(e, dict):
            e["hooks"] = [h for h in e.get("hooks", []) if not h.get("command", "").endswith(old)]
    entries[:] = [e for e in entries if not isinstance(e, dict) or e.get("hooks")]
    wired = any(
        any(h.get("command", "").endswith("/" + os.path.basename(cmd)) for h in e.get("hooks", []))
        for e in entries if isinstance(e, dict)
    )
    if wired:
        continue
    entry = {"hooks": [{"type": "command", "command": cmd, "timeout": timeout}]}
    if matcher:
        entry = {"matcher": matcher, **entry}
    entries.append(entry)
    added += 1

os.makedirs(os.path.dirname(settings), exist_ok=True)
with open(settings, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
note = " (копия старого — settings.json.bak)" if os.path.exists(settings + ".bak") else ""
if added:
    print("  хуки подключены в settings.json%s / hooks wired into settings.json" % note)
else:
    print("  хуки уже подключены в settings.json — не дублирую / already wired, skipping")
PY
else
  echo "  python3 не найден — добавь запись из settings-snippet.json вручную"
  echo "  python3 not found — add the entry from settings-snippet.json by hand"
fi

echo
if command -v node >/dev/null 2>&1; then
  echo "Node.js на месте ($(node --version)) — проверка текста будет работать."
  echo "Node.js found ($(node --version)) — the text check will work."
else
  echo "Node.js не найден. Скил и хук работают без него, а проверка текста — нет."
  echo "Поставить можно тремя способами, любой подойдёт:"
  echo "  1. Сказать Claude: «поставь мне Node.js» — он сделает сам."
  echo "  2. Скачать установщик с https://nodejs.org и нажать кнопку LTS."
  echo "  3. Если на Mac стоит Homebrew: brew install node"
  echo
  echo "Node.js not found. The skill and the hook work without it; the text check does not."
  echo "Three ways to get it, any will do:"
  echo "  1. Ask Claude: \"install Node.js for me\" — it will do it."
  echo "  2. Download the installer from https://nodejs.org and press the LTS button."
  echo "  3. On a Mac with Homebrew: brew install node"
fi

echo
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 не найден. Хук не сможет угадать язык и будет слать полный русский свод каждый ход."
  echo "Задай язык переменной SIMPLE_LANGUAGE_LANG=ru или en."
  echo "python3 not found. The hook cannot detect the language and will send the full Russian rulebook every turn."
  echo "Set the language with SIMPLE_LANGUAGE_LANG=ru or en."
  echo
fi

echo "Готово. Перезапусти сессию Claude, чтобы он подхватил изменения."
echo "Done. Restart your Claude session so it picks up the changes."
