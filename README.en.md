# Simple Language

[Скил для русского](README.md) | **English skill**

Plain-writing rules for Claude Code. There is an English set and a Russian one.

## The pain

By default, Claude writes in complex language. Sentences run long, specialist words arrive without explanation, and ideas get compressed into dense fragments. You can follow the text, but you have to read it twice.

## The fix

This set of rules teaches Claude to write plainly. It explains hard things in everyday words and formats the result generously, so the reader gets the point the first time.

The rules live in your `~/.claude` folder and plug into Claude Code once. After that Claude writes by them on its own, and you do not have to ask in every conversation.

There are two sets, English and Russian. Install both, or only the language you write in.

## Before and after

The skill holds about ten rules, but one look shows what changes. Here are three pairs from the English set.

**Lead with the point.** The first sentence answers the question, and the detail follows it.

> 🚫 "In order to ensure compliance with the updated requirements, applicants are advised that a review of the following sections should be undertaken."
> ✅ "Read these three sections before you apply. They tell you how to meet the new requirements."

**Name the actor.** The passive voice hides who does the work, so the reader has to guess.

> 🚫 "The form must be completed by the applicant."
> ✅ "You must complete the form."

**Give the number meaning.** A bare figure says nothing; a ratio lands.

> 🚫 "The change affects 4,200 records."
> ✅ "The change affects 4,200 records, about one in every five in the database."

The Russian set works the same way and catches its own faults. Those are metaphors, unexplained jargon, fragments with no verb, and percentages where a ratio reads better.

## Sources

These rules are not invented. They come from the style guides that governments and large companies already use.

- **The English rules** follow the [US federal plain-language guidelines](https://www.plainlanguage.gov/guidelines/) and the [GOV.UK content style guide](https://www.gov.uk/guidance/style-guide).
- **The Russian rules** follow the infostyle method of Maxim Ilyahov: the [Glavred](https://glvrd.ru) service and his book "Пиши, сокращай".
- **The formatting rules** for both languages draw on the [Microsoft](https://learn.microsoft.com/en-us/style-guide/welcome/) and [Google](https://developers.google.com/style) style guides. They also draw on [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/) research into how people read on screens.

## How it works

The set has three parts, and each does a different job.

- **The hook** in `hooks/` hands Claude a short digest of the rules on every message, so they do not fade in ordinary chat.
- **The skill** in `skills/` holds the full rulebook and opens for a long piece of text or when you call `/plain-english`.
- **The checker** in `skills/plain-english/scripts/` reads a finished file and points at the places where the rules break.

The three parts cover different gaps. The hook always arrives, but it carries only nine main points. The skill explains in depth, yet Claude opens it rarely. And the checker catches what slipped through anyway, because a writer cannot see their own mistakes.

Run the check by hand when the document is ready:

```bash
node ~/.claude/skills/plain-english/scripts/prose-check.mjs "path/to/file.md"
```

It fixes nothing and is not always right, so a person decides.

> Install one hook only, for the language you write in. Any agent built on Claude Code picks up the skills, but the hook runs in Claude Code itself.

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
