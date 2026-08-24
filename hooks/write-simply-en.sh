#!/bin/bash
# Reminder of the plain-English rules for English prose.
# Вставляется в контекст модели через UserPromptSubmit → additionalContext.
#
# Устройство. Хук платится за КАЖДОЕ сообщение, и копии остаются в истории, поэтому
# полный свод уходит редко, а между ним идёт короткое напоминание на четверть длины.
# Служебные сообщения («да», «/команда», путь к файлу) не получают ничего.
#
# Настройки через переменные окружения:
#   SIMPLE_LANGUAGE_FULL_EVERY=10  — каждое N-е сообщение получает полный свод (по умолчанию 10)
#   SIMPLE_LANGUAGE_MODE=full      — всегда полный свод, как было раньше
#   SIMPLE_LANGUAGE_MODE=off       — молчать
#
# Оговорка. Лозунг «пиши, сокращай» сознательно НЕ взят: модель читает его буквально как
# «короче» и снова начинает рубить мысли до обрывков, что работает против пункта 2.

SL_INPUT=$(cat)
SL_FULL='WRITE SIMPLY — rule for English prose (chat and documents; not for code, commit messages, or other languages): 1) Lead with the point — the first sentence is the answer, then details in falling order of importance (inverted pyramid). 2) MOST OFTEN BROKEN: write full, plain sentences, not headline fragments — each idea is a complete sentence with a subject and a verb; check any sentence over 25 words and split it. 3) Use short, everyday words; avoid formal or Latinate ones (utilise->use, in order to->to, approximately->about). 4) Use the active voice and strong verbs; do not hide a verb inside a noun (conduct an analysis->analyse, make a decision->decide). 5) Write to the reader as '\''you'\'' and in the present tense; explain a specialist term the first time you use it and spell out an abbreviation on first use. 6) Keep the tone neutral and factual — no subjective adjectives, no hype, no ALL-CAPS runs. 7) Format generously, on purpose: a bulleted list for equal unordered items, a numbered list for steps, a paragraph for connected reasoning; a single item is a paragraph, not a list. Keep paragraphs short (up to about five sentences). Structure is carried by headings (####, #####), not by bold; do not skip levels (## then ###). Put the meaningful word at the front of every heading, item, and paragraph. A long section is a short lead plus several labelled pieces, not one wall of text; put a caveat or note in a blockquote (>). 8) Every link'\''s text names where it goes — never '\''here'\'', '\''click here'\'', or a bare URL. 9) Before sending, reread and read one paragraph aloud — ask not '\''is it shorter'\'' but '\''is it clear on the first read'\''. Full rules — the '\''plain-english'\'' skill (load it for documents and long text).'
SL_SHORT='WRITE SIMPLY (short reminder): full sentences with a subject and a verb, one idea each; lead with the point; everyday words; active voice; explain jargon once; give numbers meaning; format generously with headings, lists, and short paragraphs. English prose only, not code or commit messages. Full rules: the plain-english skill.'
export SL_INPUT SL_FULL SL_SHORT

[ "${SIMPLE_LANGUAGE_MODE:-}" = "off" ] && exit 0

if [ "${SIMPLE_LANGUAGE_MODE:-}" = "full" ] || ! command -v python3 >/dev/null 2>&1; then
  printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"%s"}}\n' "$SL_FULL"
  exit 0
fi

python3 <<'PYEOF'
import hashlib, json, os, re, sys, time

full = os.environ.get('SL_FULL', '')
short = os.environ.get('SL_SHORT', '')
try:
    data = json.loads(os.environ.get('SL_INPUT') or '{}')
except Exception:
    data = {}

prompt = (data.get('prompt') or '').strip()
sid = data.get('session_id') or ''

# 1. Служебные сообщения правил письма не требуют, поэтому напоминание им не нужно.
SKIP = {
    'да', 'нет', 'ок', 'окей', 'ага', 'угу', 'давай', 'стоп', 'хватит', 'спасибо',
    'ясно', 'понял', 'поехали', 'дальше', 'продолжай', 'go', 'ok', 'okay', 'yes',
    'no', 'y', 'n', 'sure', 'thanks', 'stop', 'continue', 'next',
}
low = prompt.lower().strip(' .!?,;:')
is_path = bool(re.fullmatch(r'[\w./~@-]+\.[A-Za-z0-9]{1,5}', prompt))
is_url = bool(re.fullmatch(r'https?://\S+', prompt))
if not prompt or prompt.startswith('/') or low in SKIP or is_path or is_url:
    sys.exit(0)

# 2. Полный свод уходит редко, короткое напоминание — в остальные ходы.
try:
    every = max(1, int(os.environ.get('SIMPLE_LANGUAGE_FULL_EVERY') or 10))
except ValueError:
    every = 10

n = 1
if sid:
    state_dir = os.path.join(os.path.expanduser('~'), '.claude', '.simple-language')
    try:
        os.makedirs(state_dir, exist_ok=True)
        now = time.time()
        for name in os.listdir(state_dir):       # старые сессии убираем через неделю
            p = os.path.join(state_dir, name)
            if now - os.path.getmtime(p) > 7 * 24 * 3600:
                os.remove(p)
    except Exception:
        pass
    path = os.path.join(state_dir, hashlib.sha1(sid.encode()).hexdigest()[:16])
    try:
        with open(path, encoding='utf-8') as f:
            n = int(f.read().strip()) + 1
    except Exception:
        n = 1
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(str(n))
    except Exception:
        pass

text = full if (n - 1) % every == 0 else short
out = {'hookSpecificOutput': {'hookEventName': 'UserPromptSubmit', 'additionalContext': text}}
print(json.dumps(out, ensure_ascii=False))
PYEOF
