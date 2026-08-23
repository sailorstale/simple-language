# Simple Language

Plain-writing rules for Claude Code. There is an English set and a Russian one.

[Читать по-русски](README.md)

## The pain

By default, Claude writes in complex language. Sentences run long, specialist words arrive without explanation, and ideas get compressed into dense fragments. You can follow the text, but you have to read it twice.

## The fix

This set of rules teaches Claude to write plainly. It explains hard things in everyday words and formats the result generously, so the reader gets the point the first time.

The rules live in your `~/.claude` folder and plug into Claude Code once. After that Claude writes by them on its own, and you do not have to ask in every conversation.

There are two sets, English and Russian. Install both, or only the language you write in.

## Sources

These rules are not invented. They come from the style guides that governments and large companies already use.

- **The English rules** follow the [US federal plain-language guidelines](https://www.plainlanguage.gov/guidelines/) and the [GOV.UK content style guide](https://www.gov.uk/guidance/style-guide).
- **The Russian rules** follow the infostyle method of Maxim Ilyahov: the [Glavred](https://glvrd.ru) service and his book "Пиши, сокращай".
- **The formatting rules** for both languages draw on the [Microsoft](https://learn.microsoft.com/en-us/style-guide/welcome/) and [Google](https://developers.google.com/style) style guides. They also draw on [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/) research into how people read on screens.

## How it works

The set has three parts, and each does a different job. The hook repeats the rules constantly. The skill holds them in full and opens for a big job. The checker reads finished text and looks for breaches.

### The hook repeats the rules on every message

A hook is a small program that Claude Code runs itself every time you send a message. It hands Claude a short digest of the rules, about half a page long: nine main points and nothing more.

The value of the hook is that it never stops. An ordinary chat is exactly where Claude forgets to write plainly, because it will not open a full rulebook to answer a short question. The reminder arrives every time and costs almost nothing.

Files: `hooks/write-simply-en.sh` for English and `hooks/write-simply-reminder.sh` for Russian.

> Install one hook only, for the language you write in. Turn both on and Claude gets two reminders at once.

### The skill holds the full rules

A skill is a folder of rules that Claude opens when it needs them. Inside sits `SKILL.md` with the whole set. It holds ten core rules, moves for fixing a heavy sentence, "poor and better" examples, and a swap list for formal words.

Claude opens the skill on its own when it starts a long piece of text. You can also call it by name, with `/plain-english` or `/pishi-prosto`. The rest of the time the skill sits on disk and takes up no room in the conversation.

Next to `SKILL.md` is a `references/` folder with the formatting detail: lists, tables, headings, images, and link text. Claude loads it only for a large document, so nothing extra rides along in a short answer.

Files: `skills/plain-english/` and `skills/pishi-prosto/`.

### The checker reads finished text

The checker is a script that reads a written file and points at the places where the rules break. The hook and the skill shape Claude while it writes; the checker works on the result. You run it by hand when you finish the document:

```bash
node ~/.claude/skills/plain-english/scripts/prose-check.mjs "path/to/file.md"
```

The English check catches passive voice, formal words, hidden verbs, sentences over 25 words, and bare link text such as "here" or "read more". The Russian check catches metaphors, unexplained jargon, and fragments with no verb. It also finds percentages where a ratio reads better, over-long sentences, and lists that were really paragraphs.

The checker fixes nothing and is not always right. Some findings will be false alarms, which is normal, and a person always decides. The word lists sit beside it in `scripts/prose-rules.json`, and you can extend them by hand. Spot a new metaphor or an unexplained term, add a line there, and the check gets smarter.

Files: `skills/plain-english/scripts/` and `skills/pishi-prosto/scripts/`. The checker installs together with its skill, so you do not copy it separately.

### Why you want all three

Each part covers what the others cannot. A full rulebook is too large to keep open all the time, so Claude fetches it only for a big job. To stop the rules fading in ordinary chat, the short reminder from the hook arrives with every message. And the checker catches what slipped through anyway, because a writer cannot see their own mistakes in their own text.

Skills work in any agent built on Claude Code. The hook is a Claude Code feature, so it may not fire in another program.

## Install

The easiest way is to ask Claude. Clone the repository, open the folder in Claude Code, and say: "install these writing rules for yourself". Claude reads the files, copies the right skill and hook into `~/.claude`, and edits `settings.json`. If you want one language only, say which.

```bash
git clone https://github.com/sailorstale/simple-language.git
```

The rest is here in case you install without Claude, or you want to see exactly what happens. You do not need to touch these settings yourself; Claude does it for you.

### The installer

Run the script. It asks for a language, then copies and connects everything.

```bash
cd simple-language && ./install.sh
```

### By hand, step by step

The first two steps are the same for both skills; the third is only for the hook.

1. **Copy the skills** into the Claude skills folder:

```bash
cp -R skills/plain-english skills/pishi-prosto ~/.claude/skills/
```

2. **Copy the hook for your language** and make it executable (one only, for the language you write in):

```bash
# English:
cp hooks/write-simply-en.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/write-simply-en.sh
# Russian:
cp hooks/write-simply-reminder.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/write-simply-reminder.sh
```

3. **Connect the hook** in `~/.claude/settings.json`: add the block from [settings-snippet-en.json](settings-snippet-en.json) for English, or from [settings-snippet-ru.json](settings-snippet-ru.json) for Russian.

> If the file already has a `hooks` section, put the `UserPromptSubmit` entry inside it. Do not add a second `hooks` section.

Then restart your Claude session, so it picks up the new hook and sees the skills.

## Licence

MIT. Use it freely, change it to suit you, pass it on. The full text is in the [LICENSE](LICENSE) file.
