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
- **`hooks/write-simply-reminder.sh`** — напоминание правил в каждый ход для **русского** текста.
- **`hooks/write-simply-en.sh`** — то же для **английского** текста. Ставь только один хук, под свой язык: если включить оба, они будут слать напоминание каждый ход вдвоём.

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

Скил и хук — это два разных механизма, и они не заменяют друг друга.

- **Скил** — это полный свод правил. Он лежит на месте и подгружается, когда Claude берётся за большой текст или когда его зовут по имени (`/pishi-prosto`).
- **Хук** — это короткая выжимка, которая звучит в каждый ход. Она держит правила перед глазами модели в обычном разговоре, где полный свод не открывается.

Скилы годятся для любого агента на Claude Code. Хук — это возможность именно Claude Code (событие `UserPromptSubmit`), поэтому в другой среде он может не сработать.

## Лицензия

MIT — пользуйся свободно, меняй под себя, делись дальше. Полный текст в файле [LICENSE](LICENSE).
