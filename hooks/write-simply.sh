#!/bin/bash
# Напоминание правил «пиши просто», сжатое под разговор. Язык выбирает сам.
# Reminder of the plain-writing rules, trimmed for chat. Picks the language itself.
# Вставляется в контекст модели через UserPromptSubmit → additionalContext.
#
# Устройство. Хук платится за КАЖДОЕ сообщение, и копии остаются в истории, поэтому
# он несёт только то, что проседает в разговоре. Тонкости оформления документа сюда
# не входят: они живут в скиле и подгружаются под большой текст. Полный свод уходит
# один раз за сессию на каждый язык, дальше идёт короткое напоминание, а служебные
# сообщения молчат.
#
# Язык берётся из самого сообщения. Пути, ссылки и код из подсчёта выкидываются,
# чтобы «открой src/UserProfile.tsx» не сошло за английский. Если кириллицы в
# оставшихся словах хотя бы пятая часть, напоминание русское, иначе английское.
# Сообщение без букв получает язык прошлого хода, а без него молчит.
#
# Настройки через переменные окружения:
#   SIMPLE_LANGUAGE_LANG=ru|en     — не угадывать язык, а всегда брать этот
#   SIMPLE_LANGUAGE_FULL_EVERY=10  — вернуть повторы: каждое N-е сообщение получает полный свод
#   SIMPLE_LANGUAGE_MODE=full      — всегда полный свод
#   SIMPLE_LANGUAGE_MODE=off       — молчать
#
# Оговорка. Лозунг «пиши, сокращай» сознательно НЕ взят: модель читает его буквально как
# «короче» и снова начинает рубить мысли до обрывков, что работает против пункта 2.

SL_INPUT=$(cat)
SL_RU_FULL='ПИШИ ПРОСТО — правила русского текста для человека (чат и документы; не для кода, git-коммитов и не для текста на других языках). 1) Веди с главного: первое предложение это ответ, детали идут после него. 2) ГЛАВНОЕ И ЧАЩЕ ВСЕГО НАРУШАЕМОЕ: пиши развёрнутыми простыми предложениями, а не сжатыми тезисами. Каждая мысль это законченное предложение с подлежащим и сказуемым. Обрубки вроде «Ритм — недельный, не поток» разворачивай в два-три обычных предложения. Не строй фразу через «не X, а Y» и через тире вместо глагола. 3) Объём не ограничен: длинный понятный текст лучше короткого плотного. Убрать лишние слова это одна десятая работы, а девять десятых это положить на их место факты, примеры и объяснения. 4) Пиши буквально, без метафор и образов, и убирай усилители «очень», «весьма», «вполне»: они не добавляют факта. 5) Специальный термин из любой области поясняй один раз и не прячь в скобки весь жаргон подряд; слова, которые человек употребил сам, не заменяй и не поясняй. 6) Доли вместо процентов: «4 из 10» понятнее, чем «39%». Число объясняй: что оно значит для человека. 7) Форматируй щедро, но по делу: заголовки, списки, короткие абзацы по 2–4 предложения, воздух. Маркированный список это равноправные пункты, нумерованный это шаги по очереди, абзац это связное рассуждение. Пункт держится в одном-трёх предложениях, а подробности уходят во вложенные подпункты. Значимое слово ставь в начало заголовка, пункта и абзаца. Оговорку давай блок-цитатой, а сайт кликабельной ссылкой с осмысленным текстом. 8) Перед отправкой прочти вслух: вопрос не «покороче ли стало», а «понятно ли с первого раза» и «звучит ли как живая речь». Тонкости оформления (таблицы, картинки и alt-текст, уровни заголовков, доступность) и полный свод с примерами лежат в скиле «pishi-prosto» — зови его для документов и больших текстов.'
SL_RU_SHORT='ПИШИ ПРОСТО (короткое напоминание): пиши развёрнутыми простыми предложениями с подлежащим и сказуемым, а не сжатыми тезисами; веди с главного; пиши буквально, без метафор; специальный термин поясняй один раз; доли вместо процентов; форматируй щедро — заголовки, списки, короткие абзацы, воздух. Правило для русского текста, не для кода и git-коммитов. Полный свод — скил pishi-prosto.'
SL_EN_FULL='WRITE SIMPLY — rules for English prose (chat and documents; not code, commit messages, or other languages). 1) Lead with the point: the first sentence is the answer, details after it. 2) MOST OFTEN BROKEN: write full sentences with a subject and a verb, one idea each, never headline fragments; check anything over 25 words and split it. 3) Use short everyday words (utilise->use, in order to->to, approximately->about). 4) Use the active voice; do not hide a verb inside a noun (conduct an analysis->analyse, make a decision->decide). 5) Write to the reader as '\''you'\'' and in the present tense; explain a specialist term the first time you use it and spell out an abbreviation on first use. 6) Keep the tone neutral and factual: no subjective adjectives, no hype, no ALL-CAPS runs, and cut intensifiers like «very» and «really». 7) Give a number meaning: say what the figure means for the reader. 8) Format on purpose: a bulleted list for equal unordered items, a numbered list for steps, a paragraph for connected reasoning; keep paragraphs short; put the meaningful word first in every heading, item, and paragraph; name a link by its destination, never '\''here'\'' or a bare URL. 9) Before sending, read a paragraph aloud: ask not '\''is it shorter'\'' but '\''is it clear on the first read'\''. Formatting detail (tables, images and alt text, heading levels, accessibility) and the full rules with examples live in the '\''plain-english'\'' skill — load it for documents and long text.'
SL_EN_SHORT='WRITE SIMPLY (short reminder): full sentences with a subject and a verb, one idea each; lead with the point; everyday words; active voice; explain jargon once; give numbers meaning; format generously with headings, lists, and short paragraphs. English prose only, not code or commit messages. Full rules: the plain-english skill.'
export SL_INPUT SL_RU_FULL SL_RU_SHORT SL_EN_FULL SL_EN_SHORT

[ "${SIMPLE_LANGUAGE_MODE:-}" = "off" ] && exit 0

# Без python3 язык не угадать и ходы не посчитать: шлём полный свод того языка,
# который задан переменной, а без неё русский свод, потому что он в наборе первый.
if ! command -v python3 >/dev/null 2>&1; then
  case "${SIMPLE_LANGUAGE_LANG:-ru}" in
    en) SL_TEXT="$SL_EN_FULL" ;;
    *)  SL_TEXT="$SL_RU_FULL" ;;
  esac
  printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"%s"}}\n' "$SL_TEXT"
  exit 0
fi

python3 <<'PYEOF'
import hashlib, json, os, re, sys, time

texts = {
    'ru': (os.environ.get('SL_RU_FULL', ''), os.environ.get('SL_RU_SHORT', '')),
    'en': (os.environ.get('SL_EN_FULL', ''), os.environ.get('SL_EN_SHORT', '')),
}
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

# 2. Состояние сессии: сколько ходов было на каждом языке и какой язык был последним.
state = {}
path = ''
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
            state = json.load(f)
        if not isinstance(state, dict):
            state = {}
    except Exception:
        state = {}


def detect(text):
    """Язык сообщения: 'ru', 'en' или None, когда букв нет."""
    forced = (os.environ.get('SIMPLE_LANGUAGE_LANG') or '').strip().lower()
    if forced in texts:
        return forced
    clean = re.sub(r'`[^`]*`', ' ', text)                    # код в обратных кавычках
    clean = re.sub(r'https?://\S+', ' ', clean)                 # ссылки
    clean = re.sub(r'\S*[/\\._]\S*', ' ', clean)                # пути, файлы, имена_с_подчёркиванием
    clean = re.sub(r'\S*[A-Za-z]\d\S*|\S*\d[A-Za-z]\S*', ' ', clean)  # идентификаторы вроде sha1 и utf8
    cyr = len(re.findall(r'[А-Яа-яёЁ]', clean))
    lat = len(re.findall(r'[A-Za-z]', clean))
    if not cyr and not lat:
        return None
    return 'ru' if cyr * 5 >= cyr + lat else 'en'


lang = detect(prompt) or state.get('last')
if lang not in texts:
    sys.exit(0)

# 3. Полный свод уходит первым сообщением на этом языке, дальше идёт короткое
#    напоминание. Переменная SIMPLE_LANGUAGE_FULL_EVERY возвращает повторы: с ней
#    полный свод приходит каждый N-й ход.
every = 0
raw = os.environ.get('SIMPLE_LANGUAGE_FULL_EVERY')
if raw:
    try:
        every = max(1, int(raw))
    except ValueError:
        every = 0

n = int(state.get(lang) or 0) + 1
if path:
    state[lang] = n
    state['last'] = lang
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(state, f)
    except Exception:
        pass

full, short = texts[lang]
if os.environ.get('SIMPLE_LANGUAGE_MODE') == 'full':
    text = full
else:
    text = full if (every and (n - 1) % every == 0) or (not every and n == 1) else short
out = {'hookSpecificOutput': {'hookEventName': 'UserPromptSubmit', 'additionalContext': text}}
print(json.dumps(out, ensure_ascii=False))
PYEOF
