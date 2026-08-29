#!/usr/bin/env bash
# Simple Language — удаление. Убирает скилы, хуки и записи в настройках.
# Uninstaller. Removes the skills, the hooks, and the settings entries.
set -euo pipefail

SKILLS="$HOME/.claude/skills"
HOOKS="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"

echo "Simple Language — удаление / uninstall"
echo

for s in pishi-prosto plain-english; do
  if [ -d "$SKILLS/$s" ]; then
    rm -rf "$SKILLS/$s"
    echo "  убран скил / skill removed: $s"
  fi
done

for h in write-simply-reminder.sh write-simply-en.sh check-prose-on-write.sh; do
  if [ -f "$HOOKS/$h" ]; then
    rm -f "$HOOKS/$h"
    echo "  убран хук / hook removed: $h"
  fi
done

rm -rf "$HOME/.claude/.simple-language"

if [ -f "$SETTINGS" ] && command -v python3 >/dev/null 2>&1; then
  python3 - "$SETTINGS" <<'PY'
import json, os, shutil, sys
settings = sys.argv[1]
try:
    with open(settings, encoding="utf-8") as f:
        data = json.load(f)
except Exception:
    print("  settings.json не читается как JSON — убери записи вручную")
    print("  settings.json is not valid JSON — remove the entries by hand")
    sys.exit(0)

shutil.copy(settings, settings + ".bak")
ours = ("write-simply-reminder.sh", "write-simply-en.sh", "check-prose-on-write.sh")
hooks = data.get("hooks", {})
removed = 0
for event in ("UserPromptSubmit", "PostToolUse"):
    entries = hooks.get(event)
    if not isinstance(entries, list):
        continue
    kept = []
    for e in entries:
        inner = [h for h in e.get("hooks", []) if not h.get("command", "").endswith(ours)]
        removed += len(e.get("hooks", [])) - len(inner)
        if inner:
            e["hooks"] = inner
            kept.append(e)
    if kept:
        hooks[event] = kept
    else:
        hooks.pop(event, None)
if not hooks:
    data.pop("hooks", None)
with open(settings, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"  убрано записей в settings.json: {removed} (копия старого — settings.json.bak)")
print(f"  entries removed from settings.json: {removed} (old copy saved as settings.json.bak)")
PY
fi

echo
echo "Готово. Перезапусти сессию Claude."
echo "Done. Restart your Claude session."
