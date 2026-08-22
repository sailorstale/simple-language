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
  cp -R "$REPO/skills/$1" "$SKILLS/"
  echo "  скил / skill: $1 -> $SKILLS/"
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
echo "Готово. Перезапусти сессию Claude, чтобы он подхватил изменения."
echo "Done. Restart your Claude session so it picks up the changes."
