#!/usr/bin/env bash
# Simple Language — установщик. Спрашивает язык и ставит скил и хук.
# Installer. Asks for a language, then installs the skill and the hook.
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
SKILLS="$HOME/.claude/skills"
HOOKS="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"

echo "Simple Language — установка / install"
echo
echo "Какой язык поставить? / Which language to install?"
echo "  1) Русский — pishi-prosto"
echo "  2) English — plain-english"
echo "  3) Оба / Both"
printf "Выбор / choice [1/2/3]: "
read -r LANG

install_skill() {
  mkdir -p "$SKILLS"
  if [ -d "$SKILLS/$1" ]; then
    cp -R "$REPO/skills/$1" "$SKILLS/"
    echo "  скил обновлён / skill updated: $1"
  else
    cp -R "$REPO/skills/$1" "$SKILLS/"
    echo "  скил поставлен / skill installed: $1"
  fi
  # Finder сорит служебными файлами, и они не должны уезжать к человеку.
  find "$SKILLS/$1" -name ".DS_Store" -delete 2>/dev/null || true
}

HOOK=""
case "$LANG" in
  1) install_skill pishi-prosto;  HOOK="write-simply-reminder.sh" ;;
  2) install_skill plain-english; HOOK="write-simply-en.sh" ;;
  3)
    install_skill pishi-prosto
    install_skill plain-english
    echo
    echo "Какой хук включать каждый ход? / Which hook fires every turn?"
    echo "  1) Русский  2) English  3) Никакой / none"
    printf "[1/2/3]: "
    read -r H
    case "$H" in
      1) HOOK="write-simply-reminder.sh" ;;
      2) HOOK="write-simply-en.sh" ;;
      *) HOOK="" ;;
    esac
    ;;
  *) echo "Непонятный выбор. / Unknown choice."; exit 1 ;;
esac

echo
echo "Проверять текст сразу после записи документа? / Check prose right after a document is written?"
echo "  1) Да / yes   2) Нет / no"
printf "[1/2]: "
read -r CHECK
if [ "$CHECK" = "1" ]; then
  mkdir -p "$HOOKS"
  cp "$REPO/hooks/check-prose-on-write.sh" "$HOOKS/"
  chmod +x "$HOOKS/check-prose-on-write.sh"
  echo "  хук проверки / check hook: check-prose-on-write.sh -> $HOOKS/"
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$SETTINGS" <<'PYCHECK'
import json, os, sys
settings = sys.argv[1]
cmd = "$HOME/.claude/hooks/check-prose-on-write.sh"
data = {}
if os.path.exists(settings):
    try:
        with open(settings, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        print("  settings.json не читается как JSON — добавь запись из settings-snippet-check.json вручную")
        print("  settings.json is not valid JSON — add the settings-snippet-check.json entry by hand")
        sys.exit(0)
post = data.setdefault("hooks", {}).setdefault("PostToolUse", [])
wired = any(
    any(h.get("command", "").endswith("/check-prose-on-write.sh") for h in e.get("hooks", []))
    for e in post if isinstance(e, dict)
)
if wired:
    print("  хук проверки уже подключён / check hook already wired")
else:
    post.append({"matcher": "Write|Edit|MultiEdit",
                 "hooks": [{"type": "command", "command": cmd, "timeout": 30}]})
    os.makedirs(os.path.dirname(settings), exist_ok=True)
    with open(settings, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("  хук проверки подключён в settings.json / check hook wired into settings.json")
PYCHECK
  else
    echo "  python3 не найден — добавь запись из settings-snippet-check.json вручную"
    echo "  python3 not found — add the entry from settings-snippet-check.json by hand"
  fi
fi

if [ -n "$HOOK" ]; then
  mkdir -p "$HOOKS"
  cp "$REPO/hooks/$HOOK" "$HOOKS/"
  chmod +x "$HOOKS/$HOOK"
  echo "  хук / hook: $HOOK -> $HOOKS/"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$SETTINGS" "$HOOK" <<'PY'
import json, os, sys, shutil
settings, hook = sys.argv[1], sys.argv[2]
cmd = "$HOME/.claude/hooks/" + hook
data = {}
if os.path.exists(settings):
    try:
        with open(settings, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        print("  settings.json не читается как JSON — добавь запись из settings-snippet вручную")
        print("  settings.json is not valid JSON — add the settings-snippet entry by hand")
        sys.exit(0)
    shutil.copy(settings, settings + ".bak")
ups = data.setdefault("hooks", {}).setdefault("UserPromptSubmit", [])
def has(cmd_suffix):
    return any(
        any(h.get("command", "").endswith("/" + cmd_suffix) for h in e.get("hooks", []))
        for e in ups if isinstance(e, dict)
    )
other = "write-simply-en.sh" if hook == "write-simply-reminder.sh" else "write-simply-reminder.sh"
if has(other):
    print("  внимание: второй языковой хук уже подключён — два будут слать напоминание вдвоём")
    print("  note: the other language hook is already wired — both will fire every turn")
if has(hook):
    print("  хук уже подключён в settings.json — не дублирую / already wired, skipping")
else:
    ups.append({"hooks": [{"type": "command", "command": cmd, "timeout": 5}]})
    os.makedirs(os.path.dirname(settings), exist_ok=True)
    with open(settings, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    note = " (копия старого — settings.json.bak)" if os.path.exists(settings + ".bak") else ""
    print("  хук подключён в settings.json%s / hook wired into settings.json" % note)
PY
  else
    echo "  python3 не найден — добавь запись из settings-snippet-*.json вручную"
    echo "  python3 not found — add the entry from settings-snippet-*.json by hand"
  fi
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
  echo "python3 не найден. Хук будет слать полный свод каждый ход, без экономии."
  echo "python3 not found. The hook will send the full rulebook every turn, with no saving."
  echo
fi

echo "Готово. Перезапусти сессию Claude, чтобы он подхватил изменения."
echo "Done. Restart your Claude session so it picks up the changes."
