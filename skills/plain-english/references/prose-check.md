# The machine check

Reading your own draft does not catch everything. A passive sentence and a formal word look fine at a glance, and the eye slides over both. A search does not. So a script sits next to this skill and reads the finished file for you.

## How to run it

Point it at one file, or at several:

```
node ~/.claude/skills/plain-english/scripts/prose-check.mjs "path/to/file.md"
```

Give it no path and it checks every `.md` file under the current project, skipping `.git`, `.claude`, and `node_modules`.

Two flags change what happens:

- `--strict` makes the script exit with an error when it finds anything strict, which is what you want in a hook or a build.
- `--all` adds the advisory findings that the script hides by default.

## What it catches

Strict findings point at something the rules name outright. Advisory findings are guesses that need your eye.

| What it flags | Kind |
|---|---|
| A formal word with a plain equivalent, such as `utilise` or `commence` | strict |
| A hidden verb, such as `provide assistance to` | strict |
| Empty link text, such as `here`, `click here`, or a bare URL | strict |
| A sentence over 25 words | strict |
| A run of words in capital letters | strict |
| Possible passive voice | advisory |
| A subjective or hype adjective, such as `seamless` | advisory, needs `--all` |

The script ignores what the rules do not govern: front matter, fenced code blocks, inline code, link targets, and any line holding 🚫, ✅, or ❌, because those lines are deliberate examples of poor writing.

## What it will not do

The check fixes nothing. It shows the spot and says what is wrong, and you decide. Some findings are false alarms, and that is normal. The passive-voice test guesses from word shape, so it flags `is followed` and `is built` wherever they appear.

## Extending the word lists

The words live beside the script in `prose-rules.json`, under four keys: `formal`, `hidden-verbs`, `empty-links`, and `hype`. Edit them by hand. Spot a formal word the check missed, add a line with its plain replacement, and the check gets better for every document after it.
