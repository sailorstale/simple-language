# Simple Language

[Скил для русского](README.md) | **English skill**

Plain-English writing rules for Claude Code.

## The pain

By default, Claude writes in complex language. Sentences run long, specialist words arrive without explanation, and ideas get compressed into dense fragments. You can follow the text, but you have to read it twice.

## The fix

This set of rules teaches Claude to write plainly. It explains hard things in everyday words and formats the result generously, so the reader gets the point the first time.

The rules live in your `~/.claude` folder and plug into Claude Code once. After that Claude writes by them on its own, and you do not have to ask in every conversation.

## Three examples: before and after

The set holds nineteen rules on language and twelve more on formatting. One look shows what they change.

**Lead with the point.** The first sentence answers the question, and the detail follows it.

> 🚫 "In order to ensure compliance with the updated requirements, applicants are advised that a review of the following sections should be undertaken."
>
> ✅ "Read these three sections before you apply. They tell you how to meet the new requirements."

**Name the actor.** The passive voice hides who does the work, so the reader has to guess.

> 🚫 "The form must be completed by the applicant."
>
> ✅ "You must complete the form."

**Give the number meaning.** A bare figure says nothing; a ratio lands.

> 🚫 "The change affects 4,200 records."
>
> ✅ "The change affects 4,200 records, about one in every five in the database."

## A few formatting rules

Half the work goes into how the text sits on the page. Here are five rules from that part of the set.

- **A paragraph runs three to seven lines**, and a new topic or step starts a new paragraph.
- **A list item fits in one sentence**, and if it runs longer it was a paragraph, so the detail moves into nested sub-items.
- **A list of one item does not exist**, because a list shows that several equal things belong together.
- **Headings carry the structure**, a bold line does not replace them, and levels run in order: `###` comes after `##`.
- **Link text names its destination**, so "here", "this", and "read more" never become the link.

The remaining rules cover images and their alt text, how to build a table, and the job of each formatting device. They also cover access for people who do not read with their eyes.

## Sources

These rules are not invented. They come from the style guides that governments and large companies already use.

- **The language rules** follow the [US federal plain-language guidelines](https://www.plainlanguage.gov/guidelines/) and the [GOV.UK content style guide](https://www.gov.uk/guidance/style-guide).
- **The formatting rules** draw on the [Microsoft](https://learn.microsoft.com/en-us/style-guide/welcome/) and [Google](https://developers.google.com/style) style guides. They also draw on [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/) research into how people read on screens.

## How it works

The set has three parts, and each does a different job.

- **The hook** in `hooks/` hands Claude a short digest of the rules on every message, so they do not fade in ordinary chat.
- **The skill** in `skills/plain-english/` holds the full rulebook and opens for a long piece of text or when you call `/plain-english`.
- **The checker** in `skills/plain-english/scripts/` reads a finished file and points at the places where the rules break.

The three parts cover different gaps. The hook always arrives, but it carries only nine main points. The skill explains in depth, yet Claude opens it rarely. And the checker catches what slipped through anyway, because a writer cannot see their own mistakes.

Run the check by hand when the document is ready:

```bash
node ~/.claude/skills/plain-english/scripts/prose-check.mjs "path/to/file.md"
```

It fixes nothing and is not always right, so a person decides.

> Any agent built on Claude Code picks up the skills, but the hook runs in Claude Code itself.

## Install

The easiest way is to ask Claude. Clone the repository, open the folder in Claude Code, and say: "install these writing rules for yourself". Claude reads the files, copies the skill and the hook into `~/.claude`, and edits `settings.json`.

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

1. **Copy the skill** into the Claude skills folder:

```bash
cp -R skills/plain-english ~/.claude/skills/
```

2. **Copy the hook** and make it executable:

```bash
cp hooks/write-simply-en.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/write-simply-en.sh
```

3. **Connect the hook** in `~/.claude/settings.json`: add the block from [settings-snippet-en.json](settings-snippet-en.json).

> If the file already has a `hooks` section, put the `UserPromptSubmit` entry inside it. Do not add a second `hooks` section. You need one hook only; do not connect two at once.

Then restart your Claude session, so it picks up the new hook and sees the skill.

## Licence

MIT. Use it freely, change it to suit you, pass it on. The full text is in the [LICENSE](LICENSE) file.
