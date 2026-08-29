# Simple Language

[Скил для русского](README.md) | **English skill**

Claude stops writing dense paragraphs full of jargon and starts explaining in everyday words. The rules plug into Claude Code once, and after that Claude holds to them on its own, without a reminder in every conversation.

## What changes in the text

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

## What you need first

- **Claude Code**, in a version that understands skills and hooks.
- **Node.js**, which only the checker needs, because the skill and the hook run without it (we tested the checker on Node 24).
    - The simplest way is to ask Claude to install Node.js for you.
  - The second way is to download the installer from [nodejs.org](https://nodejs.org) and press the LTS button.
  - The third way suits a Mac with Homebrew: `brew install node`.
  - The installer checks for Node and prints the same hint.
- **The `~/.claude` folder**, which appears on its own after you first run Claude Code.

## Install

The easiest way is to ask Claude. Clone the repository, open the folder in Claude Code, and say: "install these writing rules for yourself". Claude reads the files, copies the skill and the hook into `~/.claude`, and edits the settings.

```bash
git clone https://github.com/sailorstale/simple-language.git
```

The rest is here in case you install without Claude, or you want to see exactly what happens.

### The installer

Run the script. It asks for a language, then copies and connects everything.

```bash
cd simple-language && ./install.sh
```

The installer leaves other entries in `~/.claude/settings.json` alone. It adds its own line beside them and saves the old file as `settings.json.bak`. If the hook is already wired, it will not add it twice. It needs `python3` to edit the settings, and without it the script asks you to add the entry by hand.

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

4. **Connect the check-on-write hook** if you want findings to arrive on their own. Copy `hooks/check-prose-on-write.sh` into `~/.claude/hooks/`, make it executable, and add the block from [settings-snippet-check.json](settings-snippet-check.json).

> If the file already has a `hooks` section, put the `UserPromptSubmit` entry inside it. Do not add a second `hooks` section.

Then restart your Claude session, so it picks up the new hook and sees the skill.

## Check that it worked

Three ways, from the quickest to the clearest.

1. **Run the check on any file.** If it prints a report, the skill and its script are in place:

```bash
node ~/.claude/skills/plain-english/scripts/prose-check.mjs "path/to/file.md"
```

A report looks like this:

```
README.md — 1 finding(s)

  Sentence over 25 words — 1
    line 12: The script reads the document and points at the places where the rules break…
      -> 33 words in one sentence — split it (GOV.UK: check anything over 25)
```

2. **Open `~/.claude/settings.json`.** Its `hooks` section should hold a `UserPromptSubmit` entry pointing at `write-simply-en.sh`.

3. **Start a new session and ask Claude to explain something hard.** The answer should come in everyday words and short sentences. A dense paragraph of jargon means the hook did not connect.

## How it works

The set has three parts, and each does a different job.

- **The hook** in `hooks/` hands Claude a short digest of the rules on every message, so they do not fade in ordinary chat.
- **The skill** in `skills/plain-english/` holds the full rulebook and opens for a long piece of text or when you call `/plain-english`.
- **The checker** in `skills/plain-english/scripts/` reads a finished file and points at the places where the rules break.
- **A second hook** in `hooks/` runs that check on its own as soon as Claude writes a document, and hands the findings back.

The three parts cover different gaps. The hook always arrives, but it carries only nine main points. The skill explains in depth, yet Claude opens it rarely. And the checker catches what slipped through anyway, because a writer cannot see their own mistakes.

### Why a skill beats asking Claude for plainer writing

A spoken request lasts a few messages and then fades, because the conversation moves on and old instructions sink out of view. The hook arrives with every message, so it never wears off. A request also holds one or two ideas, while the skill holds rules with examples and reasoning that no request has room for.

### What the hook costs

The hook pays per message you send, and its copies stay in the conversation history. So it sends the full rulebook rarely.

- **The full rulebook** goes out once, on the first message of the session. It runs to 1,465 characters and carries only what slips in conversation, because the formatting detail lives in the skill.
- **A short reminder** of 329 characters goes out on every other turn, about a quarter of the full text.
- **Housekeeping messages get nothing.** That covers a slash command, a file path, a bare URL, and short replies such as "yes" or "ok".

Across a 50-message conversation that comes to roughly 14,000 characters. The first version of the hook cost 86,000, so the bill is now about a sixth of that.

Environment variables change the behaviour:

| Variable | What it does |
|---|---|
| `SIMPLE_LANGUAGE_FULL_EVERY=10` | bring repeats back: the full rulebook then goes out every tenth message |
| `SIMPLE_LANGUAGE_MODE=full` | always send the full rulebook, as the first versions did |
| `SIMPLE_LANGUAGE_MODE=off` | stay quiet and send nothing |

The hook needs `python3` to count messages. Without it, it falls back to the old behaviour and sends the full text every time.

### The checker reads your own writing too

The set exists for what Claude writes, but the checker does not care who wrote the file. Hand it your own document and it reports the same findings. That is a side use, and it works only when you run it.

> Any agent built on Claude Code picks up the skills, but the hook runs in Claude Code itself.

## How many rules there are

Thirty-nine rules cover language and ten sections cover formatting. Here are five of the formatting rules.

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

The Russian set follows its own sources and does not mirror this one rule for rule. The two languages work differently, so the sets stay alike where that helps and part ways where each norm calls for it.

## How to remove it

One command clears the skills, the hooks, and the settings entries:

```bash
cd simple-language && ./uninstall.sh
```

It saves a copy of the old settings beside them as `settings.json.bak`. Restart your Claude session afterwards.

## If you edit the rules

The `tests` folder holds sample files with known violations and the list of findings to expect. One command runs both checkers over them and reports whether the result still matches:

```bash
node tests/run.mjs
```

The same check runs on push: `.github/workflows/prose.yml` runs the tests and checks the changed documents inside GitHub.

The run covers more than the search patterns. It installs the set into a sandbox and removes it again, checks that other settings survive, and runs both hooks.

Run it after any edit to the search patterns. Patterns break quietly: you fix one rule and a neighbouring one stops firing. When a finding changes on purpose, update `tests/expected.json`.

## Licence

MIT. Use it freely, change it to suit you, pass it on. The full text is in the [LICENSE](LICENSE) file.
