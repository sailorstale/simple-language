# Simple Language (EN/RU)

Правила ясного письма для Claude Code — русский и английский. / Plain-writing rules for Claude Code — Russian and English.

## Боль

Claude по умолчанию пишет сложным языком: плотно, с терминами и длинными предложениями.

## Решение

Этот набор правил учит Claude писать понятно — доступным языком на любую сложную тему, — а щедрое форматирование делает текст удобным для чтения. Русский свод сделан по мотивам инфостиля Максима Ильяхова ([Главред](https://glvrd.ru), книга «Пиши, сокращай»), а форматирование опирается на руководства [Microsoft](https://learn.microsoft.com/en-us/style-guide/welcome/), [Google](https://developers.google.com/style) и [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/).

## Pain

By default, Claude writes in complex language: dense, jargon-heavy, and long-winded.

## Solution

This toolkit teaches Claude to write plainly — accessible language on any topic, however complex — and generous formatting makes the result easy to read. The English rules follow the [US federal plain-language guidelines](https://www.plainlanguage.gov/guidelines/) and the [GOV.UK style guide](https://www.gov.uk/guidance/style-guide), and the formatting draws on the [Microsoft](https://learn.microsoft.com/en-us/style-guide/welcome/), [Google](https://developers.google.com/style), and [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/) style guides.

## Что внутри

- **`skills/pishi-prosto`** — правила ясного русского письма. Есть машинная проверка (`scripts/prose-check.mjs`), которая ловит образы, длинные предложения, обрубки без глагола и пустой текст ссылки.
- **`skills/plain-english`** — правила ясного английского письма.
- **`hooks/write-simply-reminder.sh`** — короткое напоминание правил для **русского** текста. Claude видит его каждый раз, когда ты ему пишешь.
- **`hooks/write-simply-en.sh`** — то же для **английского** текста. Ставь только один хук, под свой язык: если включить оба, Claude будет получать оба напоминания сразу.

Каждый скил построен по одному образцу: короткое ядро в `SKILL.md` и подробный каталог форматирования в `references/`, который подгружается только под большой документ.

## Установка

Проще всего — попросить Claude. Склонируй репозиторий, открой папку в Claude Code и скажи: «установи эти правила письма себе». Claude прочитает файлы, скопирует нужный скил и хук в `~/.claude` и пропишет `settings.json`. Если нужен только один язык, так и скажи, какой.

```bash
git clone https://github.com/sailorstale/simple-language.git
```

Дальше — только на случай, если ставишь без Claude или хочешь понять, что именно происходит. Обычному пользователю эти настройки трогать не нужно, Claude делает их за него.

### Установщик

Запусти скрипт — он спросит язык и сам всё скопирует и подключит.

```bash
cd simple-language && ./install.sh
```

### Вручную по шагам

Первые два шага одинаковы для обоих скилов, третий нужен только для хука.

1. **Скопируй скилы** в папку скилов Claude:

```bash
cp -R skills/pishi-prosto skills/plain-english ~/.claude/skills/
```

2. **Скопируй хук своего языка** и сделай его исполняемым. Ставь только один — под язык, на котором пишешь.

```bash
# для русского:
cp hooks/write-simply-reminder.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/write-simply-reminder.sh
# для английского:
cp hooks/write-simply-en.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/write-simply-en.sh
```

3. **Подключи хук** в `~/.claude/settings.json`. Добавь блок из [settings-snippet-ru.json](settings-snippet-ru.json) для русского или из [settings-snippet-en.json](settings-snippet-en.json) для английского. Если раздел `hooks` уже есть, впиши запись `UserPromptSubmit` внутрь него. Второй раздел `hooks` заводить не нужно.

После этого перезапусти сессию Claude, чтобы он подхватил новый хук и увидел скилы.

## Как это работает

Скил и хук делают одно дело, но по-разному, и вместе работают лучше.

- **Скил — это полный сборник правил.** Claude открывает его тогда, когда берётся за большой текст или когда ты просишь его по имени (`/pishi-prosto`). Всё остальное время сборник просто лежит наготове и место не занимает.
- **Хук — это короткое напоминание, которое Claude видит каждый раз, когда ты ему пишешь.** Оно напоминает главные правила в обычном разговоре, когда полный сборник Claude сам не открывает.

Зачем оба. Полный сборник слишком большой, чтобы держать его открытым постоянно, поэтому Claude достаёт его только под крупную задачу. А чтобы в обычной переписке правила не забывались, короткое напоминание из хука приходит каждый раз. Скил добавляет глубину, а хук повторяет правила постоянно.

Скилы работают в любом агенте на Claude Code. Хук — это возможность самого Claude Code, поэтому в другой программе он может не сработать.

## Лицензия

MIT — пользуйся свободно, меняй под себя, делись дальше. Полный текст в файле [LICENSE](LICENSE).
